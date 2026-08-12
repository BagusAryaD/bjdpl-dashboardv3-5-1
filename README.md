# Generator Dashboard BJDPL — Wilayah (Data Mentah)

Aplikasi web untuk mengubah data BJDPL mentah transaksional (per outlet, per
hari) menjadi dashboard interaktif tingkat Wilayah — lengkap dengan filter
Area/Cabang/Tanggal, grafik tren, dan tabel per outlet — siap diekspor jadi
HTML atau PDF.

Aplikasi ini **100% berjalan di browser** (client-side). Tidak ada server,
tidak ada database, dan file yang diupload **tidak pernah dikirim ke mana
pun** — semua pemrosesan terjadi di komputer/browser pengguna. Data hilang
total kalau tab browser di-refresh atau ditutup (sesuai kesepakatan — tidak
ada penyimpanan permanen).

## Alur Penggunaan

1. **Upload** satu atau beberapa file data harian mentah (bisa sekaligus atau
   satu-satu). Tiap file otomatis dikenali tanggalnya sendiri dari kolom
   `tanggal` — tidak perlu isi metadata manual apapun.
2. **Filter** Area, Cabang, dan Tanggal snapshot muncul otomatis begitu ada
   data. Tanggal selalu 1 pilihan tunggal (bukan rentang) karena BJDPL adalah
   saldo per titik waktu, bukan sesuatu yang bisa dijumlah lintas hari.
3. **Dashboard** langsung tampil otomatis — judul & periode diambil dari data
   itu sendiri (kolom `KANWIL` dan `tanggal`), tidak perlu diisi manual.
4. **Export** — tombol Download HTML atau Cetak/Simpan PDF (Ctrl+P), selalu
   mengekspor tampilan yang sedang aktif difilter saat itu.

## Format File Upload

Nama kolom **harus persis sama** seperti hasil export sumber data (sesuai
konfirmasi bahwa formatnya selalu seragam):

```
KANWIL | tanggal | AREA | CABANG | OUTLET | SUB PRODUCT NM | UMUR BJDPL |
BJDPL AKHIR TAHUN LALU | BJDPL AKHIR BULAN LALU | BJDPL BULAN INI | RP MTM |
PERSEN MTM | RP YTD | PERSEN YTD | FLAG | PRODUCT | REK BJDPL BULAN INI
```

Kolom yang benar-benar dipakai aplikasi:
| Kolom | Kegunaan |
|---|---|
| `KANWIL` | Nama wilayah untuk judul dashboard (`"16:KANWIL JAKARTA 2"` → `"JAKARTA 2"`) |
| `tanggal` | Format `DD/MM/YYYY`, jadi kunci pengelompokan per hari & filter tanggal |
| `AREA`, `CABANG`, `OUTLET` | Format `"kode:nama"`, dipakai untuk hierarki & filter. Baris CP dikenali otomatis dari nama outlet yang diawali `"CP "` — tidak perlu kolom penanda manual |
| `UMUR BJDPL` | Format `"1 : 1 sd 15 Hari"` s.d. `"7 : Lebih dari 90 Hari"` — angka di depan dipetakan langsung ke 7 bucket aging |
| `BJDPL BULAN INI` | Nominal BJDPL yang dipakai di seluruh dashboard |
| `REK BJDPL BULAN INI` | Jumlah rekening yang dipakai di seluruh dashboard |
| `RP MTM` | Selisih BJDPL bulan ini vs bulan lalu, dipakai untuk ranking "Top 5 Outlet Kenaikan BJDPL" |
| `PRODUCT` | Dipakai untuk ranking "Top 5 Produk BJDPL Terbesar" (kolom `SUB PRODUCT NM` sengaja diabaikan sesuai permintaan) |

Kolom `BJDPL AKHIR TAHUN LALU`, `BJDPL AKHIR BULAN LALU`, `PERSEN MTM`,
`RP YTD`, `PERSEN YTD`, `FLAG` **belum dipakai** di versi ini (berpotensi
ditambahkan nanti).

**Baris mentah = 1 kombinasi (OUTLET, UMUR BJDPL, PRODUCT)** — aplikasi
otomatis menjumlahkan semua baris produk yang berbeda dalam kombinasi
(outlet, bucket) yang sama untuk mendapat angka per outlet per bucket.

Kalau upload 2 file untuk tanggal yang sama, file terakhir **menimpa** file
sebelumnya untuk tanggal itu (tidak ada peringatan/merge khusus, sesuai
keputusan "biarin aja").

## Struktur Dashboard

Urutan dari atas ke bawah:
1. Header (logo, judul otomatis, periode, badge wilayah)
2. Kartu KPI: Total BJDPL, Total Rekening, **Rata-rata BJDPL** (Total BJDPL ÷
   Total Rekening), Outlet Terbesar (Nominal), Outlet Terbanyak (Rekening)
3. Donut komposisi BJDPL per bucket aging
4. Line chart "Besar BJDPL per Umur (Aging)" — sumbu X 7 bucket, sumbu Y
   nominal, ada tooltip hover per titik
5. Panel Catatan
6. Line chart tren Total BJDPL per hari & Total Rekening per hari (lintas
   semua tanggal yang sudah diupload, mengikuti filter Area/Cabang tapi
   **tidak** mengikuti filter tanggal snapshot)
