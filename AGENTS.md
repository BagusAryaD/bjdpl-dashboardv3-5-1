# AGENTS.md — Generator Dashboard BJDPL (Wilayah)

Aplikasi **100% client-side** (React 19 + Vite) untuk mengubah file data harian
mentah BJDPL menjadi dashboard interaktif tingkat Wilayah. Tidak ada server,
database, atau penyimpanan — data hanya hidup di state React dan hilang saat
tab ditutup. Referensi gaya visual resmi: `DOKUMENTASI_DASHBOARD_TEMPLATE.md`
(hanya gaya yang dipinjam, bukan fitur-fiturnya).

## Perintah (Windows — wajib `npm.cmd`, bukan `npm`)

`npm.ps1` diblokir execution policy, jadi semua command harus `npm.cmd`.

```bash
npm.cmd install          # pertama kali
npm.cmd run dev          # dev server
npm.cmd run build        # build produksi -> dist/ (statis, base './')
npm.cmd run preview      # serve dist/
npm.cmd run lint         # oxlint (tidak ada typecheck/test di project ini)
```

- Warning `chunk larger than 500 kB` saat build **normal** (bundle `xlsx`) — bukan regresi.
- Utils di `src/utils/` bebas-browser (pure JS) → bisa diuji langsung:
  `node --input-type=module -e "import { ... } from './src/utils/rawAggregate.js'; ..."`
- Setelah mengubah apa pun, minimal jalankan `npm.cmd run build` untuk verifikasi.

## Alur & Tempat State

```
index.html → src/main.jsx → App.jsx
App.jsx (state: dataByDate {ISOdate → {tanggal, wilayahName, rows}}, filters {tanggal, area, cabang})
  → UploadManager → parseRawFile → setDataByDate (key = tanggal ISO)
  → FilterBar → setFilters (area/cabang/tanggal; efektif selalu tanggal terbaru kalau belum dipilih)
  → Dashboard → useMemo(filterRows + agregasi) → render KPI/donut/line/Top5/DetailTable
```

- **Sumber kebenaran selalu data mentah.** Setiap ganti filter, semua agregasi
  dihitung ulang dari `rows` via `useMemo` — jangan pernah cache agregat parsial.
- **Jangan import API browser di `src/utils/`** — file ini wajib tetap pure
  supaya bisa diuji dengan node. Browser-only code ada di `src/components/`.

## Parsing & Format File (wajib dipahami)

- Tanggal diambil dari **NAMA FILE**, bukan isi data: pola `dd-mm-yyyy` (boleh
  ada teks sebelum/sesudah, mis. `Rekap BJDPL 29-07-2026.xlsx`). File tanpa
  pola tanggal → throw (error ditampilkan di dropzone).
- Kolom dicocokkan dengan `COLUMN_MAP` di `src/utils/rawParser.js` (case & spasi
  dinormalisasi). Wajib ada: `AREA`, `CABANG`, `OUTLET`, `UMUR BJDPL`,
  `BJDPL BULAN INI`. Opsional: `KANWIL` (judul), `RP MTM` (Top5 kenaikan),
  `PRODUCT`, `SUB PRODUCT NM` (default `LAINNYA`).
- `UMUR BJDPL` berupa `"1 : 1 sd 15 Hari"` … `"7 : Lebih dari 90 Hari"`;
  ordinal di depan dipetakan ke 7 bucket via `ORDINAL_TO_BUCKET_KEY` di
  `src/utils/buckets.js`. Baris yang ordinalnya tidak dikenali → di-skip + dihitung warning.
- Baris mentah = 1 kombinasi (OUTLET, UMUR BJDPL, PRODUCT); aplikasi otomatis
  menjumlahkan produk dalam (outlet, bucket) yang sama.
- Nama `"kode:nama"` dipecah `parseCodeName`; outlet yang namanya diawali `CP ` → `isCp`.
- Upload 2 file tanggal sama → tanggal terakhir **menimpa** (tanpa warning).

