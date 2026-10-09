import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Göreli temel yol: GitHub Pages'in /depo-adi/ alt yolunda da, yerelde de çalışır (hash yönlendirme sayesinde).
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
