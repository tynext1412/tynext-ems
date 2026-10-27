# Tynext EMS — Dashboard

Frontend Energy Management System untuk memantau fleet plant PLTS (PV + BESS) Tynext.
Tahap ini baru mencakup halaman **Dashboard**: peta sebaran plant, kartu summary,
Environmental Benefits, BESS performance, dan Site list.

Arsitektur mengikuti Domain-Driven Design; penjelasannya ada di
[docs/architecture/dashboard-ddd.md](docs/architecture/dashboard-ddd.md).

> **Status: data dummy.** Data diambil dari repository mock in-memory
> (`src/domains/plant/infrastructure/fixtures.ts`, 14 plant). Belum ada backend,
> autentikasi, maupun realtime.

## Menjalankan

Butuh Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build ke dist/
npm run preview    # serve hasil build
npm test           # vitest (test domain)
npm run lint
```

Konfigurasi lewat `.env` (lihat `.env.example`):

| Variabel | Nilai | Keterangan |
|---|---|---|
| `VITE_DATA_SOURCE` | `mock` (default) \| `http` | `http` belum diimplementasikan |
| `VITE_API_BASE_URL` | URL API | dipakai adapter HTTP nanti |
| `VITE_SCADA_URL_TEMPLATE` | URL viewer SCADA, boleh `{plantId}` | opsional; berlaku untuk semua plant |

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · react-router · Leaflet ·
framer-motion · lucide-react · vitest.

## Tampilan

Peta memenuhi seluruh layar; halaman tidak di-scroll. Site list ada di **bottom sheet**
(`src/shared/ui/BottomSheet.tsx`) yang ditarik ke atas seperti panel komentar Reels:
geser atau klik bar bawah untuk membuka; geser ke bawah, klik backdrop, tombol tutup,
atau Escape untuk menutup. Sheet terbuka tercermin di URL (`#plant-list`) sehingga bisa
dibagikan dan tombol Back menutupnya. Pengguna dengan `prefers-reduced-motion` mendapat
perpindahan tanpa animasi.

Tema **grafit + warna merek Tynext** (token di `src/styles/index.css`): dasar grafit netral,
warna merek diambil langsung dari gradien logo (`src/assets/tynext-mark.png`):

| Peran | Token | Nilai | Dipakai untuk |
|---|---|---|---|
| Primer (biru Tynext) | `--color-primary` / `--color-accent` | `#1788a6` / tint `#4cb3d4` | tombol, link, fokus, tab & menu aktif |
| Sekunder (teal) | `--color-secondary` | `#3fb995` | ujung gradien angka fokus, cincin & nilai charge BESS |
| Tersier (lime) | `--color-tertiary` | `#8ec747` | hanya di gradien merek (garis tepi sheet), bukan teks/titik |
| Navy | `--color-navy` | `#184c7f` | awal gradien merek |

Tint `#4cb3d4` dipakai untuk teks karena biru logo asli (`#1788a6`) hanya 4,1:1 di atas grafit;
semua pasangan teks/latar diuji ≥ 4,5:1. Lime sengaja tidak dipakai untuk teks atau titik supaya
tidak tertukar dengan hijau status Online. Hijau / kuning / merah tetap khusus status plant.
Logo resmi (mark bergradien + wordmark putih) dipakai di header, sidebar site, dan favicon.
Font IBM Plex Sans untuk antarmuka dan IBM Plex Mono (angka tabular) untuk semua readout.
Citra satelit peta diberi filter ke arah grafit supaya marker status menjadi satu-satunya
warna jenuh di peta.

## Halaman site

Klik marker atau tombol Operation membuka `/plants/:plantId`: sidebar menu **Overview, SCADA,
Info, Device, Alarm, O&M schedule** dengan header status plant dan waktu data terakhir. Nama site di
header adalah pemilih site: klik untuk membuka daftar, cari berdasarkan nama/alamat/ID, pilih dengan
mouse atau keyboard (panah, Enter, Escape); menu yang sedang dibuka dipertahankan di site tujuan.

- **Tema terang (bawaan) dan gelap**, diganti lewat tombol matahari/bulan di header dashboard, header site,
  dan halaman login; pilihan tersimpan di `localStorage` (`tynext-ems.theme`) dan diterapkan sebelum render.
  Tema gelap = override token di `:root[data-theme="dark"]`; chrome grafik, adegan 3D, peta, dan ilustrasi
  login membaca token/palet per tema. Tema terang: abu-abu terang + warna merek Tynext. Aksen biru merek digelapkan untuk teks/link
  (`#0d6f8b`, 5,7:1 di putih), biru logo asli (`accent-soft`) dipakai untuk blok isian dengan tinta
  gelap (7,6:1); status Online/Alarm/Offline ≥ 4,5:1 di putih dan surface-2; palet grafik lolos
  validator dataviz di permukaan putih tanpa perubahan. Wordmark navy dipotong dari logo asli.
