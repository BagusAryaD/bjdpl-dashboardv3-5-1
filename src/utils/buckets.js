// Definisi 7 kelompok masa hari (bucket aging) yang dikenali sistem.
// `key` dipakai sebagai identitas internal & untuk mendeteksi kolom di file upload.
// `label` dipakai untuk judul kolom / legend di dashboard.
// `color` dipakai untuk donut chart & legend, urutan sama seperti dashboard sebelumnya.

export const BUCKET_DEFS = [
  { key: '1-15', label: '1\u201315 HARI', color: '#0C8B5E' },
  { key: '16-30', label: '16\u201330 HARI', color: '#3fae5a' },
  { key: '31-45', label: '31\u201345 HARI', color: '#e8792c' },
  { key: '46-60', label: '46\u201360 HARI', color: '#d3372f' },
  { key: '61-75', label: '61\u201375 HARI', color: '#C79A3B' },
  { key: '76-90', label: '76\u201390 HARI', color: '#2f6fb0' },
  { key: '>90', label: '>90 HARI', color: '#8a4fc9' },
];

// Alias nama kolom yang akan dicoba cocokkan saat membaca header file upload.
// Semua dibandingkan setelah dinormalisasi (huruf besar, tanpa spasi, tanpa strip/en-dash).
export const BUCKET_ALIASES = {
  '1-15': ['1-15', '1\u201315', '115'],
  '16-30': ['16-30', '16\u201330', '1630'],
  '31-45': ['31-45', '31\u201345', '3145'],
  '46-60': ['46-60', '46\u201360', '4660'],
  '61-75': ['61-75', '61\u201375', '6175'],
  '76-90': ['76-90', '76\u201390', '7690'],
  '>90': ['>90', '90+', 'GT90', 'LEBIH90', 'LEBIHDARI90', 'DIATAS90'],
};

export function bucketByKey(key) {
  return BUCKET_DEFS.find((b) => b.key === key);
}

// Data mentah format "UMUR BJDPL" menulis ordinal 1-7 di depan teks, mis.
// "1 : 1 sd 15 Hari", "7 : Lebih dari 90 Hari". Ordinalnya selalu urut sama
// seperti BUCKET_DEFS, jadi pemetaannya langsung berdasar urutan array itu.
export const ORDINAL_TO_BUCKET_KEY = {
  1: '1-15',
  2: '16-30',
  3: '31-45',
  4: '46-60',
  5: '61-75',
  6: '76-90',
  7: '>90',
};
