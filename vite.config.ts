import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/odata": {
        target: "http://localhost:5129",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
