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
    // /api diteruskan ke backend tynext-mqtt supaya cookie sesi satu origin. Bawaan: backend di VPS
    // (https://mqtt-poc.tynext.co.id); backend lokal: VITE_API_PROXY_TARGET=http://localhost:8090.
    proxy: {
      "/api": { target: process.env.VITE_API_PROXY_TARGET ?? "https://mqtt-poc.tynext.co.id", changeOrigin: true, secure: true, ws: true },
    },
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
