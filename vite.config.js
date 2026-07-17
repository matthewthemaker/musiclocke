import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base: works on GitHub Pages (or any subpath) regardless of
  // repo name or casing, with zero manual configuration needed.
  base: "./",
  server: {
    port: 5173,
    open: true,
  },
});