## Dashboard & DetailTable (perilaku)

- Semua KPI/chart/tabel mengikuti filter Area/Cabang **dan** Tanggal.
- **Tren harian** mengikuti Area/Cabang tapi **tidak** mengikuti filter Tanggal
  (menampilkan semua tanggal terupload); otomatis disembunyikan bila baru 1 tanggal.
- `DetailTable` (tabel pivot per Outlet × Produk) membandingkan tanggal terpilih
  vs **H-1** (tanggal − 1 hari kalender). Hanya mendukung 1 Cabang — user wajib
  pilih cabang; tombol "Cetak Tabel" disabled tanpa cabang.
- Kolom `REK BJDPL BULAN INI` di README sudah **tidak dipakai** di versi ini.

## Export HTML & Cetak PDF (jangan dirusak)

- **Download HTML** (`handleDownloadHtml` di Dashboard.jsx): ambil `innerHTML`
  dari `#dash-print-area` + inline `styles.css?raw` + link Google Fonts. Konten
  yang diexport = bagian dalam `#dash-print-area` saja (elemen `no-print`
  seperti navbar/hero/footer/tombol tidak ikut).
- **Cetak/PDF** (`printWithTitle` di `src/utils/printTitle.js`): set
  `document.title` (jadi nama file PDF), opsional tambah `bodyClass`, panggil
  `window.print()`. Teknik print: `body * { visibility: hidden }` +
  `#dash-print-area` dijadikan visible (bukan `display:none` pada body).
- `@page` = `legal landscape`, margin `7mm` (lihat `styles.css`). **README lama
  menulis A4/8mm — kode yang benar adalah legal/7mm.**
- Mode `print-table-only` (Cetak Tabel): sembunyikan ringkasan dashboard &
  matikan `break-before:page` pada tabel agar halaman pertama tidak kosong.
- **Pivot table saat cetak:** wajib `table-layout: fixed` + lebar kolom via
  `<colgroup>` (13% outlet / 13% product / 7% bucket / 8.33% total). Jangan
  ubah ke `nth-child` pada `<td>` — header memakai rowspan/colspan, jadi lebar
  hanya bisa dijamin lewat `<col>` eksplisit. Header tabel diulang tiap halaman
  (`thead { display: table-header-group }`), tiap baris `break-inside: avoid`.

## Styling / Tema

- SATU file `src/styles.css`; semua warna lewat design token di `:root`
  (forest `#00573F`, forest-2 `#0C8B5E`, gold `#C79A3B`, krem `#F6F2E7`,
  paper `#FCFAF5`, font Sora/Inter, radius `--r-lg 20px`, shadow, `--maxw 1180px`).
- **Jangan pakai putih murni `#fff` di layar** — selalu `--paper`/`--cream`.
- Warna chart: bucket aging di `src/utils/buckets.js`; LineChart/TopList diberi
  warna inline dari Dashboard.jsx (sudah diset ke palet: `#00573F`, `#0C8B5E`,
  `#C79A3B`).
- Layout navbar/hero/footer ada di `App.jsx` (`app-nav`, `page-hero`, `app-footer`),
  semuanya `no-print`. Nuansa visual mengikuti `DOKUMENTASI_DASHBOARD_TEMPLATE.md`.

## Gotcha / Fakta yang mudah terlewat

- `vite.config.js`: `base: './'` (deploy dari subfolder apa pun) dan
  `assetsInlineLimit: 200000` (logo jadi base64 inline saat build).
- Project ini **bukan git repo**.
- Jangan tambahkan fitur template yang tidak ada di sini (routing hash, halaman
  detail, leaderboard, progress bar target) — keputusan user: hanya gaya yang
  direvisi, cara kerja web tidak boleh berubah.
- `src/components/FilterBar.jsx` dan `DetailTable.jsx` tidak butuh perubahan
  JSX untuk tema — semua via class CSS di `styles.css`.
