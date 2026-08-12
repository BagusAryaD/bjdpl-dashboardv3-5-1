import { Fragment, useEffect, useMemo, useState } from 'react';
import { BUCKET_DEFS } from '../utils/buckets';
import { buildPivotTable, subProductOptionsForCabang } from '../utils/rawAggregate';
import { formatRupiah, formatRupiahOrDash, formatDateID, formatDayMonthID } from '../utils/format';
import { printWithTitle } from '../utils/printTitle';

function formatDelta(n) {
  const num = Number(n) || 0;
  if (num === 0) return '-';
  const sign = num > 0 ? '+' : '-';
  return `${sign}${formatRupiah(Math.abs(num))}`;
}

// Sel sub-kolom Umur BJDPL. Lebar kolomnya sudah diatur eksplisit lewat
// <colgroup> (lihat render tabel di bawah) supaya angka lengkap selalu muat
// tanpa perlu diringkas.
function BucketCell({ value, bold }) {
  const content = formatRupiahOrDash(value);
  return <td>{bold ? <b>{content}</b> : content}</td>;
}

export default function DetailTable({ dataByDate }) {
  const dates = useMemo(() => Object.keys(dataByDate).sort(), [dataByDate]);

  const [tanggal, setTanggal] = useState(null);
  const [area, setArea] = useState(null);
  const [cabang, setCabang] = useState(null);
  const [products, setProducts] = useState(null); // null = semua produk

  const effectiveTanggal = tanggal && dataByDate[tanggal] ? tanggal : dates[dates.length - 1] || null;
  const dayRows = dataByDate[effectiveTanggal]?.rows || [];

  const areaOptions = useMemo(() => {
    const set = new Set(dayRows.map((r) => r.areaName));
    return Array.from(set).sort();
  }, [dayRows]);

  const cabangOptions = useMemo(() => {
    const scoped = area ? dayRows.filter((r) => r.areaName === area) : dayRows;
    const set = new Set(scoped.map((r) => r.cabangName));
    return Array.from(set).sort();
  }, [dayRows, area]);

  const effectiveCabang = cabang && cabangOptions.includes(cabang) ? cabang : cabangOptions[0] || null;

  const productOptions = useMemo(
    () => subProductOptionsForCabang(dataByDate, effectiveTanggal, effectiveCabang),
    [dataByDate, effectiveTanggal, effectiveCabang]
  );

  // Reset pilihan produk ke "semua" setiap kali konteks tanggal/cabang berubah,
  // supaya tidak ada produk pilihan lama yang sudah tidak relevan.
  useEffect(() => {
    setProducts(null);
  }, [effectiveTanggal, effectiveCabang]);

  const effectiveProducts = products !== null ? products : productOptions;

  const { outlets, grandTotal, prevTanggal } = useMemo(
    () => buildPivotTable(dataByDate, { tanggal: effectiveTanggal, cabang: effectiveCabang, products: effectiveProducts }),
    [dataByDate, effectiveTanggal, effectiveCabang, effectiveProducts]
  );

  function toggleProduct(p) {
    setProducts((prev) => {
      const base = prev !== null ? prev : productOptions;
      const set = new Set(base);
      if (set.has(p)) set.delete(p);
      else set.add(p);
      return Array.from(set);
    });
  }

  function selectAllProducts() {
    setProducts(productOptions);
  }
  function clearAllProducts() {
    setProducts([]);
  }

  const allSelected = effectiveProducts.length === productOptions.length;
  const totalOutlets = outlets.length;

  function handlePrintTable() {
    const title = effectiveCabang && effectiveTanggal
      ? `BJDPL ${effectiveCabang} ${formatDayMonthID(effectiveTanggal)}`
      : 'BJDPL';
    printWithTitle(title, { bodyClass: 'print-table-only' });
  }

  return (
    <div className="dash-table-section detail-table-section print-page-break">
      <div className="dash-table-section-header no-print detail-table-filters">
        <div className="detail-filters-row">
          <div className="filter-field">
            <label>Tanggal</label>
            <select value={effectiveTanggal || ''} onChange={(e) => setTanggal(e.target.value)}>
              {dates.map((d) => (
                <option key={d} value={d}>{formatDateID(d)}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Area (bantu cari cabang)</label>
            <select value={area || ''} onChange={(e) => setArea(e.target.value || null)}>
              <option value="">Semua Area</option>
              {areaOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Cabang (pilih 1)</label>
            <select value={effectiveCabang || ''} onChange={(e) => setCabang(e.target.value || null)}>
              {cabangOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="detail-print-btn-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrintTable}
            disabled={!effectiveCabang}
          >
            &#128424; Cetak Tabel
          </button>
        </div>

        <div className="filter-field filter-field-products">
          <label>
            Produk (SUB PRODUCT NM)
            <span className="product-filter-actions">
              <button type="button" className="link-btn" onClick={selectAllProducts}>Pilih Semua</button>
              {' / '}
              <button type="button" className="link-btn" onClick={clearAllProducts}>Kosongkan</button>
            </span>
          </label>
          <div className="product-checklist">
            {productOptions.map((p) => (
              <label key={p} className="product-checkbox">
                <input
                  type="checkbox"
                  checked={effectiveProducts.includes(p)}
                  onChange={() => toggleProduct(p)}
                />
                {p}
              </label>
            ))}
            {productOptions.length === 0 && <span className="hint">Tidak ada produk untuk cabang ini.</span>}
          </div>
          {!allSelected && (
            <div className="hint" style={{ marginTop: 4 }}>
              {effectiveProducts.length} dari {productOptions.length} produk dipilih.
            </div>
          )}
        </div>
      </div>

      <div className="dash-panel-title" style={{ borderRadius: 0 }}>
        RINCIAN PER OUTLET &amp; PRODUK{effectiveCabang ? ` — CABANG ${effectiveCabang}` : ''} ({totalOutlets} outlet)
      </div>

      <div className="outlet-table-scroll">
        <table className="dash-table detail-table pivot-table">
          <colgroup>
            <col className="col-outlet" />
            <col className="col-product" />
            {BUCKET_DEFS.map((b) => (
              <col key={b.key} className="col-bucket" />
            ))}
            <col className="col-total" />
            <col className="col-total" />
            <col className="col-total" />
          </colgroup>
          <thead>
            <tr className="top-row">
              <th rowSpan={2}>OUTLET</th>
              <th rowSpan={2}>PRODUCT</th>
              <th colSpan={BUCKET_DEFS.length}>UMUR BJDPL</th>
              <th rowSpan={2}>BJDPL<br />{effectiveTanggal ? formatDateID(effectiveTanggal) : ''}</th>
              <th rowSpan={2}>BJDPL<br />{prevTanggal ? formatDateID(prevTanggal) : ''}</th>
              <th rowSpan={2}>DELTA</th>
            </tr>
            <tr className="sub-row">
              {BUCKET_DEFS.map((b) => (
                <th key={b.key}>{b.key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {outlets.length === 0 && (
              <tr>
                <td colSpan={4 + BUCKET_DEFS.length} className="chart-empty" style={{ textAlign: 'center' }}>
                  Tidak ada data untuk kombinasi filter ini.
                </td>
              </tr>
            )}
            {outlets.map((o) => (
              <Fragment key={o.outletCode}>
                {o.products.map((p, i) => (
                  <tr key={i}>
                    <td className="upc-name">{o.outletName}</td>
                    <td className="upc-name">{p.product}</td>
                    {BUCKET_DEFS.map((b) => (
                      <BucketCell key={b.key} value={p.buckets[b.key].current} />
                    ))}
                    <td>{formatRupiahOrDash(p.current)}</td>
                    <td>{formatRupiahOrDash(p.prev)}</td>
                    <td className={p.delta > 0 ? 'delta-up' : p.delta < 0 ? 'delta-down' : ''}>
                      {formatDelta(p.delta)}
                    </td>
                  </tr>
                ))}
                <tr className="cabang-row">
                  <td className="upc-name">{o.outletName} Total</td>
                  <td>-</td>
                  {BUCKET_DEFS.map((b) => (
                    <BucketCell key={b.key} value={o.subtotal.buckets[b.key].current} bold />
                  ))}
                  <td><b>{formatRupiahOrDash(o.subtotal.current)}</b></td>
                  <td><b>{formatRupiahOrDash(o.subtotal.prev)}</b></td>
                  <td className={o.subtotal.delta > 0 ? 'delta-up' : o.subtotal.delta < 0 ? 'delta-down' : ''}>
                    <b>{formatDelta(o.subtotal.delta)}</b>
                  </td>
                </tr>
              </Fragment>
            ))}
            {outlets.length > 0 && (
              <tr className="total-row">
                <td colSpan={2}>{effectiveCabang} Total</td>
                {BUCKET_DEFS.map((b) => (
                  <BucketCell key={b.key} value={grandTotal.buckets[b.key].current} />
                ))}
                <td>{formatRupiahOrDash(grandTotal.current)}</td>
                <td>{formatRupiahOrDash(grandTotal.prev)}</td>
                <td>{formatDelta(grandTotal.delta)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
