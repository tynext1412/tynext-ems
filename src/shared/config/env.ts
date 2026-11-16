export type DataSource = "mock" | "http";

// Data selalu dari endpoint backend. Pilihan lama lewat VITE_DATA_SOURCE (default mock) dikomentari, tidak dihapus:
// function readDataSource(): DataSource {
//   const raw = import.meta.env.VITE_DATA_SOURCE;
//   return raw === "http" ? "http" : "mock";
// }
function readDataSource(): DataSource {
  return "http";
}

export const env = {
  dataSource: readDataSource(),
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "",
  // URL viewer SCADA pihak ketiga untuk semua plant; boleh memakai {plantId}. Kosong = per-plant dari repository.
  scadaUrlTemplate: (import.meta.env.VITE_SCADA_URL_TEMPLATE as string | undefined) || undefined,
} as const;
