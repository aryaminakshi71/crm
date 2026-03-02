import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle-kit/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.PGUSER || process.env.USER || "postgres"}@localhost:5432/crm_db`,
  },
});
