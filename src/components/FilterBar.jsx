import { useMemo } from 'react';
import { formatDateID } from '../utils/format';

export default function FilterBar({ dataByDate, filters, setFilters }) {
  const dates = useMemo(() => Object.keys(dataByDate).sort(), [dataByDate]);
  const selectedDay = dataByDate[filters.tanggal];
  const dayRows = selectedDay?.rows || [];

  const areaOptions = useMemo(() => {
    const set = new Set(dayRows.map((r) => r.areaName));
    return Array.from(set).sort();
  }, [dayRows]);

  const cabangOptions = useMemo(() => {
    const scoped = filters.area ? dayRows.filter((r) => r.areaName === filters.area) : dayRows;
    const set = new Set(scoped.map((r) => r.cabangName));
    return Array.from(set).sort();
  }, [dayRows, filters.area]);

  return (
    <div className="panel-box filter-bar">
      <div className="filter-field">
        <label>Tanggal</label>
        <select
          value={filters.tanggal || ''}
          onChange={(e) => setFilters((f) => ({ ...f, tanggal: e.target.value }))}
        >
          {dates.map((d) => (
            <option key={d} value={d}>{formatDateID(d)}</option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label>Area</label>
        <select
          value={filters.area || ''}
          onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value || null, cabang: null }))}
        >
          <option value="">Semua Area</option>
          {areaOptions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label>Cabang</label>
        <select
          value={filters.cabang || ''}
          onChange={(e) => setFilters((f) => ({ ...f, cabang: e.target.value || null }))}
        >
          <option value="">Semua Cabang</option>
          {cabangOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
