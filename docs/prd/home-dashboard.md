# PRD · Tynext · Home Dashboard

Oct 29, 2026 · Herdin (disalin dari blok PRD di file Figma "Tynext", halaman Home)

## Summary

Home adalah halaman pertama setelah login. Isinya kondisi semua site dalam satu layar: total kapasitas, produksi energi, pendapatan, lokasi site di map, dan daftar site beserta statusnya.

Pengguna utamanya adalah pemilik atau pengelola site.

Mereka butuh jawaban cepat untuk dua pertanyaan: berapa energi yang dihasilkan, dan site mana yang sedang bermasalah.

UI ini menambahkan semua state yang belum ada di desain awal (loading, error, empty, offline, data lama) supaya halaman siap dipakai di kondisi nyata, bukan cuma saat semua data lancar.

## Scope

- Header: Last Updated, refresh manual, menu profil, konfirmasi sign out, notifikasi alarm
- 5 kartu KPI, map dengan marker status, panel Environmental Benefits dan BESS Performance
- Site List: tab status, search, tabel dengan kolom Action yang tetap (sticky), toggle kolom kapasitas dan energi, pagination
- Semua state: loading, error, empty, offline, session habis
- Halaman error global: 404, 500.

## Page Structure

Layar dirancang untuk desktop 1440 x 900 px. Map mengisi seluruh latar, elemen lain melayang di atasnya.

| Area | Posisi | Isi |
|---|---|---|
| Header | Atas, tinggi 56 px | Logo, pill Last Updated + tombol refresh, lonceng alarm, menu profil |
| KPI | Di bawah header, 5 kartu | Total Sites, PV Install Capacity, BESS Install Capacity, Energy Generation, Revenue |
| Map | Latar penuh | Marker per site dengan warna status, kontrol zoom kanan |
| Environmental Benefits | Kiri bawah | Equivalent trees, CO₂ reduction, Coal saved |
| BESS Performance | Kanan bawah | Round-trip efficiency, Charge, Discharge |
| Site List | Sheet bawah | Tertutup: judul, jumlah site, legend status. Terbuka: tab, search, tabel |

Site List dibuka dengan klik atau geser tombol panah di tengah bawah. Saat terbuka, sheet menutupi map sampai di bawah kartu KPI.

## Functional Requirements

### Header

- Pill menampilkan `Last Updated: HH:MM WIB` dari waktu data terakhir berhasil diambil.
- Tombol refresh mengambil ulang semua data halaman. Selama proses, tombol disabled dan berisi spinner (detail di State).
- Klik nama user membuka menu: nama, email, dan Sign out.
- Sign out selalu lewat dialog konfirmasi. Cancel menutup dialog, Sign out mengakhiri sesi dan kembali ke halaman login.

### KPI Card

- 5 kartu, masing-masing berisi label, nilai, unit, dan ilustrasi.
- Tiap kartu memuat datanya sendiri. Jika satu kartu gagal, kartu lain tetap tampil.
- Kartu yang gagal menampilkan "Couldn't load" dan tombol ikon retry yang hanya memuat ulang kartu itu.

### Map

- Satu marker per site. Warna mengikuti status: hijau Online, oranye Alarm, merah Offline.
- Hover marker menampilkan kartu ringkas site (frame Plant Hover).
- Kontrol zoom + dan − di kanan.
- Jika layanan map gagal, area map diganti fallback. KPI, panel, dan Site List tetap bisa dipakai.

### Panel Environmental Benefits dan BESS Performance

- Environmental: Equivalent trees, CO₂ reduction (t), Coal saved (t).
- BESS: Round-trip efficiency (%) dengan gauge, Charge (MWh), Discharge (MWh).
- Seperti KPI, panel memuat dan gagal secara terpisah, dengan tombol Retry di dalam panel.

### Site List

**Tab status**

- 4 tab: All, Online, Alarm, Offline. Tiap tab menampilkan jumlah site di chip.
- Ganti tab memfilter tabel dan reset pagination ke halaman 1.

**Search**

- Cari berdasarkan nama plant atau nama owner.
- Pencarian jalan saat klik Search atau tekan Enter. Tombol × di field mengosongkan isi.
- Reset mengosongkan field dan kembali ke tab All.

**Tabel**

- Kolom default: Plant Status, Plant Name (nama + lokasi), Weather, Owner, Owner's Contact (email + tombol copy), Inverter Online/Total, Installer, Action.
- Kolom Action (ikon mata, ke Site Detail) selalu menempel di kanan. Kolom lain bisa di-scroll horizontal.
- Plant Status dan Plant Name bisa di-sort.
- Klik ikon copy menyalin email dan menampilkan konfirmasi singkat.
- Pagination: pilihan jumlah baris, "of N results", tombol halaman, Previous, Next.

**Toggle Show capacity and energy columns**

Menambah 8 kolom setelah Installer:

| Kolom | Unit |
|---|---|
| PV | kWp |
| Inverter | kW |
| Battery | kWh |
| Generation | kWh |
| Charge | kWh |
| Discharge | kWh |
| Tariff | Rp/kWh |
| Revenue | Rp |

