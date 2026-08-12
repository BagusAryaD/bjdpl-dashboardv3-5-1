import { readTabularFile, parseNumberCell } from './fileReader';
import { ORDINAL_TO_BUCKET_KEY } from './buckets';

// Nama kolom persis seperti hasil export sumber data (selalu sama setiap
// export, sesuai konfirmasi). Key di sini adalah nama field internal yang
// dipakai di seluruh aplikasi.
// Catatan: file yang diupload sekarang HANYA berisi data nominal BJDPL --
// tidak ada lagi kolom REK BJDPL BULAN INI, dan tidak ada lagi kolom TANGGAL
// (tanggal diambil dari nama file, bukan dari isi data).
const COLUMN_MAP = {
  KANWIL: 'kanwil',
  AREA: 'area',
  CABANG: 'cabang',
  OUTLET: 'outlet',
  'UMUR BJDPL': 'umurBjdpl',
  'BJDPL BULAN INI': 'bjdplBulanIni',
  'RP MTM': 'rpMtm',
  PRODUCT: 'product',
  'SUB PRODUCT NM': 'subProduct',
};

function normalizeHeader(h) {
  return h.toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

// Bangun mapping { fieldInternal: namaHeaderAsli } dari daftar header file.
function buildHeaderMap(headers) {
  const map = {};
  for (const h of headers) {
    const norm = normalizeHeader(h);
    if (COLUMN_MAP[norm]) {
      map[COLUMN_MAP[norm]] = h;
    }
  }
  return map;
}

// "12754:CP TANJUNG PRIOK" -> { code: "12754", name: "CP TANJUNG PRIOK" }
function parseCodeName(raw) {
  const s = (raw ?? '').toString().trim();
  const idx = s.indexOf(':');
  if (idx === -1) return { code: '', name: s };
  return { code: s.slice(0, idx).trim(), name: s.slice(idx + 1).trim() };
}

// "16:KANWIL JAKARTA 2" -> "JAKARTA 2"
function parseWilayahName(raw) {
  const { name } = parseCodeName(raw);
  return name.replace(/^KANWIL\s+/i, '').trim();
}

// "1 : 1 sd 15 Hari" -> "1-15" ; "7 : Lebih dari 90 Hari" -> ">90"
function parseUmurBjdplToBucketKey(raw) {
  const s = (raw ?? '').toString().trim();
  const m = s.match(/^(\d+)\s*:/);
  if (!m) return null;
  const ordinal = parseInt(m[1], 10);
  return ORDINAL_TO_BUCKET_KEY[ordinal] || null;
}

// Tanggal sekarang diambil dari NAMA FILE, bukan dari isi data.
// Format nama file yang didukung: "dd-mm-yyyy.xlsx" atau "dd-mm-yyyy.csv"
// (boleh ada teks tambahan sebelum/sesudah pola tanggal, mis.
// "Rekap BJDPL 29-07-2026.xlsx" tetap dikenali).
// Mengembalikan tanggal ISO "yyyy-mm-dd" atau null kalau tidak ditemukan.
export function extractDateFromFilename(filename) {
  const base = filename.replace(/\.[^/.]+$/, ''); // buang ekstensi
  const m = base.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Hasil akhir: 1 grup per file (1 file = 1 tanggal, diambil dari nama file):
// { tanggal, wilayahName, rows: [ {areaName, cabangCode, cabangName,
//   outletCode, outletName, isCp, bucketKey, product, subProduct, bjdpl, rpMtm} ] }
export async function parseRawFile(file) {
  const tanggalIso = extractDateFromFilename(file.name);
  if (!tanggalIso) {
    throw new Error(
      'Tanggal tidak dapat dikenali dari nama file. Pastikan nama file mengikuti format dd-mm-yyyy.xlsx atau dd-mm-yyyy.csv, contoh: 29-07-2026.xlsx.'
    );
  }

  const { headers, rows } = await readTabularFile(file);
  const hMap = buildHeaderMap(headers);

  const requiredFields = ['area', 'cabang', 'outlet', 'umurBjdpl', 'bjdplBulanIni'];
  const missing = requiredFields.filter((f) => !hMap[f]);
  if (missing.length > 0) {
    throw new Error(
      `Kolom wajib tidak ditemukan di file: ${missing
        .map((f) => Object.keys(COLUMN_MAP).find((k) => COLUMN_MAP[k] === f))
        .join(', ')}. Pastikan nama kolom persis sama seperti hasil export.`
    );
  }

  let wilayahName = '';
  const outRows = [];
  let skipped = 0;

  for (const r of rows) {
    const bucketKey = parseUmurBjdplToBucketKey(r[hMap.umurBjdpl]);
    if (!bucketKey) {
      skipped++;
      continue;
    }

    if (!wilayahName && hMap.kanwil) {
      wilayahName = parseWilayahName(r[hMap.kanwil]);
    }

    const area = parseCodeName(r[hMap.area]);
    const cabang = parseCodeName(r[hMap.cabang]);
    const outlet = parseCodeName(r[hMap.outlet]);
    const isCp = /^CP\b/i.test(outlet.name.trim());

    outRows.push({
      areaCode: area.code,
      areaName: area.name,
      cabangCode: cabang.code,
      cabangName: cabang.name,
      outletCode: outlet.code,
      outletName: outlet.name,
      isCp,
      bucketKey,
      product: (r[hMap.product] ?? '').toString().trim() || 'LAINNYA',
      subProduct: (r[hMap.subProduct] ?? '').toString().trim() || 'LAINNYA',
      bjdpl: parseNumberCell(r[hMap.bjdplBulanIni]),
      rpMtm: hMap.rpMtm ? parseNumberCell(r[hMap.rpMtm]) : 0,
    });
  }

  if (outRows.length === 0) {
    throw new Error('Tidak ada baris data valid yang bisa dibaca dari file ini.');
  }

  const dayGroups = [{ tanggal: tanggalIso, wilayahName, rows: outRows }];

  return { dayGroups, totalRows: rows.length, skippedRows: skipped };
}
