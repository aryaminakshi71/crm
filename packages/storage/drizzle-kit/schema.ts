// Drizzle Kit schema entrypoint.
//
// This file exists because the storage package uses ".js" import specifiers in
// runtime-facing schema files (NodeNext/ESM style), but drizzle-kit loads TS
// sources directly and will fail if those ".js" specifiers point at files that
// don't exist at generation time.
export * from "../src/db/schema/auth.schema.ts";
export * from "../src/db/schema/audit-logs.schema.ts";
export * from "./schema-crm.ts";
export * from "./schema-integrations.ts";
