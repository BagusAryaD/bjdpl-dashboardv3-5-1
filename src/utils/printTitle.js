// Browser memakai document.title sebagai nama file default saat "Simpan
// sebagai PDF" dari dialog cetak. Helper ini mengganti title sementara
// sebelum window.print(), lalu mengembalikannya begitu dialog cetak selesai
// (event 'afterprint'). bodyClass opsional dipakai untuk menandai mode cetak
// tertentu lewat CSS (mis. "hanya cetak tabel"), lihat .print-table-only di
// styles.css.
export function printWithTitle(title, { bodyClass } = {}) {
  const prevTitle = document.title;
  if (title) document.title = title;
  if (bodyClass) document.body.classList.add(bodyClass);

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    document.title = prevTitle;
    if (bodyClass) document.body.classList.remove(bodyClass);
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  // Jaring pengaman kalau 'afterprint' tidak terpicu di browser tertentu.
  setTimeout(cleanup, 30000);

  window.print();
}
