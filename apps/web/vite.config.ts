import net from "node:net";
import path from "path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

async function findAvailablePort(preferredPort: number): Promise<number> {
  for (let offset = 0; offset < 25; offset++) {
    const candidate = preferredPort + offset;
    const isFree = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.unref();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(candidate, "127.0.0.1");
    });
    if (isFree) return candidate;
  }

  // Fall back to a deterministic high port if all probes are occupied.
  return preferredPort + 100;
}

export default defineConfig(async ({ mode }) => {
  // Capture PORT from shell BEFORE loadEnv (which might load PORT from .env)
  const shellPort = process.env.PORT;
  // Load env from root (../../)
  const env = loadEnv(mode, path.resolve(__dirname, "../../"), "");
  // PORT from shell environment takes highest priority
  const port = shellPort || env.PORT || "3001";
  const preferredDevtoolsPort = Number.isFinite(Number(port))
    ? Number(port) + 10000
    : 42069;
  const devtoolsPort = await findAvailablePort(preferredDevtoolsPort);
  process.env = { ...process.env, ...env };

  return {
    // Vite equivalent of Next.js transpilePackages for monorepo workspace packages
    optimizeDeps: {
      // Exclude workspace packages so they are compiled as source
      exclude: ["@crm/env", "@crm/api", "@crm/ui"],
    },
    server: {
      port: Number(port),
      host: true,
      strictPort: false,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8787",
          changeOrigin: true,
        },
      },
    },
    build: {
      target: "esnext",
      minify: "esbuild",
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        external: [
          // Externalize Cloudflare-specific modules
          "cloudflare:workers",
          "@scalar/hono-api-reference",
        ],
      },
    },
    environments: {
      ssr: {
        optimizeDeps: {
          exclude: [
            "@tanstack/router-core",
            "@tanstack/react-start",
            "@tanstack/react-router",
          ],
        },
      },
      client: {
        build: {
          rollupOptions: {
            output: {
              manualChunks: (id: string) => {
                if (!id.includes("node_modules")) return;
                if (id.includes("/react/") || id.includes("react-dom"))
                  return "vendor-react";
                if (id.includes("@tanstack/") || id.includes("@radix-ui/"))
                  return "vendor-framework";
                if (
                  id.includes("react-hook-form") ||
                  id.includes("@hookform/resolvers")
                )
                  return "vendor-forms";
                if (id.includes("lucide-react")) return "vendor-icons";
                if (
                  id.includes("recharts") ||
                  id.includes("d3-") ||
                  id.includes("xlsx")
                )
                  return "vendor-charts";
                if (id.includes("/zod/")) return "vendor-zod";
              },
            },
          },
        },
      },
    },
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      ...(process.env.SKIP_CLOUDFLARE !== "true"
        ? [
            cloudflare({
              viteEnvironment: { name: "ssr" },
              persist: true,
            }),
          ]
        : []),
      devtools({
        eventBusConfig: {
          port: devtoolsPort,
        },
      }),
      tailwindcss(),
      tanstackStart({
        srcDirectory: "src",
        start: { entry: "./start.tsx" },
        server: { entry: "./server.ts" },
      }),
      viteReact(),
      // Bundle analyzer (only in production builds when ANALYZE=true)
      process.env.ANALYZE === "true" &&
        visualizer({
          filename: "./dist/stats.html",
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: "treemap",
        }),
      // Brand manifest generator plugin
      {
        name: "brand-manifest",
        configResolved(_config) {
          // Manifest is generated at build time from env vars
        },
        generateBundle() {
          const brandName = env.VITE_BRAND_NAME || "Nucleo One";
          const themeColor = env.VITE_THEME_COLOR || "#e11d48";
          const manifest = {
            name: brandName,
            short_name: brandName,
            description: `${brandName} — Business Management Platform`,
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: themeColor,
            orientation: "portrait-primary",
            icons: [
              { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
              { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
            ],
          };
          this.emitFile({
            type: "asset",
            fileName: "manifest.json",
            source: JSON.stringify(manifest, null, 2),
          });
        },
      },
    ],
  };
});
