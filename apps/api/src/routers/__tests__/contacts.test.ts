/**
 * Contacts Router Tests
 */

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { schema } from "../../procedures";
import { contactsRouter } from "../contacts";
import { hasDatabase, testDb } from "./setup";
import { createMockOrgContext, createTestContact } from "./test-utils";

describe("Contacts Router", () => {
  let context: ReturnType<typeof createMockOrgContext>;
  let testOrgId: string;

  beforeEach(async () => {
    if (!hasDatabase || !testDb) {
      return;
    }

    // Clean up test data
    await testDb.delete(schema.contacts);
    await testDb.delete(schema.member);
    await testDb.delete(schema.organization);
    await testDb.delete(schema.user);

    // Create test organization
    const { organizations } = await import("@crm/storage/db/schema");
    const [org] = await testDb
      .insert(organizations)
      .values({
        id: crypto.randomUUID(),
        name: "Test Organization",
        slug: `test-org-${Date.now()}`,
      })
      .returning();
    testOrgId = org.id;

    // Create mock context
    context = createMockOrgContext({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug || "test-org",
        plan: "pro",
      },
    });
  });

  describe("list", () => {
    it.skipIf(!hasDatabase || !testDb)(
      "should return paginated contacts",
      async () => {
        // Create multiple test contacts
        await createTestContact(testDb, context, { name: "Contact One" });
        await createTestContact(testDb, context, { name: "Contact Two" });
        await createTestContact(testDb, context, { name: "Contact Three" });

        // Call list endpoint
        const result = await contactsRouter.list.handler({
          context,
          input: { page: 1, limit: 2 },
        });

        // Assert pagination
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.total).toBeGreaterThanOrEqual(3);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(2);
        expect(result.totalPages).toBeGreaterThanOrEqual(2);
        expect(result.data.length).toBeLessThanOrEqual(2);
      },
    );
  });

  describe("get", () => {
    it.skipIf(!hasDatabase || !testDb)(
      "should return single contact",
      async () => {
        // Create test contact
        const testContact = await createTestContact(testDb, context, {
          name: "Test Contact",
          email: "test@example.com",
        });

        // Call get endpoint
        const result = await contactsRouter.get.handler({
          context,
          input: { id: testContact.id },
        });

        // Assert correct contact is returned
        expect(result).toBeDefined();
        expect(result.id).toBe(testContact.id);
        expect(result.name).toBe("Test Contact");
      },
    );
  });

  describe("create", () => {
    it.skipIf(!hasDatabase || !testDb)(
      "should create new contact",
      async () => {
        // Prepare contact input
        const input = {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "+1234567890",
        };

        // Call create endpoint
        const result = await contactsRouter.create.handler({
          context,
          input,
        });

        // Assert contact is created
        expect(result).toBeDefined();
        expect(result.firstName).toBe("John");
        expect(result.lastName).toBe("Doe");
        expect(result.email).toBe("john.doe@example.com");
        expect(result.organizationId).toBe(context.organization.id);

        // Verify contact exists in database
        const { contacts } = schema;
        const [dbContact] = await testDb
          .select()
          .from(contacts)
          .where(eq(contacts.id, result.id))
          .limit(1);
        expect(dbContact).toBeDefined();
        expect(dbContact.firstName).toBe("John");
      },
    );
  });
});
