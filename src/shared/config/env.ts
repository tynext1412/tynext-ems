export type DataSource = "mock" | "http";

function readDataSource(): DataSource {
  const raw = import.meta.env.VITE_DATA_SOURCE;
  return raw === "http" ? "http" : "mock";
}

export const env = {
  dataSource: readDataSource(),
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "",
  // URL viewer SCADA pihak ketiga untuk semua plant; boleh memakai {plantId}. Kosong = per-plant dari repository.
  scadaUrlTemplate: (import.meta.env.VITE_SCADA_URL_TEMPLATE as string | undefined) || undefined,
} as const;
