/**
 * Simple test server for Nucleo One API
 */

import { createApp } from "./src/app";

const PORT = 3001;

const app = createApp();

Bun.serve({
  port: PORT,
  fetch: (req) =>
    app.fetch(
      req,
      {
        DATABASE: { connectionString: "" },
        NODE_ENV: "development",
      },
      undefined,
    ),
});

console.log(`Nucleo One API running on http://localhost:${PORT}`);
