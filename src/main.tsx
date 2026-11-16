import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { App } from "./app/App";
import { applyStoredTheme } from "./shared/lib/theme";
import { installStaleBuildReload } from "./shared/lib/staleBuild";

applyStoredTheme();
installStaleBuildReload();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
