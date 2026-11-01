import type { Plant, PlantType } from "./plant";

// Data plant yang boleh diubah dari halaman Information. Kapasitas, perangkat, dan tanggal
// tetap mengikuti data komisioning, jadi tidak ada di sini.
export interface PlantInfoUpdate {
  name: string;
  plantType: PlantType;
  timezone: string; // IANA
  address: string;
  lat: number;
  lng: number;
  ownerName: string;
  ownerContactEmail: string;
  organization: string; // kosong = tidak ada organisasi yang ditugaskan
  installer: string;
}

// Zona waktu Indonesia (WIB, WITA, WIT).
export const PLANT_TIME_ZONES: readonly { id: string; label: string }[] = [
  { id: "Asia/Jakarta", label: "WIB · Asia/Jakarta" },
  { id: "Asia/Makassar", label: "WITA · Asia/Makassar" },
  { id: "Asia/Jayapura", label: "WIT · Asia/Jayapura" },
];

export const NAME_MAX = 120;
export const ADDRESS_MAX = 240;

export function infoOf(plant: Plant): PlantInfoUpdate {
  return {
    name: plant.name,
    plantType: plant.plantType,
    timezone: plant.location.timezone,
    address: plant.location.address,
    lat: plant.location.point.lat,
    lng: plant.location.point.lng,
    ownerName: plant.owner.name,
    ownerContactEmail: plant.owner.contactEmail,
    organization: plant.organization ?? "",
    installer: plant.installer,
  };
}

// Terapkan perubahan ke plant; teks dirapikan (trim), organisasi kosong dihapus.
export function applyInfo(plant: Plant, info: PlantInfoUpdate): Plant {
  const organization = info.organization.trim();
  return {
    ...plant,
    name: info.name.trim(),
    plantType: info.plantType,
    location: { ...plant.location, timezone: info.timezone, address: info.address.trim(), point: { lat: info.lat, lng: info.lng } },
    owner: { ...plant.owner, name: info.ownerName.trim(), contactEmail: info.ownerContactEmail.trim() },
    organization: organization === "" ? undefined : organization,
    installer: info.installer.trim(),
  };
}

// Koordinat dari input teks: "-0.0263", "0,0263" (koma desimal), atau dengan arah "S0.026300" / "109.3425 E".
export function parseCoordinate(raw: string, axis: "lat" | "lng"): number {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "").replace(",", ".");
  const m = /^([NSEW])?(-?\d+(?:\.\d+)?)([NSEW])?$/.exec(s);
  if (!m) return Number.NaN;
  const dir = m[1] ?? m[3];
  const allowed = axis === "lat" ? ["N", "S"] : ["E", "W"];
  if (dir && !allowed.includes(dir)) return Number.NaN;
  const value = Number(m[2]);
  if (dir && value < 0) return Number.NaN; // "S-1" ambigu
  return dir === "S" || dir === "W" ? -value : value;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PlantInfoErrors = Partial<Record<keyof PlantInfoUpdate, string>>;

export function validateInfo(info: PlantInfoUpdate): PlantInfoErrors {
  const errors: PlantInfoErrors = {};
  const required = (key: "name" | "address" | "ownerName" | "installer", label: string, max = NAME_MAX) => {
    const v = info[key].trim();
    if (v === "") errors[key] = `${label} is required`;
    else if (v.length > max) errors[key] = `${label} must be at most ${max} characters`;
  };
  required("name", "Plant name");
  required("address", "Address", ADDRESS_MAX);
  required("ownerName", "Owner");
  required("installer", "Installer");
  if (info.organization.trim().length > NAME_MAX) errors.organization = `Organization must be at most ${NAME_MAX} characters`;

  if (Number.isNaN(info.lat)) errors.lat = "Enter a number, e.g. -0.026300 or S0.026300";
  else if (info.lat < -90 || info.lat > 90) errors.lat = "Latitude must be between -90 and 90";
  if (Number.isNaN(info.lng)) errors.lng = "Enter a number, e.g. 109.342500 or E109.342500";
  else if (info.lng < -180 || info.lng > 180) errors.lng = "Longitude must be between -180 and 180";

  const email = info.ownerContactEmail.trim();
  if (email === "") errors.ownerContactEmail = "Owner’s contact is required";
  else if (!EMAIL.test(email)) errors.ownerContactEmail = "Enter a valid email address";

  if (!PLANT_TIME_ZONES.some((z) => z.id === info.timezone)) errors.timezone = "Choose a time zone";
  return errors;
}
