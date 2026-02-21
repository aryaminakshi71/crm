#!/usr/bin/env bun
/**
 * Unified development server script
 * Starts both API and Web servers together
 */

import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

console.log("🚀 Starting CRM development servers...\n");

// Start API server
const apiProcess = spawn("bun", ["run", "dev"], {
  cwd: join(rootDir, "apps/api"),
  stdio: "inherit",
  shell: true,
});

// Start Web server
const webProcess = spawn("bun", ["run", "dev"], {
  cwd: join(rootDir, "apps/web"),
  stdio: "inherit",
  shell: true,
});

// Handle process termination
const cleanup = () => {
  console.log("\n🛑 Shutting down servers...");
  apiProcess.kill();
  webProcess.kill();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Log when processes exit
apiProcess.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`API server exited with code ${code}`);
  }
});

webProcess.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Web server exited with code ${code}`);
  }
});

console.log("✅ Both servers starting...");
console.log("   API: http://localhost:3001");
console.log("   Web: http://localhost:5173");
console.log("\n   Press Ctrl+C to stop both servers\n");
