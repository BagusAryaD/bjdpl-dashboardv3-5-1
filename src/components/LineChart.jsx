import { useState } from 'react';

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 56;
const PAD_RIGHT = 20;
const PAD_TOP = 20;
const PAD_BOTTOM = 34;

// points: [{ label, value }]
export default function LineChart({ points, color = '#00573F', valueFormatter = (v) => v }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!points || points.length === 0) {
    return <div className="chart-empty">Belum ada data untuk ditampilkan.</div>;
  }

  const values = points.map((p) => p.value);
  const maxV = Math.max(...values, 0);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i) =>
    points.length === 1 ? PAD_LEFT + innerW / 2 : PAD_LEFT + (i / (points.length - 1)) * innerW;
  const yFor = (v) => PAD_TOP + innerH - ((v - minV) / range) * innerH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`).join(' ');

  // Garis bantu horizontal (grid) di 0%, 50%, 100%
  const gridLines = [0, 0.5, 1].map((f) => PAD_TOP + innerH * f);

  return (
    <div className="linechart-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="linechart-svg">
        {gridLines.map((y, i) => (
          <line key={i} x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} className="linechart-grid" />
        ))}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={xFor(i)}
              cy={yFor(p.value)}
              r={hoverIdx === i ? 6 : 4}
              fill={color}
              stroke="#fff"
              strokeWidth="1.5"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'pointer' }}
            />
            <text x={xFor(i)} y={HEIGHT - PAD_BOTTOM + 16} textAnchor="middle" className="linechart-xlabel">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      {hoverIdx !== null && (
        <div
          className="linechart-tooltip"
          style={{
            left: `${(xFor(hoverIdx) / WIDTH) * 100}%`,
            top: `${(yFor(points[hoverIdx].value) / HEIGHT) * 100}%`,
          }}
        >
          <div className="linechart-tooltip-label">{points[hoverIdx].label}</div>
          <div className="linechart-tooltip-value">{valueFormatter(points[hoverIdx].value)}</div>
        </div>
      )}
    </div>
  );
}
