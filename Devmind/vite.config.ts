import * as cloudflare from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare && (cloudflare as any).default
      ? (cloudflare as any).default()
      : cloudflare,
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    fs: {
      allow: ['..'],
    },
  },
  build: {
    target: "esnext",
  },
});
