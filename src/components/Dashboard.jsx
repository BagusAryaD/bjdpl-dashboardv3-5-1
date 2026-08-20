import { useMemo, useRef } from 'react';
import {
  filterRows, aggregateByOutlet, detectActiveBuckets, aggregateByBucket,
  grandTotal, topProducts, topMtmOutlets, trendByDay,
} from '../utils/rawAggregate';
import { formatRupiah, formatDateID, formatDayMonthID } from '../utils/format';
import { printWithTitle } from '../utils/printTitle';
import LineChart from './LineChart';
import TopList from './TopList';
import DetailTable from './DetailTable';
import logo from '../assets/pegadaian-logo.png';
import cssText from '../styles.css?raw';

export default function Dashboard({ dataByDate, filters }) {
  const areaRef = useRef(null);
  const selectedDay = dataByDate[filters.tanggal];
  const hasMultipleDays = Object.keys(dataByDate).length > 1;

  const data = useMemo(() => {
    if (!selectedDay) return null;
    const scopedRows = filterRows(selectedDay.rows, filters);
    const outletAgg = aggregateByOutlet(scopedRows);
    const activeBuckets = detectActiveBuckets(scopedRows);
    const bucketTotals = aggregateByBucket(scopedRows);
    const total = grandTotal(scopedRows);
    const outletTerbesar = outletAgg[0] || null;
    const top5Produk = topProducts(scopedRows, 5);
    const top5Mtm = topMtmOutlets(outletAgg, 5);
    const trend = trendByDay(dataByDate, filters);

    return {
      wilayahName: selectedDay.wilayahName,
      scopedRows, outletAgg, activeBuckets, bucketTotals, total,
      outletTerbesar, top5Produk, top5Mtm, trend,
    };
  }, [selectedDay, dataByDate, filters]);

  if (!data) {
    return <div className="panel-box hint">Belum ada data untuk tanggal ini.</div>;
  }

  const {
    wilayahName, activeBuckets, bucketTotals, total,
    outletTerbesar, top5Produk, top5Mtm, trend,
  } = data;

  const agingPoints = activeBuckets.map((b) => ({
    label: b.label.replace(' HARI', ''),
    value: bucketTotals[b.key].bjdpl,
  }));
  const trendBjdplPoints = trend.map((t) => ({
    label: formatDateID(t.tanggal).replace(/^(\d+) (\w+) .*/, '$1 $2'),
    value: t.bjdpl,
  }));

  function handlePrint() {
    const label = filters.cabang || filters.area || wilayahName;
    const title = filters.tanggal ? `BJDPL ${label} ${formatDayMonthID(filters.tanggal)}` : `BJDPL ${label}`;
    printWithTitle(title);
  }

  function handleDownloadHtml() {
    const inner = areaRef.current?.innerHTML || '';
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Rekap BJDPL Wilayah ${escapeHtml(wilayahName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:28px;background:#F6F2E7;font-family:'Inter',Arial,Helvetica,sans-serif;color:#0B1F16;}
${cssText}
/* Saat file HTML hasil export ini dibuka & dilihat langsung (bukan cetak),
   tabel tetap tampil penuh, tidak dibatasi scroll. */
.outlet-table-scroll { max-height: none !important; overflow: visible !important; }
</style>
</head>
<body>
${inner}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap_bjdpl_wilayah_${slug(wilayahName)}_${filters.tanggal}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="btn-row no-print" style={{ marginBottom: 16 }}>
        <button className="btn btn-gold" onClick={handleDownloadHtml}>&#11015; Download HTML</button>
        <button className="btn btn-primary" onClick={handlePrint}>&#128424; Cetak / Simpan PDF (Ctrl+P)</button>
      </div>

      <div id="dash-print-area" ref={areaRef}>
        <div className="dash-root">
          <div className="dash-header">
            <img className="dash-logo" src={logo} alt="Pegadaian" />
            <div className="dash-title-block">
              <h1>REKAP BJDPL WILAYAH {wilayahName}</h1>
              <div><span className="dash-aging-pill">AGING {agingRangeLabel(activeBuckets)}</span></div>
              <div className="dash-period">Periode Data : {formatDateID(filters.tanggal)}</div>
              {(filters.area || filters.cabang) && (
                <div className="dash-period" style={{ marginTop: 2 }}>
                  {filters.area && <>Area: <b>{filters.area}</b></>}
                  {filters.area && filters.cabang && ' — '}
                  {filters.cabang && <>Cabang: <b>{filters.cabang}</b></>}
                </div>
              )}
            </div>
            <div className="dash-badge">
              <div className="label">WILAYAH</div>
              <div className="value">{wilayahName}</div>
            </div>
          </div>

          <div className="dash-kpi-row">
            <div className="dash-kpi-card">
              <div className="kpi-title">TOTAL BJDPL</div>
              <div className="kpi-value">{formatRupiah(total.bjdpl)}</div>
              <div className="kpi-sub">Total seluruh kelompok masa hari</div>
            </div>
            <div className="dash-kpi-card">
              <div className="kpi-title">OUTLET TERBESAR (NOMINAL)</div>
              <div className="kpi-value">{outletTerbesar?.outletName || '-'}</div>
              <div className="kpi-sub">{outletTerbesar ? formatRupiah(outletTerbesar.totalBjdpl) : '-'}</div>
            </div>
          </div>

          <div className="dash-panel dash-panel-wide">
            <div className="dash-panel-title">BESAR BJDPL PER UMUR (AGING)</div>
            <div className="dash-panel-body">
              <LineChart points={agingPoints} color="#00573F" valueFormatter={formatRupiah} />
            </div>
          </div>

          {hasMultipleDays && (
            <div className="dash-panel dash-panel-wide">
              <div className="dash-panel-title">TREN TOTAL BJDPL PER HARI</div>
              <div className="dash-panel-body">
                <LineChart points={trendBjdplPoints} color="#0C8B5E" valueFormatter={formatRupiah} />
              </div>
            </div>
          )}

          <div className="dash-bottom-row dash-bottom-row-2">
            <div className="dash-panel">
              <div className="dash-panel-title">TOP 5 OUTLET DENGAN KENAIKAN BJDPL (RP MTM) TERBESAR</div>
              <div className="dash-panel-body">
                <TopList
                  items={top5Mtm.map((o) => ({ label: o.outletName, value: o.totalRpMtm }))}
                  color="#C79A3B"
                />
              </div>
            </div>
            <div className="dash-panel">
              <div className="dash-panel-title">TOP 5 PRODUK DENGAN BJDPL TERBESAR</div>
              <div className="dash-panel-body">
                <TopList
                  items={top5Produk.map((p) => ({ label: p.product, value: p.bjdpl }))}
                  color="#0C8B5E"
                />
              </div>
            </div>
          </div>

          <DetailTable dataByDate={dataByDate} />
        </div>
      </div>
    </div>
  );
}

function agingRangeLabel(activeBuckets) {
  if (!activeBuckets || activeBuckets.length === 0) return '';
  const first = activeBuckets[0].label.replace(' HARI', '');
  const last = activeBuckets[activeBuckets.length - 1].label.replace(' HARI', '');
  if (activeBuckets.length === 1) return `${first} HARI`;
  return `${first} s.d. ${last} HARI`;
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function slug(s) {
  return (s || 'wilayah').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
}
