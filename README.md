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

Semua teks UI (label, pesan, aria-label, data mock) berbahasa Inggris. Tanggal memakai format en-GB ("2 Nov 2026");
angka tetap memakai pemisah Indonesia seperti di Figma ("443,19"), dan rupiah diringkas dengan singkatan Inggris
K / M / B / T (ribu, juta, miliar, triliun). Nama plant, alamat, dan perusahaan adalah nama diri, jadi tidak diterjemahkan.

Tampilan mengikuti desain Figma **"Tynext"** (kit HeroUI v3 + layar EMS buatan desainer; lihat
`docs/prd/home-dashboard.md` untuk PRD Home). Token tema ada di `src/styles/index.css`
(Tailwind v4 `@theme`), font **Inter** untuk semua teks (angka memakai figur tabular lewat kelas `font-mono`).

| Peran | Token | Nilai |
|---|---|---|
| Latar halaman / panel / kartu | `--color-bg` / `--color-surface-2` / `--color-surface` | `#f5f5f5` / `#efeff0` / `#ffffff` |
| Aksi utama (tombol, menu aktif) | `--color-brand` | `#087fb2` |
| Tautan | `--color-accent` | `#0485f7` |
| Status Online / Alarm / Offline (isian) | `--color-ok` / `--color-warn` / `--color-danger` | `#17c964` / `#f5a524` / `#ff383c` |
| Status sebagai teks (WCAG AA) | `--color-ok-text` / `--color-warn-text` / `--color-danger-text` | `#2b7a30` / `#b45309` / `#c20e4d` |

Tema gelap (palet gelap HeroUI) dipilih dari menu profil dan disimpan di `localStorage` (`tynext-ems.theme`).

Aset dari Figma ada di `src/assets/figma/`: `icons/` (ikon custom), `illustrations/` (empty/error state),
`weather/`, `artwork/` (ilustrasi 3D kartu KPI), `lib-icons/` (ikon kit HeroUI yang dipakai), `logo/`.
Primitif UI di `src/shared/ui/`: `Button`, `Chip`/`CountBadge`, `Tabs` (underline & segmented), `Input`/`Select`/
`Textarea`/`Checkbox`/`SearchField`/`Field`, `DataTable` (kolom Action menempel di kanan), `Pagination`, `Panel`/`Card`,
`Drawer` (kartu mengambang kanan), `Dialog`, `Alert`/`Toast`, `EmptyState` (ilustrasi Figma), `BottomSheet`, `AppHeader`.

### Home

Peta memenuhi layar; di atasnya header global, lima kartu KPI (Total Sites, PV, BESS, Energy Generation, Revenue),
panel Environmental Benefits (kiri bawah) dan BESS Performance (kanan bawah). **Site List** ada di bottom sheet:
tertutup = bar dengan judul, jumlah site, dan legend status; tombol panah di tengah (atau geser) membukanya sampai
di bawah kartu KPI. Isinya tab All/Online/Alarm/Offline, pencarian nama plant atau owner, toggle "Show capacity and
energy columns", tabel dengan kolom Action yang menempel di kanan, dan paginasi. Sheet terbuka tercermin di URL
(`#site-list`). Hover marker peta menampilkan kartu ringkas site dengan tombol View Details.

State mengikuti PRD: skeleton hanya saat load pertama; refresh (tombol di pill **Last Updated**) menampilkan
"Updating data" + garis progres dan tetap menampilkan data lama; refresh gagal → alert "Couldn't refresh data";
offline → pill "Offline · Last Updated …" + alert "You're offline"; tiap KPI/panel gagal sendiri-sendiri dengan
tombol retry; peta gagal → fallback "Reload map"; tabel punya empty state per tab, hasil pencarian kosong, dan
galat dengan ilustrasi.

### Komponen global

Header: logo, pill Last Updated + refresh, menu profil (nama, email, tema, Sign out dengan dialog konfirmasi).
Sesi yang habis → dialog "Sign in again" (kembali ke halaman semula setelah login). Halaman 404 dan 500
(dengan kode referensi yang bisa disalin) memakai ilustrasi dari Figma.

### Login

