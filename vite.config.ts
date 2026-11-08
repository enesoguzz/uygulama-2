/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// SINGLEFILE=1 ile tek HTML dosyası üretilir (önizleme sayfası için).
// Normal derleme mobil uygulama (Capacitor) ve web sunucusu için klasik dist/ çıktısı verir.
const singleFile = process.env.SINGLEFILE === "1";

export default defineConfig({
  plugins: [react(), ...(singleFile ? [viteSingleFile()] : [])],
  build: {
    outDir: singleFile ? "dist-onizleme" : "dist",
    assetsInlineLimit: singleFile ? 100_000_000 : 4096,
  },
  test: {
    environment: "node",
  },
});
