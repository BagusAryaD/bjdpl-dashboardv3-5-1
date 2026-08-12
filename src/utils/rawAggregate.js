import { BUCKET_DEFS } from './buckets';

// Menyaring baris detail 1 hari berdasarkan filter Area & Cabang yang aktif
// (dipakai untuk filter atas / ringkasan dashboard).
export function filterRows(rows, { area, cabang }) {
  return rows.filter(
    (r) => (!area || r.areaName === area) && (!cabang || r.cabangName === cabang)
  );
}

// Agregasi per OUTLET: jumlahkan bjdpl per bucket, lintas semua produk.
// Hasil diurutkan menurun berdasar total BJDPL.
export function aggregateByOutlet(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.outletCode)) {
      map.set(r.outletCode, {
        outletCode: r.outletCode,
        outletName: r.outletName,
        cabangName: r.cabangName,
        areaName: r.areaName,
        isCp: r.isCp,
        values: {},
        totalBjdpl: 0,
        totalRpMtm: 0,
      });
    }
    const o = map.get(r.outletCode);
    if (!o.values[r.bucketKey]) o.values[r.bucketKey] = { bjdpl: 0 };
    o.values[r.bucketKey].bjdpl += r.bjdpl;
    o.totalBjdpl += r.bjdpl;
    o.totalRpMtm += r.rpMtm;
  }
  return Array.from(map.values()).sort((a, b) => b.totalBjdpl - a.totalBjdpl);
}

// Bucket mana saja yang benar-benar aktif (punya data) di baris yang difilter.
export function detectActiveBuckets(rows) {
  const present = new Set(rows.map((r) => r.bucketKey));
  return BUCKET_DEFS.filter((b) => present.has(b.key));
}

// Total per bucket, dipakai untuk donut chart & line chart aging.
export function aggregateByBucket(rows) {
  const totals = {};
  for (const b of BUCKET_DEFS) totals[b.key] = { bjdpl: 0 };
  for (const r of rows) {
    totals[r.bucketKey].bjdpl += r.bjdpl;
  }
  return totals;
}

export function grandTotal(rows) {
  return rows.reduce(
    (acc, r) => {
      acc.bjdpl += r.bjdpl;
      return acc;
    },
    { bjdpl: 0 }
  );
}

// Top-N produk berdasar total BJDPL (kolom PRODUCT).
export function topProducts(rows, n = 5) {
  const map = new Map();
  for (const r of rows) {
    map.set(r.product, (map.get(r.product) || 0) + r.bjdpl);
  }
  return Array.from(map.entries())
    .map(([product, bjdpl]) => ({ product, bjdpl }))
    .sort((a, b) => b.bjdpl - a.bjdpl)
    .slice(0, n);
}

// Top-N outlet dengan RP MTM (kenaikan BJDPL dari bulan lalu) terbesar.
export function topMtmOutlets(outletAgg, n = 5) {
  return [...outletAgg].sort((a, b) => b.totalRpMtm - a.totalRpMtm).slice(0, n);
}

// Tren harian (lintas semua tanggal yang sudah diupload), mengikuti filter
// Area/Cabang tapi TIDAK mengikuti filter tanggal snapshot -- BJDPL adalah
// saldo per titik waktu, jadi tiap hari ditampilkan sebagai titik terpisah,
// bukan diakumulasi.
export function trendByDay(dataByDate, { area, cabang }) {
  return Object.values(dataByDate)
    .map((day) => {
      const scoped = filterRows(day.rows, { area, cabang });
      const totals = grandTotal(scoped);
      return { tanggal: day.tanggal, bjdpl: totals.bjdpl };
    })
    .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
}

// Tanggal ISO (yyyy-mm-dd) +/- n hari kalender.
export function isoAddDays(iso, delta) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Daftar nilai SUB PRODUCT NM yang muncul untuk 1 cabang tertentu, gabungan
// dari tanggal yang difilter maupun H-1 nya (supaya produk yang cuma ada di
// salah satu hari tetap muncul sebagai opsi filter).
export function subProductOptionsForCabang(dataByDate, tanggal, cabang) {
  if (!tanggal || !cabang) return [];
  const prevTanggal = isoAddDays(tanggal, -1);
  const set = new Set();
  (dataByDate[tanggal]?.rows || []).forEach((r) => {
    if (r.cabangName === cabang) set.add(r.subProduct);
  });
  (dataByDate[prevTanggal]?.rows || []).forEach((r) => {
    if (r.cabangName === cabang) set.add(r.subProduct);
  });
  return Array.from(set).sort();
}

