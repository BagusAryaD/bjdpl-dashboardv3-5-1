export function formatRupiah(n) {
  const num = Number(n) || 0;
  const rounded = Math.round(num);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded).toString();
  const withDots = abs.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp${withDots}`;
}

// Sama seperti formatRupiah, tapi menampilkan "-" untuk nilai 0 (gaya umum
// laporan Excel), supaya sel-sel kosong tidak penuh dengan "Rp0".
export function formatRupiahOrDash(n) {
  const num = Number(n) || 0;
  if (Math.round(num) === 0) return '-';
  return formatRupiah(num);
}

// Format ringkas (mis. "179,8jt", "23,7M", "250rb") khusus dipakai pada
// kolom-kolom sempit saat cetak (sub-kolom Umur BJDPL), supaya angka besar
// tidak pernah meluber / tumpang tindih ke sel sebelahnya walau lebar kolom
// dibuat sangat sempit.
export function formatRupiahCompact(n) {
  const num = Math.round(Number(n) || 0);
  if (num === 0) return '-';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const trim = (x) => {
    const r = Math.round(x * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
  };
  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)}M`;
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}jt`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}rb`;
  return `${sign}${abs}`;
}

export function formatNumber(n) {
  const num = Number(n) || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatPercent(n, digits = 2) {
  return Number(n).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDateID(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return isoDate;
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// Versi ringkas tanpa tahun, huruf besar semua (dipakai untuk nama file PDF
// hasil cetak, mis. "5 AGUSTUS").
export function formatDayMonthID(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return isoDate;
  const bulan = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
  ];
  return `${d.getDate()} ${bulan[d.getMonth()]}`;
}