`/login` memakai video latar: `public/day.mp4` pukul 06.00–18.00 waktu lokal perangkat, `public/night.mp4`
pukul 18.00–06.00 (aturannya di `src/domains/auth/domain/daypart.ts`, dicek ulang tiap menit). Video tanpa suara,
terus berulang tanpa jeda lewat Media Source Extensions (berkas fragmented MP4 ditempelkan terus ke satu buffer; frame terakhir yang sama dengan frame pertama ditimpa), browser tanpa MSE memakai `loop` biasa, tanpa kontrol; `prefers-reduced-motion` menampilkan frame diam, dan bila video gagal dimuat latar
gradien yang tampil. Kartu form, pil logo, dan tombol tema tembus pandang 65 % dengan blur. **Mock Identity &
Access**: email valid apa pun + kata sandi ≥ 6 karakter diterima, sesi di `localStorage` (`tynext-ems.session.v1`).

Bila video latar diganti, simpan sebagai **fragmented MP4 tanpa audio** supaya pengulangan tanpa jeda tetap bekerja
(berkas MP4 biasa jatuh ke `loop` bawaan yang menyisakan jeda 1–2 frame). Frame terakhir klip sebaiknya sama dengan
frame pertama; frame duplikat itu ditimpa otomatis. Konversi tanpa mengodekan ulang:

```bash
ffmpeg -i sumber.mp4 -an -c:v copy -movflags +frag_keyframe+empty_moov+default_base_moof+negative_cts_offsets -f mp4 public/day.mp4
```

## Halaman site

Klik marker, tombol View Details di kartu hover, atau ikon mata di Site List membuka `/plants/:plantId`:
header global yang sama, menu kiri **Overview, SCADA, Information, Device, Alarm, O&M Schedule**, dan kartu
putih berisi judul plant (pemilih site: klik nama untuk mencari dan berpindah site, menu yang sedang dibuka
dipertahankan) dengan chip status, lokasi, ID, dan owner. Setiap halaman tersusun dari panel abu-abu berjudul
(ikon + nama) yang berisi kartu putih, mengikuti frame Details-* di Figma.

- **Overview**: Live Energy Flow (diorama 3D per jenis site dengan sakelar 3D/2D; versi 2D SVG bila WebGL tidak ada),
  tiga kartu Daily Energy Generation / Lifetime Energy Production / Total Revenue dengan artwork, Operating Data
  dengan grafiknya dalam satu section dan satu filter (pemilih tanggal + Day/Month/Year/Lifetime). Tombol
  "Download report" di samping tanggal mengunduh .xlsx: sheet Operating Data + satu sheet per grafik (Day: Daily
  Power dan Battery SOC & Tariff; Month/Year/Lifetime: grafik energi). Grafik: Day → Daily Power
  serta Battery SOC & Tariff (SOC di sumbu kiri %, tarif beli/jual di sumbu kanan Rp/kWh) dengan zoom bersama;
  Month/Year/Lifetime → batang energi berkelompok (tidak ditumpuk) per hari/bulan/tahun: PV, Import, Export, Charge,
  Discharge, Consumption. Semua grafik punya "View as table". Kolom kanan: Battery, Plant
  Information, Weather, Environmental Benefits. Grafik harian memakai isian area bergradien; saat di-hover muncul
  crosshair putus-putus vertikal dan horizontal dengan label nilai dan jam, plus tooltip semi-transparan (65 %)
  berisi semua seri (baterai ditandai Charging/Discharging). Legenda berupa titik warna.

  **Diorama 3D** dibangun dari satu builder berbasis konfigurasi (`src/domains/site/domain/flow-scenes.ts`): tiap
  jenis site (Plantation, Resort / Hotel, Mining) hanya berisi ukuran dan warna panggung, model beban (pabrik,
  hotel, pabrik pengolahan), dekorasi, area pohon, dan jalan; posisi PV, baterai, grid, genset, dan busbar AC
  sama di semua site. Semua jalur ke busbar selalu tergambar: 0 kW = garis abu-abu putus-putus, aktif = garis
  berwarna dengan partikel searah aliran. Label berada di atas objek dengan garis penunjuk; sumber 0 kW tampil
  ringkas dan membesar saat di-hover. Kamera otomatis pas dengan isi adegan (dihitung ulang saat ukuran berubah),
  pohon berupa InstancedMesh dengan sebaran acak deterministik, jendela bangunan beban menyala sesuai beban.
  Menambah jenis site = menambah satu entri konfigurasi.

  **Efek cuaca** di diorama mengikuti cuaca plant saat ini (`plant.weather`, parameter di
  `src/domains/site/domain/weather-fx.ts`): Cerah = matahari dengan sinar berputar dan cahaya hangat; Berawan
  sebagian = matahari + awan melayang yang berbayang; Berawan = lebih banyak awan, cahaya redup; Hujan = awan
  kelabu dan rintik miring; Badai petir = hujan lebat, kilat bercabang dengan kilatan cahaya tiap 4–9 detik.
  Langit tipis di belakang kanvas dan chip cuaca di pojok kanan atas ikut berubah. `prefers-reduced-motion`
  menampilkan versi diam tanpa petir. Data cuaca masih dummy (fixture plant + prakiraan dari mock repository).