// Membangun struktur tabel pivot: 1 baris per kombinasi Outlet x Produk (SUB
// PRODUCT NM), dengan UMUR BJDPL sebagai sub-kolom (1-15, 16-30, ..., >90),
// dibandingkan dengan H-1 (tanggal - 1 hari kalender). Hanya cabang tunggal
// yang didukung. Setiap outlet punya baris subtotal ("... Total"), dan ada
// 1 grand total untuk keseluruhan cabang.
// Kombinasi outlet+produk yang bernilai 0 di kedua hari (hari ini & H-1)
// dibuang karena tidak informatif (delta pasti 0).
export function buildPivotTable(dataByDate, { tanggal, cabang, products }) {
  const emptyBuckets = () => {
    const b = {};
    for (const def of BUCKET_DEFS) b[def.key] = { current: 0, prev: 0 };
    return b;
  };

  if (!tanggal || !cabang) {
    return { outlets: [], grandTotal: { buckets: emptyBuckets(), current: 0, prev: 0, delta: 0 }, prevTanggal: null };
  }

  const prevTanggal = isoAddDays(tanggal, -1);
  const curRows = (dataByDate[tanggal]?.rows || []).filter((r) => r.cabangName === cabang);
  const prevRows = (dataByDate[prevTanggal]?.rows || []).filter((r) => r.cabangName === cabang);

  const productFilter = products && products.length > 0 ? new Set(products) : null;
  const curFiltered = productFilter ? curRows.filter((r) => productFilter.has(r.subProduct)) : curRows;
  const prevFiltered = productFilter ? prevRows.filter((r) => productFilter.has(r.subProduct)) : prevRows;

  const outletMap = new Map(); // outletCode -> { outletCode, outletName, products: Map(product -> row) }

  function ensureOutlet(code, name) {
    if (!outletMap.has(code)) {
      outletMap.set(code, { outletCode: code, outletName: name, products: new Map() });
    }
    return outletMap.get(code);
  }

  function ensureProduct(outlet, product) {
    if (!outlet.products.has(product)) {
      outlet.products.set(product, { product, buckets: emptyBuckets(), current: 0, prev: 0 });
    }
    return outlet.products.get(product);
  }

  function accumulate(rows, field) {
    for (const r of rows) {
      const outlet = ensureOutlet(r.outletCode, r.outletName);
      const prod = ensureProduct(outlet, r.subProduct);
      prod.buckets[r.bucketKey][field] += r.bjdpl;
      prod[field] += r.bjdpl;
    }
  }

  accumulate(curFiltered, 'current');
  accumulate(prevFiltered, 'prev');

  const outlets = [];
  const grandTotal = { buckets: emptyBuckets(), current: 0, prev: 0 };

  for (const outlet of outletMap.values()) {
    const productsArr = Array.from(outlet.products.values())
      .filter((p) => p.current !== 0 || p.prev !== 0)
      .map((p) => ({ ...p, delta: p.current - p.prev }))
      .sort((a, b) => a.product.localeCompare(b.product));

    if (productsArr.length === 0) continue;

    const subtotal = { buckets: emptyBuckets(), current: 0, prev: 0 };
    for (const p of productsArr) {
      subtotal.current += p.current;
      subtotal.prev += p.prev;
      for (const def of BUCKET_DEFS) {
        subtotal.buckets[def.key].current += p.buckets[def.key].current;
        subtotal.buckets[def.key].prev += p.buckets[def.key].prev;
      }
    }
    subtotal.delta = subtotal.current - subtotal.prev;

    grandTotal.current += subtotal.current;
    grandTotal.prev += subtotal.prev;
    for (const def of BUCKET_DEFS) {
      grandTotal.buckets[def.key].current += subtotal.buckets[def.key].current;
      grandTotal.buckets[def.key].prev += subtotal.buckets[def.key].prev;
    }

    outlets.push({
      outletCode: outlet.outletCode,
      outletName: outlet.outletName,
      products: productsArr,
      subtotal,
    });
  }
  grandTotal.delta = grandTotal.current - grandTotal.prev;

  outlets.sort((a, b) => a.outletName.localeCompare(b.outletName));

  return { outlets, grandTotal, prevTanggal };
}
