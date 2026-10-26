import type { Device, Plant, WeatherCondition } from "../domain/plant";

// Data dummy: 14 plant tersebar dari Medan sampai Jayapura.
// Status TIDAK ditulis di sini; mock repository menurunkannya dari devices
// lewat status-policy supaya aturan yang sama dipakai di produksi.
export type PlantFixture = Omit<Plant, "status">;

interface DeviceSpec {
  vendor: string;
  inverters: number;
  offlineInverters?: number; // sebagian inverter terputus → ALARM
  alarms?: number; // alarm aktif di inverter pertama → ALARM
  allOffline?: boolean; // semua device terputus → OFFLINE
  hasBattery: boolean;
}

function makeDevices(plantId: string, spec: DeviceSpec): Device[] {
  const connected = (offline: boolean) => !(spec.allOffline || offline);
  const devices: Device[] = [];

  for (let i = 0; i < spec.inverters; i++) {
    devices.push({
      id: `${plantId}-INV-${String(i + 1).padStart(2, "0")}`,
      type: "INVERTER",
      vendor: spec.vendor,
      connected: connected(i < (spec.offlineInverters ?? 0)),
      activeAlarms: i === 0 ? (spec.alarms ?? 0) : 0,
    });
  }
  if (spec.hasBattery) {
    devices.push(
      { id: `${plantId}-BAT-01`, type: "BATTERY", vendor: spec.vendor, connected: connected(false), activeAlarms: 0 },
      { id: `${plantId}-PCS-01`, type: "PCS", vendor: spec.vendor, connected: connected(false), activeAlarms: 0 },
    );
  }
  devices.push({ id: `${plantId}-LOG-01`, type: "LOGGER", vendor: "Tynext", connected: connected(false), activeAlarms: 0 });

  return devices;
}

interface FixtureSpec {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  timezone: string;
  owner: { id: string; name: string; contactEmail: string };
  installer: string;
  pvKWp: number;
  inverterKW: number;
  batteryKWh: number;
  devices: Omit<DeviceSpec, "hasBattery">;
  weather: { condition: WeatherCondition; temperatureC: number };
  commissionedAt: string;
}

const OBSERVED_AT = "2026-10-26T07:53:00+07:00";

