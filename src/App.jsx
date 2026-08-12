import { useState } from 'react';
import UploadManager from './components/UploadManager';
import FilterBar from './components/FilterBar';
import Dashboard from './components/Dashboard';
import logo from './assets/pegadaian-logo.png';

export default function App() {
  const [dataByDate, setDataByDate] = useState({});
  const [filters, setFilters] = useState({ tanggal: null, area: null, cabang: null });

  const dates = Object.keys(dataByDate).sort();

  // Dihitung langsung tiap render (bukan lewat useEffect) supaya tidak ada
  // race condition saat beberapa file diupload sekaligus -- selalu jatuh ke
  // tanggal terbaru yang tersedia, kecuali user sudah memilih tanggal lain
  // yang masih valid.
  const effectiveTanggal =
    filters.tanggal && dataByDate[filters.tanggal] ? filters.tanggal : dates[dates.length - 1] || null;
  const effectiveFilters = { ...filters, tanggal: effectiveTanggal };

  return (
    <div className="app-shell">
      <nav className="app-nav no-print">
        <div className="app-nav-inner">
          <div className="brand">
            <img className="brand-logo" src={logo} alt="Pegadaian" />
            <span className="brand-text">
              <strong>BJDPL</strong>
              <small>Generator Dashboard · Wilayah</small>
            </span>
          </div>
        </div>
      </nav>

      <div className="page-hero no-print">
        <div className="page-hero-inner">
          <h1>
            Dashboard Monitoring <span className="accent">BJDPL</span> — Wilayah
          </h1>
          <p>
            Upload data harian mentah &rarr; filter Area/Cabang/Tanggal &rarr; dashboard otomatis.
            Semua pemrosesan terjadi di browser Anda &mdash; data tidak pernah dikirim ke mana pun.
          </p>
        </div>
      </div>

      <main className="app-main">
        <section className="section-shell">
          <UploadManager dataByDate={dataByDate} setDataByDate={setDataByDate} />
        </section>

        {dates.length > 0 && (
          <section className="section-shell section-light">
            <FilterBar dataByDate={dataByDate} filters={effectiveFilters} setFilters={setFilters} />
          </section>
        )}

        {dates.length === 0 ? (
          <section className="section-shell">
            <div className="panel-box hint">
              Belum ada data. Upload minimal 1 file data harian di atas untuk mulai melihat dashboard.
            </div>
          </section>
        ) : (
          <section className="section-shell">
            <Dashboard dataByDate={dataByDate} filters={effectiveFilters} />
          </section>
        )}
      </main>

      <footer className="app-footer no-print">
        <div className="app-footer-inner">
          <div className="footer-note">
            Generator Dashboard BJDPL — Pegadaian. Data hilang saat tab ditutup (tidak ada penyimpanan permanen).
          </div>
        </div>
      </footer>
    </div>
  );
}
