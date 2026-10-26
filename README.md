# Tynext EMS — Dashboard

Frontend Energy Management System untuk memantau fleet plant PLTS (PV + BESS) Tynext.
Tahap ini baru mencakup halaman **Dashboard**: peta sebaran plant, kartu summary,
Environmental Benefits, BESS performance, dan Plant List.

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

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · react-router · Leaflet ·
framer-motion · lucide-react · vitest.

## Tampilan

Peta memenuhi seluruh layar; halaman tidak di-scroll. Plant List ada di **bottom sheet**
(`src/shared/ui/BottomSheet.tsx`) yang ditarik ke atas seperti panel komentar Reels:
geser atau klik bar bawah untuk membuka; geser ke bawah, klik backdrop, tombol tutup,
atau Escape untuk menutup. Sheet terbuka tercermin di URL (`#plant-list`) sehingga bisa
dibagikan dan tombol Back menutupnya. Pengguna dengan `prefers-reduced-motion` mendapat
perpindahan tanpa animasi.

Tema **grafit + tembaga** (token di `src/styles/index.css`): dasar grafit netral, satu
aksen tembaga `#d48a4e` untuk angka fokus, tombol utama, dan garis tepi sheet; hijau /
kuning / merah hanya untuk status plant. Font IBM Plex Sans untuk antarmuka dan IBM Plex
Mono (angka tabular) untuk semua readout. Citra satelit peta diberi filter ke arah grafit
supaya marker status menjadi satu-satunya warna jenuh di peta.

## Halaman site

Klik marker atau tombol Operation membuka `/plants/:plantId`: sidebar menu **Overview, SCADA,
Info, Device, Alarm, O&M schedule** dengan header status plant dan waktu data terakhir. Nama site di
header adalah pemilih site: klik untuk membuka daftar, cari berdasarkan nama/alamat/ID, pilih dengan
mouse atau keyboard (panah, Enter, Escape); menu yang sedang dibuka dipertahankan di site tujuan.

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
  Month / Year, terpisah dari Operating Data). Mode Day (data per 5 menit) bisa di-zoom: seret
  area di grafik mana pun, atau pakai tombol perbesar / perkecil / reset; ketiga grafik harian
  berbagi rentang yang sama dan tick waktu menyesuaikan (3 jam → 1 jam → 30 → 15 → 5 menit).
  Warna seri tetap per entitas dan lolos validator CVD skill dataviz di surface grafit; setiap
  grafik punya legenda yang bisa dimatikan per seri, crosshair + tooltip, dan kembaran tabel
  ("Lihat sebagai tabel"). Tidak ada sumbu ganda: SOC dan tarif digambar sebagai dua grafik yang
  berbagi sumbu waktu.
- **Info**, **Device**, **Alarm** (aktif/riwayat, jumlah aktif tampil di sidebar) diisi dari data yang ada.
- **SCADA** dan **O&M schedule** belum punya spesifikasi; halamannya ada dan diberi label jelas
  "belum dirancang" agar menu tidak buntu.

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
    impact/       rumus Environmental Benefits
    dashboard/    komposisi: overview, query Plant List, halaman dashboard
    site/         komposisi: layout sidebar + halaman Overview/Info/Device/Alarm/stub
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