const specs: FixtureSpec[] = [
  {
    id: "PLT-001", name: "Sudamala Seraya Resort", address: "Labuan Bajo, Manggarai Barat, NTT",
    lat: -8.4939, lng: 119.8757, timezone: "Asia/Makassar",
    owner: { id: "OWN-001", name: "Ran66a", contactEmail: "rangga@xurya.com" }, installer: "Xurya Daya Indonesia",
    pvKWp: 118.8, inverterKW: 100, batteryKWh: 215,
    devices: { vendor: "Huawei", inverters: 8, offlineInverters: 1 },
    weather: { condition: "PARTLY_CLOUDY", temperatureC: 31 }, commissionedAt: "2024-06-01",
  },
  {
    id: "PLT-002", name: "Kawasan Industri Medan", address: "Medan, Sumatera Utara",
    lat: 3.5952, lng: 98.6722, timezone: "Asia/Jakarta",
    owner: { id: "OWN-002", name: "PT Sumatra Energi Mandiri", contactEmail: "ops@sumatraenergi.co.id" }, installer: "Tynext",
    pvKWp: 850, inverterKW: 800, batteryKWh: 0,
    devices: { vendor: "Sungrow", inverters: 8 },
    weather: { condition: "CLOUDY", temperatureC: 30 }, commissionedAt: "2023-11-15",
  },
  {
    id: "PLT-003", name: "Pabrik Kelapa Sawit Siak", address: "Siak, Riau",
    lat: 0.7893, lng: 102.0741, timezone: "Asia/Jakarta",
    owner: { id: "OWN-003", name: "PT Riau Agro Lestari", contactEmail: "engineering@riauagro.co.id" }, installer: "Tynext",
    pvKWp: 1200, inverterKW: 1000, batteryKWh: 500,
    devices: { vendor: "Huawei", inverters: 10 },
    weather: { condition: "RAIN", temperatureC: 28 }, commissionedAt: "2023-08-01",
  },
  {
    id: "PLT-004", name: "Gudang Logistik Lampung", address: "Bandar Lampung, Lampung",
    lat: -5.4295, lng: 105.261, timezone: "Asia/Jakarta",
    owner: { id: "OWN-004", name: "PT Lintas Nusantara Logistik", contactEmail: "facility@lintasnusantara.id" }, installer: "Tynext",
    pvKWp: 320, inverterKW: 300, batteryKWh: 0,
    devices: { vendor: "Growatt", inverters: 3 },
    weather: { condition: "CLEAR", temperatureC: 33 }, commissionedAt: "2024-02-10",
  },
  {
    id: "PLT-005", name: "Pondok Pesantren Al-Hikmah", address: "Cirebon, Jawa Barat",
    lat: -6.732, lng: 108.5523, timezone: "Asia/Jakarta",
    owner: { id: "OWN-005", name: "Yayasan Al-Hikmah Cirebon", contactEmail: "sekretariat@alhikmah-cirebon.or.id" }, installer: "Tynext",
    pvKWp: 65, inverterKW: 60, batteryKWh: 100,
    devices: { vendor: "Growatt", inverters: 1, alarms: 1 },
    weather: { condition: "CLEAR", temperatureC: 32 }, commissionedAt: "2025-01-20",
  },
  {
    id: "PLT-006", name: "Pabrik Tekstil Sidoarjo", address: "Sidoarjo, Jawa Timur",
    lat: -7.4478, lng: 112.7183, timezone: "Asia/Jakarta",
    owner: { id: "OWN-006", name: "PT Jaya Tekstil Nusantara", contactEmail: "utility@jayatekstil.co.id" }, installer: "Tynext",
    pvKWp: 980, inverterKW: 900, batteryKWh: 0,
    devices: { vendor: "Sungrow", inverters: 9 },
    weather: { condition: "PARTLY_CLOUDY", temperatureC: 34 }, commissionedAt: "2023-05-05",
  },
  {
    id: "PLT-007", name: "Pelabuhan Pontianak", address: "Pontianak, Kalimantan Barat",
    lat: -0.0263, lng: 109.3425, timezone: "Asia/Jakarta",
    owner: { id: "OWN-007", name: "PT Pelabuhan Khatulistiwa", contactEmail: "teknik@pelabuhankhatulistiwa.co.id" }, installer: "Tynext",
    pvKWp: 450, inverterKW: 400, batteryKWh: 300,
    devices: { vendor: "Huawei", inverters: 4 },
    weather: { condition: "THUNDERSTORM", temperatureC: 27 }, commissionedAt: "2024-09-01",
  },
  {
    id: "PLT-008", name: "Site Tambang Samarinda", address: "Samarinda, Kalimantan Timur",
    lat: -0.5022, lng: 117.1536, timezone: "Asia/Makassar",
    owner: { id: "OWN-008", name: "PT Borneo Mineral Resources", contactEmail: "power@borneomineral.co.id" }, installer: "Tynext",
    pvKWp: 1500, inverterKW: 1250, batteryKWh: 1000,
    devices: { vendor: "Huawei", inverters: 12 },
    weather: { condition: "CLOUDY", temperatureC: 31 }, commissionedAt: "2023-03-12",
  },
  {
    id: "PLT-009", name: "Hotel Pantai Losari", address: "Makassar, Sulawesi Selatan",
    lat: -5.1477, lng: 119.4327, timezone: "Asia/Makassar",
    owner: { id: "OWN-009", name: "PT Losari Hospitality", contactEmail: "engineering@losarihotel.com" }, installer: "Tynext",
    pvKWp: 210, inverterKW: 200, batteryKWh: 150,
    devices: { vendor: "Growatt", inverters: 2 },
    weather: { condition: "CLEAR", temperatureC: 33 }, commissionedAt: "2024-04-18",
  },
  {
    id: "PLT-010", name: "PLTS Atap Pabrik Bitung", address: "Bitung, Sulawesi Utara",
    lat: 1.4404, lng: 125.1217, timezone: "Asia/Makassar",
    owner: { id: "OWN-010", name: "PT Bitung Marine Industries", contactEmail: "maintenance@bitungmarine.co.id" }, installer: "Tynext",
    pvKWp: 540, inverterKW: 500, batteryKWh: 200,
    devices: { vendor: "Sungrow", inverters: 5, allOffline: true },
    weather: { condition: "RAIN", temperatureC: 29 }, commissionedAt: "2024-07-07",
  },
  {
    id: "PLT-011", name: "Resort Pantai Natsepa", address: "Ambon, Maluku",
    lat: -3.6186, lng: 128.3273, timezone: "Asia/Jayapura",
    owner: { id: "OWN-011", name: "PT Natsepa Resort", contactEmail: "gm@natseparesort.com" }, installer: "Tynext",
    pvKWp: 95, inverterKW: 80, batteryKWh: 120,
    devices: { vendor: "Growatt", inverters: 1 },
    weather: { condition: "PARTLY_CLOUDY", temperatureC: 30 }, commissionedAt: "2025-03-01",
  },
  {
    id: "PLT-012", name: "PLTS Komunal Sentani", address: "Jayapura, Papua",
    lat: -2.5916, lng: 140.5147, timezone: "Asia/Jayapura",
    owner: { id: "OWN-012", name: "Koperasi Energi Sentani", contactEmail: "pengurus@koperasisentani.id" }, installer: "Tynext",
    pvKWp: 150, inverterKW: 120, batteryKWh: 400,
    devices: { vendor: "Huawei", inverters: 2 },
    weather: { condition: "CLOUDY", temperatureC: 29 }, commissionedAt: "2024-11-11",
  },
  {
    id: "PLT-013", name: "Pabrik Semen Tuban", address: "Tuban, Jawa Timur",
    lat: -6.8963, lng: 112.065, timezone: "Asia/Jakarta",
    owner: { id: "OWN-013", name: "PT Semen Jawa Timur", contactEmail: "power.plant@semenjatim.co.id" }, installer: "Tynext",
    pvKWp: 2000, inverterKW: 1800, batteryKWh: 0,
    devices: { vendor: "Sungrow", inverters: 16 },
    weather: { condition: "CLEAR", temperatureC: 35 }, commissionedAt: "2022-12-01",
  },
  {
    id: "PLT-014", name: "Hotel Nusa Dua Bali", address: "Badung, Bali",
    lat: -8.7994, lng: 115.2289, timezone: "Asia/Makassar",
    owner: { id: "OWN-014", name: "PT Nusa Dua Hospitality", contactEmail: "chief.engineer@nusaduahotel.com" }, installer: "Tynext",
    pvKWp: 280, inverterKW: 250, batteryKWh: 250,
    devices: { vendor: "Huawei", inverters: 3, offlineInverters: 1 },
    weather: { condition: "CLEAR", temperatureC: 31 }, commissionedAt: "2024-08-20",
  },
];

export const plantFixtures: PlantFixture[] = specs.map((s) => ({
  id: s.id,
  name: s.name,
  location: { point: { lat: s.lat, lng: s.lng }, address: s.address, timezone: s.timezone },
  owner: s.owner,
  installer: s.installer,
  capacity: { pvKWp: s.pvKWp, inverterKW: s.inverterKW, batteryKWh: s.batteryKWh },
  devices: makeDevices(s.id, { ...s.devices, hasBattery: s.batteryKWh > 0 }),
  weather: { ...s.weather, observedAt: OBSERVED_AT },
  commissionedAt: s.commissionedAt,
}));
