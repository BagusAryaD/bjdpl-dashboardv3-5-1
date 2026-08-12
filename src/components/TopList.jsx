import { formatRupiah } from '../utils/format';

// items: [{ label, value }]
export default function TopList({ items, color = '#0C8B5E' }) {
  if (!items || items.length === 0) {
    return <div className="chart-empty">Belum ada data untuk ditampilkan.</div>;
  }
  const maxV = Math.max(...items.map((i) => Math.abs(i.value)), 1);

  return (
    <div className="toplist">
      {items.map((item, i) => (
        <div className="toplist-row" key={i}>
          <div className="toplist-label">{item.label}</div>
          <div className="toplist-bar-track">
            <div
              className="toplist-bar-fill"
              style={{ width: `${(Math.abs(item.value) / maxV) * 100}%`, background: color }}
            />
          </div>
          <div className="toplist-value">{formatRupiah(item.value)}</div>
        </div>
      ))}
    </div>
  );
}
