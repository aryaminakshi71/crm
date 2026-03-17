import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/routers/__tests__/setup.ts"],
    include: [
      "src/routers/__tests__/**/*.{test,spec}.ts",
      "src/lib/__tests__/**/*.{test,spec}.ts",
    ],
    exclude: ["node_modules/**", "dist/**", "build/**"],
  },
});
