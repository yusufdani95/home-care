# Fitur Admin Panel dan Integrasi Database

## Deskripsi Tugas
Kita perlu membuat halaman Admin Panel untuk mengelola data reservasi pasien (Home Care) dan memastikan semua data dari form di halaman depan (Landing Page) tersimpan dengan baik ke dalam database.

## Fitur Utama yang Harus Diimplementasikan
1. **Integrasi Form ke Database**: Setiap pengisian form, baik tombol "Kirim WhatsApp" maupun "Kirim Booking Online", harus menyimpan data ke tabel `bookings` di database.
2. **Dashboard Admin (Tabel Pasien)**: Membuat antarmuka tabel untuk melihat daftar pasien yang telah melakukan booking (baik via WhatsApp maupun Online).
3. **Filter Status**: Menambahkan fitur filter pada tabel berdasarkan status reservasi: `Pending`, `Dikonfirmasi`, `Selesai`.
4. **Direct WhatsApp Contact**: Menambahkan tombol/aksi di tabel admin untuk langsung menghubungi pasien melalui WhatsApp.

---

## Prasyarat Penting (Wajib Dibaca)
Saat ini terdapat masalah koneksi ke database lokal: `Access denied for user 'root'@'localhost'`. 
**Langkah Pertama sebelum mulai ngoding:**
- Pastikan MySQL Server sudah berjalan di lokal (XAMPP/MAMP/Native).
- Buka file `.env` di root project.
- Sesuaikan `DATABASE_URL` dengan username dan password MySQL milik Anda.
  Contoh: `DATABASE_URL=mysql://root:password_mysql_kamu@localhost:3306/home_care`

---

## Tahapan Implementasi (Step-by-Step)

### Tahap 1: Persiapan Database & Backend Endpoint
1. **Periksa Schema Database (`src/db/schema.ts`)**
   - Pastikan tabel `bookings` sudah memiliki kolom `status` (seharusnya sudah ada `varchar('status').default('pending')`).
2. **Perbaiki Endpoint POST `/api/bookings` (`src/index.ts`)**
   - Endpoint ini saat ini gagal melakukan `insert` karena error MySQL. Setelah `DATABASE_URL` diperbaiki, pastikan endpoint ini berhasil menyimpan ke tabel `bookings`.
   - Modifikasi logika untuk memastikan baik "Kirim WhatsApp" maupun "Kirim Booking Online" memanggil endpoint POST `/api/bookings` ini melalui AJAX/Fetch di Frontend.
3. **Buat Endpoint Baru untuk Admin (`src/index.ts`)**
   - Buat route **GET `/api/admin/bookings`**: Mengambil semua data dari tabel `bookings`, urutkan dari yang terbaru (`ORDER BY createdAt DESC`).
   - Buat route **PATCH `/api/admin/bookings/:id/status`**: Untuk mengubah kolom status pada id tertentu (ubah dari `pending` ke `dikonfirmasi` atau `selesai`).

### Tahap 2: Update Frontend Halaman Depan (`public/index.html`)
1. **Cari form element** untuk booking layanan.
2. **Modifikasi Event Listener (JavaScript)**
   - Saat tombol **"Kirim Booking Online"** ditekan: Hentikan default form submit (`e.preventDefault()`). Kirim data form via `fetch()` POST ke `/api/bookings`. Tampilkan notifikasi "Berhasil" jika sukses.
   - Saat tombol **"Kirim WhatsApp"** ditekan: Lakukan hal yang sama (`fetch()` POST ke `/api/bookings`) **LALU** *redirect* user ke link WhatsApp (Gunakan format API WhatsApp: `https://wa.me/<nomor>?text=<pesan>`).

### Tahap 3: Pembuatan Halaman Admin (`public/admin.html` & `public/admin.js`)
1. **Buat file HTML baru (`public/admin.html`)**
   - Desain layout dashboard admin sederhana (bisa gunakan Tailwind CSS via CDN yang sudah ada).
   - Buat Dropdown/Select element untuk memfilter Status (Semua, Pending, Dikonfirmasi, Selesai).
   - Buat struktur elemen `<table id="bookingsTable">...</table>`.
2. **Buat file JavaScript (`public/admin.js`)**
   - Buat fungsi `fetchBookings()` yang akan memanggil endpoint **GET `/api/admin/bookings`**.
   - Render data JSON yang didapat ke dalam baris tabel `<tbody>`.
   - **Tampilan Tabel**: Tampilkan Kolom (Nama, No HP, Layanan, Tanggal, Alamat, Status, Aksi).
3. **Implementasi Fitur Filter & Update Status**
   - Berikan event listener pada Dropdown filter. Saat diubah, filter baris tabel di sisi client (JavaScript) sesuai status.
   - Di kolom "Aksi" pada tabel, tambahkan tombol **Ubah Status** (memanggil fungsi yang mengirim request ke **PATCH `/api/admin/bookings/:id/status`** lalu me-refresh tabel).
4. **Implementasi Fitur Direct WhatsApp**
   - Di kolom "Aksi", tambahkan tombol/link `<a href="https://wa.me/628xxx">Hubungi Pasien</a>`.
   - Pastikan format nomor telepon diubah dari awalan `0` menjadi `62` agar link WhatsApp API berfungsi dengan benar.

### Tahap 4: Pengujian & Validasi (Testing)
1. Buka halaman depan (`/`), coba submit form menggunakan "Kirim Booking Online". Buka Database, cek apakah data masuk.
2. Coba submit form menggunakan "Kirim WhatsApp". Cek apakah data masuk ke database DAN apakah browser membuka WhatsApp.
3. Buka halaman admin (`/admin.html`), pastikan data yang disubmit tadi muncul di tabel.
4. Coba ubah dropdown status, pastikan data berhasil terfilter.
5. Coba update status dari "Pending" ke "Dikonfirmasi" pada salah satu baris data, lalu refresh halaman, pastikan status tidak kembali ke "Pending".
6. Klik tombol "Hubungi Pasien" dan pastikan itu membuka link WhatsApp tujuan dengan benar.

---
**Catatan untuk Junior Programmer/AI:**
Pastikan kode ditulis rapi, dipisah-pisah logika JS-nya, dan tambahkan comment atau keterangan pada bagian kode yang penting. Jangan lupa jalankan `bun run dev` untuk ngetes aplikasi secara lokal.