Scrollbar horizontal muncul di bawah tabel. Kolom Action tetap di kanan dengan bayangan di sisi kiri saat ada konten di bawahnya.

## State

Aturan utama: skeleton hanya untuk load pertama. Saat refresh atau saat gagal, data terakhir tetap tampil dan umurnya selalu jelas lewat Last Updated.

### Dashboard

| State | Kapan | Tampilan | Frame |
|---|---|---|---|
| Initial loading | Halaman pertama dibuka | Skeleton di KPI, panel, legend. Map abu-abu dengan "Loading map and site locations". Pill: "Loading latest data" | 01 |
| Widget gagal | Satu KPI atau panel gagal dimuat | Widget itu saja diganti pesan gagal + Retry | 02 |
| Map gagal | Layanan map tidak bisa diakses | Fallback ilustrasi + "Reload map" dan Kontrol zoom disembunyikan | 03 |
| Belum ada site | Akun tanpa site | Semua angka 0, marker kosong, kartu | 06 |

### Refresh data

| State | Kapan | Tampilan | Frame |
|---|---|---|---|
| Refresh berjalan | Setelah klik refresh atau auto refresh | Pill "Updating data", tombol jadi spinner dan disabled, garis progress tipis di bawah header. Data lama tetap tampil | E1 |
| Refresh gagal | Request refresh gagal | Pill kembali ke waktu terakhir. Alert danger di tengah bawah: "Couldn't refresh data" + Try again | E2 |

### Site List

| State | Kapan | Tampilan | Frame |
|---|---|---|---|
| Loading tabel | Sheet dibuka pertama kali atau ganti tab | 10 baris skeleton, pagination redup | S1 |
| Tabel gagal | Data site tidak bisa diambil | Ilustrasi + "The site list couldn't load" + Retry | S2 |
| Loading search | Setelah klik Search | Tombol jadi "Searching" + spinner, 5 baris skeleton | B2 |
| Search kosong | Tidak ada yang cocok | "No sites match …" | B4 |
| Tab All kosong | Belum ada site | "No sites connected yet" + Check again | A7 |
| Tab Online kosong | Semua site Alarm atau Offline | Nada peringatan, "No sites are online right now" + Check Again | A8 |
| Tab Alarm kosong | Tidak ada alarm | "No active alarms" + Check Again | A5 |
| Tab Offline kosong | Tidak ada site offline | "No offline sites" + Check Again | A6 |

## Komponen global

Bagian ini berlaku di semua menu, bukan hanya Home. Contoh di Figma memakai latar Home.

| Komponen | Perilaku | Frame |
|---|---|---|
| Menu profil | Dropdown dari nama user. Item: Sign out | H1 |
| Konfirmasi sign out | Dialog di atas halaman yang di-overlay. Cancel dan Sign out | H2 |
| Offline | Pill jadi "Offline · Last Updated …", refresh disabled. Alert warning di tengah bawah: "You're offline" + Try now. Sistem mencoba sambung ulang otomatis | 04 |
| Session habis | Modal tanpa tombol tutup, satu aksi "Sign in again". Setelah login, user kembali ke halaman yang sama | 07 |
| 404 | "This page doesn't exist" + Back to Dashboard | 08 |
| 500 | "Something broke on our end" + Try again, Back to Dashboard, reference code dengan tombol copy | 10 |

Alert offline dan alert refresh gagal muncul di atas tooltip "Geser atau klik untuk membuka", bukan menggantikannya.

## Aturan data dan format

- **Angka:** format Indonesia. Titik untuk ribuan, koma untuk desimal (8.758,8 dan 35.103,66). Revenue di kartu KPI juga mengikuti aturan ini: Rp 43,24 M, bukan Rp 43.24 M.
- **Desimal:** 2 digit di tabel dan panel, maksimal 1 digit di kartu KPI.
- **Unit besar:** kWh naik ke MWh dan GWh, Rp naik ke jt, M, T. Batas pergantian unit perlu disepakati (lihat Pertanyaan terbuka).
- **Waktu:** semua jam ditampilkan dalam WIB dengan format HH:MM.
- **Nilai kosong:** tampilkan 0 jika datanya memang nol, "–" jika datanya belum tersedia.
- **Teks panjang:** Plant Name, lokasi, Owner, dan Owner's Contact dipotong satu baris dengan "…". Hover menampilkan tooltip berisi teks lengkap. Tinggi baris tabel tetap 60 px.
- **Hitungan tab:** jumlah per tab = jumlah site per status. Total semua tab harus sama dengan Total Sites di KPI.
- **Warna teks status:** label Alarm dan Offline di legend memakai warna yang lebih gelap (#B45309 dan #C20E4D) supaya kontras teks lolos WCAG AA.

## Referensi desain

Komponen dari kit HeroUI di file yang sama: Button, Chip, Badge, Tabs, Spinner, Alert, Tooltip. Ikon dari halaman Icons. Ilustrasi state ada di set `Illustrations (components)`.
