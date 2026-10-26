import type { PlantStatus } from "../domain/plant";

export const STATUS_COLOR: Record<PlantStatus, string> = {
  ONLINE: "var(--color-ok)",
  ALARM: "var(--color-warn)",
  OFFLINE: "var(--color-danger)",
};
