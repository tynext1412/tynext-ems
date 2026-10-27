import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // three.js hanya dimuat oleh adegan aliran energi (lazy); dipisah agar cache-nya awet.
    chunkSizeWarningLimit: 1300,
    rollupOptions: { output: { manualChunks: { three: ["three", "@react-three/fiber", "@react-three/drei"] } } },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