7. Top 5 Outlet dengan kenaikan BJDPL (RP MTM) terbesar
8. Top 5 Produk dengan BJDPL terbesar
9. **Tabel rincian per Outlet** (selalu per-outlet, tidak pernah diringkas ke
   level Cabang/Area) — diurutkan dari BJDPL terbesar, dan **scrollable**:
   di layar cuma menampilkan ~10 baris teratas dulu, sisanya discroll. Saat
   diekspor (HTML/PDF), tabel selalu tampil **penuh** (tidak dibatasi).

Semua chart, KPI, dan tabel **mengikuti filter Area/Cabang** yang aktif
(kecuali Top 5 MTM & Top Produk yang juga ikut filter yang sama, sesuai
konfirmasi). Semua kecuali tren harian juga mengikuti filter Tanggal.

## Soal Cetak PDF / Ctrl+P

**Tidak ada fitur auto-scale/shrink-to-fit** di versi ini — sengaja
dikembalikan ke pendekatan paling sederhana: satu `@page { size: A4
landscape; margin: 8mm }`, konten dibiarkan meluber natural ke beberapa
halaman kalau memang tidak muat 1 halaman. Panel & tabel diberi
`break-inside: avoid` supaya tidak terpotong di tengah saat pindah halaman.

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

## Build untuk Hosting

```bash
npm install
npm run build
```

Hasil build ada di folder `dist/` — static site, tinggal hosting di layanan
apapun (Netlify/Vercel/GitHub Pages/web server biasa/dibuka langsung dari
file).

## Struktur Kode

```
src/
  main.jsx                entry point
  App.jsx                  mengatur state dataByDate + filters
  styles.css                seluruh styling (palet, layout, print CSS)
  assets/
    pegadaian-logo.png      logo (inline base64 otomatis saat build)
  utils/
    buckets.js               definisi 7 bucket aging & warna, mapping ordinal
    fileReader.js             baca CSV/XLSX generik (papaparse / SheetJS)
    rawParser.js               parsing data mentah -> baris detail per hari
    rawAggregate.js             semua fungsi agregasi (outlet, bucket, top-N, tren)
    format.js                    format Rupiah, angka, tanggal Indonesia
  components/
    UploadManager.jsx          upload banyak file harian + kelola daftar tanggal
    FilterBar.jsx                filter Area / Cabang / Tanggal
    LineChart.jsx                 SVG line chart custom dengan tooltip hover
    TopList.jsx                    daftar top-N dengan bar horizontal
    OutletTable.jsx                 tabel per outlet, scrollable
    Dashboard.jsx                    orkestrasi semua di atas + export HTML/PDF
```

## Catatan Performa

Satu hari data mentah bisa ~6.900 baris. Agregasi berat (grouping per
outlet/bucket) hanya dijalankan lewat operasi filter/reduce di memori saat
render — untuk data sebesar itu (bahkan sampai puluhan ribu baris lintas 7+
hari) tetap terasa instan di browser modern, karena tidak ada re-parsing file
setiap kali filter diganti, hanya filter atas array yang sudah ter-parse.

## Riwayat Perubahan Penting dari Versi Sebelumnya

- Mode template CSV/XLSX manual per-cabang (upload flat, isi metadata
  manual) **sepenuhnya dihapus**, digantikan mode data mentah ini.
- Auto-scale shrink-to-fit untuk PDF **dihapus total**, kembali ke pendekatan
  cetak paling sederhana (multi-halaman natural).
- **Perbaikan upload XLSX**: kolom `tanggal` yang di Excel benar-benar
  bertipe *Date* (bukan teks) sebelumnya gagal terbaca sama sekali (semua
  baris dianggap tidak valid) karena pembaca file mengembalikan angka serial
  Excel, bukan teks `"DD/MM/YYYY"`. Sekarang parser mengenali 3 bentuk
  sekaligus: teks, serial number Excel, dan objek Date.
- **Perbaikan tabel terpotong saat cetak**: tabel dengan banyak kolom (tiap
  bucket aging × BJDPL+REK) bisa lebih lebar dari halaman cetak, membuat
  kolom paling kanan hilang. Sekarang khusus saat cetak, tabel dipaksa
  `table-layout: fixed; width: 100%` — dijamin selalu pas di lebar halaman,
  dengan konsekuensi font sedikit lebih kecil dan teks boleh melipat ke baris
  berikutnya kalau kolom terlalu banyak.
- **Grafik tren harian otomatis disembunyikan** kalau baru ada 1 tanggal yang
  diupload (grafik tren dengan 1 titik data tidak informatif).
- **Tabel per outlet sekarang punya 2 mode**, bisa dipilih lewat toggle:
  - *Per Outlet*: seperti sebelumnya, tapi sekarang **kolom header bisa
    diklik untuk mengurutkan** (Total BJDPL, Total REK, atau BJDPL/REK di
    bucket usia tertentu) — klik sekali untuk menurun, klik lagi untuk
    menaik.
  - *Agregat per Cabang*: 1 baris ringkasan per Cabang (dijumlahkan dari
    semua outlet di cabang itu), diikuti baris-baris outlet di dalamnya
    (ditandai indentasi + ikon panah). Mode ini tidak punya sort interaktif
    (urutannya tetap dari BJDPL terbesar).
- Tabel sekarang selalu level **Outlet** sebagai basis data (mode Agregat
  cuma cara tampilan berbeda dari data yang sama, bukan level agregasi
  baru).
