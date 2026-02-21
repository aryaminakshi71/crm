import * as dotenv from "dotenv";
import { createDb } from "../packages/storage/src/db/index.js";

dotenv.config({ path: "apps/web/.dev.vars" });
// Also try to load standard env just in case
dotenv.config();

async function test() {
  console.log("Testing DB Connection...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  try {
    const db = createDb(process.env.DATABASE_URL);
    const result = await db.execute("SELECT 1");
    console.log("Success:", result);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
