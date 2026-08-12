import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Membaca file (File object dari <input type="file">) dan mengembalikan
// { headers: string[], rows: object[] } dengan key = header asli dari file.
export async function readTabularFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return readCsv(file);
  }
  return readXlsx(file);
}

function readCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => {
        const headers = result.meta.fields || [];
        resolve({ headers, rows: result.data });
      },
      error: (err) => reject(err),
    });
  });
}

async function readXlsx(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
  const headers = json.length > 0 ? Object.keys(json[0]) : [];
  return { headers, rows: json };
}

export function parseNumberCell(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const cleaned = v.toString().trim().replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-') return 0;
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
