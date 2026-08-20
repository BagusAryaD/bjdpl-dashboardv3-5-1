// src/utils/generateDemoData.js
// Generator data demo fiktif untuk Dashboard BJDPL.
// Mengembalikan objek dataByDate yang bisa langsung dipakai oleh App.jsx.

const KANWIL_NAME = 'JAKARTA 2';

const AREAS = [
  { code: '01', name: 'JAKARTA PUSAT' },
  { code: '02', name: 'JAKARTA UTARA' },
  { code: '03', name: 'JAKARTA BARAT' },
];

const CABANGS = [
  { code: '0101', name: 'CABANG MENTENG', areaCode: '01' },
  { code: '0102', name: 'CABANG TANAH ABANG', areaCode: '01' },
  { code: '0201', name: 'CABANG TANJUNG PRIOK', areaCode: '02' },
  { code: '0202', name: 'CABANG KOJA', areaCode: '02' },
  { code: '0301', name: 'CABANG KEBON JERUK', areaCode: '03' },
  { code: '0302', name: 'CABANG CENGKARENG', areaCode: '03' },
];

const OUTLETS = [
  { code: '10101', name: 'CP MENTENG SQUARE', cabangCode: '0101' },
  { code: '10102', name: 'CABANG MENTENG', cabangCode: '0101' },
  { code: '10103', name: 'CP TAMAN SARI', cabangCode: '0101' },
  { code: '10104', name: 'CABANG PECENONGAN', cabangCode: '0101' },
  { code: '10105', name: 'CP PASAR BARU', cabangCode: '0101' },
  { code: '10106', name: 'CABANG GONDANGDIA', cabangCode: '0101' },

  { code: '10201', name: 'CABANG TANAH ABANG', cabangCode: '0102' },
  { code: '10202', name: 'CP KARET', cabangCode: '0102' },
  { code: '10203', name: 'CABANG KAMPUNG BAMBU', cabangCode: '0102' },
  { code: '10204', name: 'CP SENEN', cabangCode: '0102' },
  { code: '10205', name: 'CABANG KRAMAT', cabangCode: '0102' },

  { code: '20101', name: 'CABANG TANJUNG PRIOK', cabangCode: '0201' },
  { code: '20102', name: 'CP SUNTER', cabangCode: '0201' },
  { code: '20103', name: 'CABANG PLUIT', cabangCode: '0201' },
  { code: '20104', name: 'CP Muara Angke', cabangCode: '0201' },
  { code: '20105', name: 'CABANG PENJARINGAN', cabangCode: '0201' },
  { code: '20106', name: 'CP KAMAL', cabangCode: '0201' },

  { code: '20201', name: 'CABANG KOJA', cabangCode: '0202' },
  { code: '20202', name: 'CP RAWA BADAK', cabangCode: '0202' },
  { code: '20203', name: 'CABANG TUGU UTARA', cabangCode: '0202' },
  { code: '20204', name: 'CP LAGOA', cabangCode: '0202' },
  { code: '20205', name: 'CABANG KELAPA GADING', cabangCode: '0202' },

  { code: '30101', name: 'CABANG KEBON JERUK', cabangCode: '0301' },
  { code: '30102', name: 'CP SHERWOOD', cabangCode: '0301' },
  { code: '30103', name: 'CABANG PALMERAH', cabangCode: '0301' },
  { code: '30104', name: 'CP KEMANGGISAN', cabangCode: '0301' },
  { code: '30105', name: 'CABANG SLIPI', cabangCode: '0301' },

  { code: '30201', name: 'CABANG CENGKARENG', cabangCode: '0302' },
  { code: '30202', name: 'CP KAPUK', cabangCode: '0302' },
  { code: '30203', name: 'CABANG KALIDERES', cabangCode: '0302' },
  { code: '30204', name: 'CP TAMBAK', cabangCode: '0302' },
  { code: '30205', name: 'CABANG GROGOL', cabangCode: '0302' },
];

