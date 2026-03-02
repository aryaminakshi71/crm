import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "../packages/storage/src/db/schema";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://aryaminakshi:postgres@localhost:5432/crm_db";

// Demo user details
const DEMO_EMAIL = "demo@nucleo.one";
const DEMO_PASSWORD = "password";
const DEMO_ORG_NAME = "Demo Organization";

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return await bcrypt.default.hash(password, 10);
}

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false, // Local dev doesn't need SSL
  });

  await client.connect();
  const db = drizzle(client, { schema });

  try {
    // Check if demo user already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, DEMO_EMAIL))
      .limit(1);

    let userId: string;
    let orgId: string;

    if (existingUser.length > 0) {
      console.log("✅ Demo user already exists, skipping user creation.");
      console.log(`   Email: ${DEMO_EMAIL}`);
      console.log(`   User ID: ${existingUser[0].id}`);
      userId = existingUser[0].id;

      // Get existing organization
      const existingMember = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.userId, existingUser[0].id))
        .limit(1);

      if (existingMember.length > 0) {
        orgId = existingMember[0].organizationId;
        console.log(`   Org ID: ${orgId}\n`);
      } else {
        // Create organization if user exists but has no org
        const [org] = await db
          .insert(schema.organizations)
          .values({
            id: crypto.randomUUID(),
            name: DEMO_ORG_NAME,
            slug: "demo-org",
            createdAt: new Date(),
          })
          .returning();

        orgId = org.id;
        console.log(`✅ Created organization: ${org.name} (ID: ${org.id})`);

        // Add user as org member (owner)
        await db.insert(schema.members).values({
          id: crypto.randomUUID(),
          userId: userId,
          organizationId: org.id,
          role: "owner",
          createdAt: new Date(),
        });

        console.log("✅ Added user as organization owner\n");
      }
    } else {
      console.log("Creating demo user...");

      // Create user
      const hashedPassword = await hashPassword(DEMO_PASSWORD);
      userId = crypto.randomUUID();

      await db.insert(schema.users).values({
        id: userId,
        email: DEMO_EMAIL,
        emailVerified: true,
        name: "Demo User",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Created user: ${DEMO_EMAIL} (ID: ${userId})`);

      // Create account for password auth
      await db.insert(schema.accounts).values({
        id: crypto.randomUUID(),
        userId: userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("✅ Created password account");

      // Create organization
      const [org] = await db
        .insert(schema.organizations)
        .values({
          id: crypto.randomUUID(),
          name: DEMO_ORG_NAME,
          slug: "demo-org",
          createdAt: new Date(),
        })
        .returning();

      orgId = org.id;
      console.log(`✅ Created organization: ${org.name} (ID: ${org.id})`);

      // Add user as org member (owner)
      await db.insert(schema.members).values({
        id: crypto.randomUUID(),
        userId: userId,
        organizationId: org.id,
        role: "owner",
        createdAt: new Date(),
      });

      console.log("✅ Added user as organization owner\n");
    }

    // Seed CRM data
    await seedCRMData(db, userId, orgId);

    console.log("\n🎉 Seed complete!\n");
    console.log("📋 Demo Credentials:");
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log("\n🚀 Start the app with: bun run dev");
    console.log("   Then visit: http://localhost:5180/login\n");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

async function seedCRMData(db: any, userId: string, orgId: string) {
  console.log("Creating sample CRM data...");

  // Check if we already have contacts
  const existingContacts = await db
    .select()
    .from(schema.contacts)
    .where(eq(schema.contacts.organizationId, orgId))
    .limit(1);

  if (existingContacts.length > 0) {
    console.log("✅ CRM data already exists, skipping.");
    return;
  }

  // Create sample contacts
  const contacts = [
    {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@acme.com",
      companyName: "Acme Corp",
      phone: "+1-555-0101",
    },
    {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@techstart.io",
      companyName: "TechStart Inc",
      phone: "+1-555-0102",
    },
    {
      firstName: "Michael",
      lastName: "Brown",
      email: "mbrown@enterprise.co",
      companyName: "Enterprise Solutions",
      phone: "+1-555-0103",
    },
    {
      firstName: "Emily",
      lastName: "Davis",
      email: "emily.davis@innovate.com",
      companyName: "Innovate Labs",
      phone: "+1-555-0104",
    },
    {
      firstName: "David",
      lastName: "Wilson",
      email: "dwilson@globaltech.net",
      companyName: "GlobalTech",
      phone: "+1-555-0105",
    },
  ];

  const createdContacts = [];
  for (const contact of contacts) {
    const [created] = await db
      .insert(schema.contacts)
      .values({
        organizationId: orgId,
        createdBy: userId,
        ...contact,
      })
      .returning();
    createdContacts.push(created);
  }
  console.log(`✅ Created ${createdContacts.length} contacts`);

  // Create sample deals
  const deals = [
    {
      name: "Enterprise License Deal",
      value: "50000",
      stage: "negotiation",
      contactIdx: 2,
    },
    {
      name: "Startup Package",
      value: "5000",
      stage: "proposal",
      contactIdx: 1,
    },
    {
      name: "Annual Subscription",
      value: "12000",
      stage: "qualified",
      contactIdx: 0,
    },
    {
      name: "Custom Integration",
      value: "25000",
      stage: "lead",
      contactIdx: 3,
    },
    { name: "Support Contract", value: "8000", stage: "won", contactIdx: 4 },
  ];

  for (const deal of deals) {
    await db.insert(schema.deals).values({
      organizationId: orgId,
      createdBy: userId,
      name: deal.name,
      value: deal.value,
      stage: deal.stage,
      contactId: createdContacts[deal.contactIdx].id,
    });
  }
  console.log(`✅ Created ${deals.length} deals`);

  // Create sample leads
  const leadData = [
    {
      email: "prospect1@company1.com",
      firstName: "Alex",
      lastName: "Turner",
      source: "website",
      companyName: "Future Corp",
    },
    {
      email: "prospect2@startup.io",
      firstName: "Jessica",
      lastName: "Lee",
      source: "referral",
      companyName: "NextGen Startup",
    },
    {
      email: "prospect3@bigco.com",
      firstName: "Robert",
      lastName: "Chen",
      source: "event",
      companyName: "BigCo Industries",
    },
  ];

  for (const lead of leadData) {
    await db.insert(schema.leads).values({
      organizationId: orgId,
      createdBy: userId,
      ...lead,
    });
  }
  console.log(`✅ Created ${leadData.length} leads`);

  // Create sample activities
  const activityData = [
    { type: "call", subject: "Discovery call with John", contactIdx: 0 },
    { type: "meeting", subject: "Product demo for Sarah", contactIdx: 1 },
    { type: "email", subject: "Proposal sent to Michael", contactIdx: 2 },
    { type: "note", subject: "Follow-up reminder for Emily", contactIdx: 3 },
  ];

  for (const activity of activityData) {
    await db.insert(schema.activities).values({
      organizationId: orgId,
      userId: userId,
      type: activity.type,
      subject: activity.subject,
      contactId: createdContacts[activity.contactIdx].id,
    });
  }
  console.log(`✅ Created ${activityData.length} activities`);
}

// Run the seed
seed().catch(console.error);