- **Login** (`/login`): ilustrasi vektor (SVG inline, tanpa three.js) berisi array PV, inverter berlayar,
  bank baterai, meter berjarum, tiang grid, tiga teknisi yang bekerja, dan kabel dengan partikel listrik;
  gerak kecilnya lewat CSS/SMIL dan berhenti saat reduced motion. Kartu form bertepi lengkung di kanan
  dan dua kabel bergaris menyeberang ke dalam kartu supaya menyatu. Form: email,
  kata sandi (tampil/sembunyi), lupa kata sandi (belum tersedia), tombol Masuk, Google/Microsoft demo.
  Semua rute lain dijaga `RequireAuth` (tanpa sesi → `/login`, tujuan semula disimpan). **Mock Identity &
  Access**: email valid apa pun + kata sandi ≥ 6 karakter diterima, sesi di `localStorage`
  (`tynext-ems.session.v1`); menu pengguna di header menampilkan nama/peran dan tombol keluar.
- **Aliran energi 3D (three.js)**: panel "Aliran energi saat ini" di Overview memakai adegan 3D
  sesuai **jenis site** (`plantType`): **Resort / Hotel** (bangunan hotel, kolam, kelapa, PV kanopi),
  **Mining** (teras tambang, stockpile, excavator, haul truck, silo, PV lapangan), **Plantation**
  (pabrik, tangki air, barisan tanaman, PV lapangan). PV, bank baterai, genset, tiang grid, dan
  switchgear (bus AC) ada di semua adegan; kabel dari tiap node ke bus membawa **partikel yang
  bergerak searah aliran**, jumlah dan kecepatannya mengikuti besar daya (warna kategori sama dengan
  grafik) di atas lantai grid halus (sel 0,5 m). Kamera bisa diputar (seret) dan di-zoom (scroll, jarak 6–40 unit). Sakelar **3D/2D** tersimpan di `localStorage`; versi 2D (SVG)
  dipakai otomatis bila WebGL tidak ada, adegan gagal dirender, atau `prefers-reduced-motion`
  menghentikan partikel. three.js dimuat lazy sebagai chunk terpisah (±330 KB gzip).
- **Overview** (field mengikuti spreadsheet spesifikasi): diagram aliran energi satu garis
  (PV, Genset, Grid di atas bus AC; Load dan Battery di bawah) dari snapshot daya yang
  di-refresh tiap 5 detik dengan status baterai (charge +, discharge −); tile Daily Energy
  Generation, Lifetime Energy Production, Total Revenue; Operating Data (PV Production, BESS
  Charge/Discharge, Diesel Generator, Load Consumption, Day/Hours Operation, Revenue) per
  periode Day/Month/Year/Lifetime; grafik yang mengikuti periode yang sama: daya per 5 menit
  (Grid, PV, Battery, Generator, Load), SOC baterai, tarif beli/jual per jam, atau energi per
  hari/bulan/tahun (batang bertumpuk sumber + garis beban); Battery SoC; Plant Information;
  Weather Information (cuaca hari ini, prakiraan 5 hari, suhu, sunrise/sunset, angin,
  kelembapan); Environmental Benefits per site.
- **Grafik** memakai recharts (dimuat terpisah) dan punya filter periodenya sendiri (Day /
  Month / Year, terpisah dari Operating Data). Mode Day (data per 5 menit) bisa di-zoom tanpa tombol: **scroll** di
  atas grafik memperbesar di sekitar kursor, seret memilih rentang, klik dua kali (atau tombol
  keyboard 0) mereset, + / − untuk keyboard; ketiga grafik harian
  berbagi rentang yang sama dan tick waktu menyesuaikan (3 jam → 1 jam → 30 → 15 → 5 menit).
  Warna seri tetap per entitas dan lolos validator CVD skill dataviz di surface grafit; setiap
  grafik punya legenda yang bisa dimatikan per seri, crosshair + tooltip, dan kembaran tabel
  ("Lihat sebagai tabel"). Tidak ada sumbu ganda: SOC dan tarif digambar sebagai dua grafik yang
  berbagi sumbu waktu.
- **Info**: Basic Information (nama, tipe plant, kapasitas PV, jumlah & kapasitas modul, baterai,
  zona waktu, tanggal koneksi platform/grid, waktu pembuatan, alamat + koordinat GPS dengan tautan
  Google Maps, organisasi yang ditugaskan, owner, installer) dan Tariff Management (Purchase /
  Feed-in Tariff). Foto plant belum ada, jadi kolom kanan menampilkan citra satelit di koordinat GPS.
