import { eq } from "drizzle-orm";
import { createDb, schema } from "./packages/storage/src";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const db = createDb({ connectionString: databaseUrl });

  console.log("Seeding demo-org...");

  // 1. Create Organization if it doesn't exist
  const existingOrg = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, "demo-org"))
    .limit(1);

  if (existingOrg.length === 0) {
    await db.insert(schema.organizations).values({
      id: "demo-org",
      name: "Demo Organization",
      slug: "demo",
    });
    console.log("Created demo-org");
  } else {
    console.log("demo-org already exists");
  }

  // 2. Create User if it doesn't exist
  const demoUserId = "demo-user-001";
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, demoUserId))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(schema.users).values({
      id: demoUserId,
      email: "demo@example.com",
      name: "Demo User",
      emailVerified: true,
    });
    console.log("Created demo user");
  } else {
    console.log("Demo user already exists");
  }

  // 3. Ensure User is a member of Organization
  const existingMember = await db
    .select()
    .from(schema.members)
    .where(eq(schema.members.organizationId, "demo-org"))
    .limit(1);
  if (existingMember.length === 0) {
    await db.insert(schema.members).values({
      id: "demo-member-001",
      organizationId: "demo-org",
      userId: demoUserId,
      role: "owner",
    });
    console.log("Added demo user to demo-org");
  } else {
    console.log("Demo member already exists");
  }

  console.log("Seed completed successfully");
}

seed().catch(console.error);
