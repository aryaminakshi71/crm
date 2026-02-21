import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  // Single source of truth for schema lives in the storage package.
  schema: "./packages/storage/drizzle-kit/schema.ts",
  out: "./packages/storage/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