- **Device**: empat tipe perangkat, **Inverter, Battery, PCS, Meter**. Daftar per tipe (tab tipe tersimpan di
  URL `?type=`, sub-tab Total/Online/Alarm/Offline, pencarian nama/SN, kolom khusus tipe, paginasi).
  Tombol Operation membuka `/plants/:plantId/device/:deviceId`: kartu foto (foto produk bila `photoUrl`
  tersedia, kalau tidak ilustrasi per tipe) dengan SN yang bisa disalin, informasi perangkat, data real-time
  (inverter: daya, daily yield, full load hours, suhu, tabel string DC & fasa AC; baterai: SOC,
  status, tegangan/arus/daya, sel, Battery Level today/month/year; meter: daya aktif, impor/ekspor
  harian, fasa, power factor; PCS: status charge/discharge, daya AC, efisiensi, bus DC, fasa AC, energi
  charge/discharge harian & total), dan **chart parameter**: checklist parameter per kelompok, periode
  Day (deret 5 menit) atau Month/Year/Lifetime (batang energi), satu chart per satuan. Di kiri detail
  ada **daftar perangkat sejenis** (semua inverter, atau semua baterai, atau semua meter; perangkat
  tidak saling terhubung, jadi tanpa hierarki) dengan pencarian nama/SN dan chip Master, untuk pindah
  perangkat tanpa kembali ke daftar; di ponsel daftar dilipat di balik tombol "<Tipe> lain". Mock
  menyediakan ±1 unit baterai per 100 kWh dan satu PCS per 2 unit baterai.
- **O&M schedule**: tabel aktivitas pemeliharaan (Date, Type Regular/Corrective, O&M Activities,
  Status, Photo Documentation, Notes) dengan tab status, filter tipe, dan paginasi. Tombol
  **Tambah aktivitas** membuka form (tanggal, tipe, aktivitas, catatan). Klik baris membuka panel
  detail: **tandai Done** (atau batalkan), **unggah foto** (diperkecil ke 1280 px di browser), dan
  **catatan**. Status tidak disimpan: Done bila ditandai selesai, Upcoming bila tanggal masih di
  depan, Pending bila sudah tiba. Mock menyimpan create/update di `localStorage`
  (`tynext-ems.maintenance.v1`) sebagai lapisan di atas seed, jadi bertahan saat refresh.
- **Alarm** (aktif/riwayat, jumlah aktif tampil di sidebar) diisi dari data yang ada.
- **SCADA** tidak menggambar diagram sendiri: ia menyematkan **viewer SCADA pihak ketiga** per
  plant (iframe ber-sandbox) dengan kontrol muat ulang, buka di tab baru, dan layar penuh, serta
  status memuat / tidak merespons / belum dikonfigurasi. URL viewer datang dari repository per plant
  atau `VITE_SCADA_URL_TEMPLATE` (mendukung `{plantId}`); server SCADA harus mengizinkan embed
  (X-Frame-Options / CSP `frame-ancestors`). Di mode dummy hanya PLT-001 yang menunjuk ke
  `public/scada-placeholder.html` (jelas berlabel placeholder, bukan SCADA).
- **O&M schedule** belum punya spesifikasi; halamannya ada dan diberi label jelas "belum dirancang"
  agar menu tidak buntu.

## Struktur kode

```
src/
  app/            composition root: routes, providers, pemilihan adapter (mock|http)
  shared/         shared kernel (satuan, waktu & formatter id-ID), config, lib, primitif UI
  domains/
    plant/        Plant, StatusPolicy, cuaca & prakiraan; peta & badge status
    performance/  energi & revenue per plant, operating data per periode
    telemetry/    snapshot daya real-time + logika aliran energi (bus AC)
    alarm/        alarm aktif & riwayat per plant
    auth/         sesi & kredensial, port AuthRepository (mock: localStorage), halaman login + adegan 3D, penjaga rute
    device/       perangkat (inverter/baterai/PCS/meter), katalog parameter, pembacaan & deret per perangkat
    scada/        konfigurasi & bingkai embed viewer SCADA pihak ketiga
    impact/       rumus Environmental Benefits
    dashboard/    komposisi: overview, query Site list, halaman dashboard
    maintenance/  jadwal O&M: aktivitas, aturan status, validasi form, create/update (mock di localStorage)
    site/         komposisi: layout sidebar + halaman Overview/Info/Device/Alarm/O&M; domain geometri aliran (polyline, tata letak 3D, konektor) + adegan three.js
```

Setiap domain berlapis `domain/ → application/ → infrastructure/ → ui/`. Logika bisnis
(aturan status, rumus impact, agregasi, filter/sort tabel) ada di `domain/` sebagai
fungsi murni dan diuji tanpa React.

## Mengganti data dummy dengan API

1. Tulis `HttpPlantRepository` dan `HttpPerformanceRepository` di folder
   `infrastructure/` masing-masing domain (pakai `shared/lib/apiClient`).
2. Pilih adapter di `src/app/container.ts` berdasarkan `VITE_DATA_SOURCE`.

UI dan domain tidak perlu diubah.

## Langkah berikutnya

1. Adapter HTTP + kontrak API (lihat dokumen arsitektur §7).
2. Halaman Operation / detail plant.
3. Identity & Access (login, scope plant per user).
4. Realtime status marker (polling atau WebSocket di adapter).
