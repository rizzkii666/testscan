# Deploy PustakaSMP ke Google Sheets via Apps Script Web App

## 1. Siapkan Google Spreadsheet

1. Buka Google Sheets dan buat spreadsheet baru.
2. Ubah nama sheet pertama menjadi **Koleksi** (klik kanan tab sheet → Rename).
3. Isi baris pertama (header) secara manual, atau biarkan Apps Script membuatnya otomatis:

   | A     | B      | C        | D         | E     | F      | G      | H            | I              |
   |-------|--------|----------|-----------|-------|--------|--------|--------------|----------------|
   | ISBN  | Judul  | Penulis  | Penerbit  | Tahun | Mapel  | Kelas  | Nomor Induk  | Tanggal Input  |

4. Catat **Spreadsheet ID** dari URL:
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit

## 2. Buat Google Apps Script

1. Di spreadsheet, klik menu **Extensions → Apps Script**.
2. Hapus kode default `function myFunction() {}`.
3. Salin seluruh isi file `apps-script.gs` dari folder proyek ini ke editor Apps Script.
4. Ganti nilai SPREADSHEET_ID di baris atas dengan ID spreadsheet Anda.
5. Simpan project (Ctrl+S). Beri nama project, misalnya **PustakaSMP**.

## 3. Deploy sebagai Web App

1. Klik tombol **Deploy** → **New deployment**.
2. Klik ikon roda gigi (⚙️) → pilih **Web app**.
3. Isi konfigurasi:
   - Description: PustakaSMP Web App v1
   - Execute as: Me
   - Who has access: **Anyone** (siapa pun yang punya link)
4. Klik **Deploy**.
5. Pada dialog otorisasi, klik **Authorize access** → pilih akun → **Advanced** → **Go to PustakaSMP (unsafe)** → **Allow**.
6. Salin **Web App URL** yang muncul (berformat https://script.google.com/macros/s/AKfyc.../exec).

## 4. Hubungkan ke Frontend

1. Buka file `index.html` di proyek ini.
2. Cari baris `const WEB_APP_URL = 'https://script.google.com/macros/s/XXXXXXXX.../exec';`
3. Ganti URL tersebut dengan Web App URL yang sudah Anda salin.
4. Simpan file.

## 5. Uji Coba

1. Buka `index.html` di browser.
2. Isi form dan simpan buku.
3. Buka Google Sheet Anda — data baru seharusnya muncul dalam beberapa detik.

---

## Penanganan Masalah CORS

Google Apps Script Web App sudah mengirimkan header CORS di `apps-script.gs`.

### Preflight OPTIONS
Browser modern mengirim request OPTIONS sebelum POST. Kode doPost sudah menangani ini, dan doOptions tersedia sebagai fallback.

### Jika tetap mendapat error CORS:

1. **Pastikan deploy sebagai "Anyone"**
   Jika access-nya "Only myself", browser akan ditolak saat fetch dari origin lain.

2. **Re-deploy setelah edit kode**
   Setiap kali mengubah kode Apps Script, klik **Deploy → Manage deployments → Edit (pensil)** → klik **Deploy** lagi. URL tidak berubah, tapi versi kode terbaru akan aktif.

3. **Gunakan mode: 'cors' dan Content-Type: application/json**
   Di frontend sudah dikonfigurasi otomatis di fungsi `simpanKeSheets`.

4. **Alternatif jika CORS masih bermasalah**
   Jika fetch dari browser terus gagal karena redirect Google Apps Script, gunakan proxy no-cors atau kirim data menggunakan HTML form POST (bukan JSON fetch). Namun, kode yang dibuat sudah menggunakan pola yang paling kompatibel untuk Apps Script Web App.

### Tips Debug

- Buka DevTools (F12) → tab Network untuk melihat request/response.
- Akses Web App URL langsung di browser dengan `?action=status` untuk cek apakah Web App aktif.
- Periksa **Executions** di Apps Script editor untuk melihat log error.