const PRODUCTS = [
  { name: 'KREASI', subProducts: ['KREASI REGULER', 'KREASI PREMIUM'] },
  { name: 'MULIA', subProducts: ['MULIA EMAS', 'MULIA PLATINUM'] },
  { name: 'AMANAH', subProducts: ['AMANAH RODA 2', 'AMANAH RODA 4'] },
  { name: 'CEPAT', subProducts: ['CEPAT UNTUNG', 'CEPAT CAIR'] },
  { name: 'FLUKSI', subProducts: ['FLUKSI BISNIS', 'FLUKSI KONSUMSI', 'FLUKSI MODAL KERJA'] },
];

// Bobot distribusi 7 bucket (sum = 1.00)
// Realistis: mayoritas masih muda, sedikit yang aging lama
const BUCKET_WEIGHTS = {
  '1-15': 0.35,
  '16-30': 0.20,
  '31-45': 0.15,
  '46-60': 0.12,
  '61-75': 0.08,
  '76-90': 0.06,
  '>90': 0.04,
};

const BUCKET_KEYS = Object.keys(BUCKET_WEIGHTS);

// Seed pseudo-random untuk data deterministik
let _seed = 42;
function rand() {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function randBetween(min, max) {
  return Math.round(min + rand() * (max - min));
}

// Menghasilkan satu hari data
function generateDayRows() {
  const rows = [];

  for (const outlet of OUTLETS) {
    const cabang = CABANGS.find((c) => c.code === outlet.cabangCode);
    const area = AREAS.find((a) => a.code === cabang.areaCode);

    for (const prod of PRODUCTS) {
      for (const subProd of prod.subProducts) {
        // Setiap kombinasi outlet x product x subProduct punya baris per bucket
        // Tapi tidak semua kombinasi harus ada (beberapa skip agar realistis)
        const skipChance = rand();
        if (skipChance < 0.15) continue; // 15% kombinasi tidak ada data

        for (const bucketKey of BUCKET_KEYS) {
          const weight = BUCKET_WEIGHTS[bucketKey];
          // Base value per baris: Rp 500rb - Rp 350jt, dikali bobot bucket
          const baseValue = randBetween(500_000, 350_000_000);
          // Fluktuasi hari: +/- 15% dari base
          const dayFactor = 1 + (rand() - 0.5) * 0.30;
          const bjdpl = Math.round(baseValue * weight * dayFactor);

          // RP MTM: beberapa outlet punya kenaikan besar, kebanyakan kecil
          let rpMtm = 0;
          const mtmChance = rand();
          if (mtmChance < 0.30) {
            // 30% baris punya MTM signifikan
            rpMtm = randBetween(1_000_000, 50_000_000) * (rand() > 0.3 ? 1 : -1);
          } else if (mtmChance < 0.60) {
            rpMtm = randBetween(-5_000_000, 5_000_000);
          }

          rows.push({
            areaCode: area.code,
            areaName: area.name,
            cabangCode: cabang.code,
            cabangName: cabang.name,
            outletCode: outlet.code,
            outletName: outlet.name,
            isCp: /^CP\b/i.test(outlet.name.trim()),
            bucketKey,
            product: prod.name,
            subProduct: subProd,
            bjdpl,
            rpMtm,
          });
        }
      }
    }
  }

  return rows;
}

// Tanggal demo: 16-20 Agustus 2026
const DEMO_DATES = [
  '2026-08-16',
  '2026-08-17',
  '2026-08-18',
  '2026-08-19',
  '2026-08-20',
];

/**
 * Menghasilkan data demo fiktif untuk 5 hari.
 * Mengembalikan objek yang bisa langsung dipakai sebagai state dataByDate.
 * Setiap hari punya jumlah baris yang konsisten tetapi nilai bervariasi
 * (fluktuasi realistis hari-ke-hari).
 */
export function generateDemoData() {
  _seed = 42; // reset seed agar deterministik

  const dataByDate = {};

  for (let i = 0; i < DEMO_DATES.length; i++) {
    const tanggal = DEMO_DATES[i];
    const rows = generateDayRows();
    dataByDate[tanggal] = {
      tanggal,
      wilayahName: KANWIL_NAME,
      rows,
    };
  }

  return dataByDate;
}