- **SCADA**: viewer pihak ketiga yang disematkan (iframe ber-sandbox, `VITE_SCADA_URL_TEMPLATE` mendukung
  `{plantId}`); tanpa konfigurasi tampil empty state "SCADA isn't connected yet".
- **Information**: tombol "Edit Information" di baris judul membuka drawer untuk Plant Name, Plant Type, Time Zone
  (WIB/WITA/WIT), alamat, koordinat (menerima -0.0263 atau S0.026300, dengan pratinjau peta), Owner, Owner’s Contact,
  Assigner Organization, dan Installer. Panel: Basic Information, System Capacity, Key Dates (timeline), Tariff Management (tarif beli
  dari grid dengan tombol Edit: Flat 24 hours atau Time of use = tarif dasar + periode jam bertarif sendiri, boleh
  melewati tengah malam; bar 24 jam dan grafik SOC & Tariff di Overview mengikuti), Location (citra satelit + Open Maps), Organization & Contact.
- **Device**: tab Inverter / Battery / PCS / Meter / EMI / Weather Station, pencarian nama/SN, filter status, tabel
  dengan kolom Action menempel, paginasi; detail perangkat dengan daftar perangkat sejenis di kiri, informasi, data
  real-time, dan chart parameter (tabel di bawah setiap chart bisa dibuka/ditutup; "Download report" mengunduh
  identitas perangkat + satu sheet per chart yang tampil). Parameter real-time dan chart
  mengikuti sheet "Device RealTime" di `public/EMS Parameter List.xlsx`:
  - Inverter = String Inverter; Battery = C&I ESS (SOC/SOH, working mode, daya charge/discharge, data per rak, sel
    max/min, daya PCS, energi tersedia, HVAC, fire suppression); PCS belum ada di sheet, parameternya tetap.
  - Meter punya jenis STG, DEG, ESS, PV, Load (parameter "Grid Meter") dan Power Sensor (parameter "Power Sensor").
    Daya ditampilkan dalam kW/kvar walau API mengirim W/var.
  - EMI / Weather Station: iradiansi & iradiasi harian (POA dan horizontal), suhu udara dan modul, angin.
- **Alarm**: tab Active/Recovered, pencarian, filter tipe perangkat dan level, tabel (Level, Status, Device Type, SN,
  Alarm Content, Alarm Time, Recovery Time, Duration) dengan empty state berilustrasi.
- **O&M Schedule**: tombol Add Activity di baris judul, tab All/Pending/Upcoming/Done, pencarian, filter tipe, tabel;
  di tab All ada pengalih List / Calendar (`?view=calendar`): kalender bulanan (Senin pertama) dengan aktivitas
  berwarna per status, klik membuka detail, "+" di tiap tanggal menambah aktivitas pada tanggal itu; layar sempit
  menampilkan agenda bulan;
  drawer Add Activity, Activity Details (foto dokumentasi, catatan, Mark as Done), dan Edit Activity. Status
  diturunkan (Done bila ditandai selesai; Upcoming bila tanggal masih di depan; Pending bila sudah tiba). Mock
  menyimpan perubahan di `localStorage` (`tynext-ems.maintenance.v1`).

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
    auth/         sesi & kredensial, port AuthRepository (mock: localStorage), halaman login dengan video latar siang/malam, penjaga rute
    device/       perangkat (inverter/baterai/PCS/meter), katalog parameter, pembacaan & deret per perangkat
    scada/        konfigurasi & bingkai embed viewer SCADA pihak ketiga
    impact/       rumus Environmental Benefits
    dashboard/    komposisi: overview, query Site list, halaman dashboard
    maintenance/  jadwal O&M: aktivitas, aturan status, validasi form, create/update (mock di localStorage)
    site/         komposisi: layout sidebar + halaman Overview/Info/Device/Alarm/O&M; domain geometri aliran (polyline, konfigurasi diorama 3D per jenis site, framing kamera, konektor) + builder adegan three.js
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
