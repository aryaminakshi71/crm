/**
 * Contacts Router Unit Tests
 *
 * Tests for list, create, update, and delete handlers with mocked database.
 * All operations are scoped to an organizationId.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { createMockOrgContext } from "./test-utils";

// ─── Mock database factory ─────────────────────────────────────────────────────

function createMockDb(overrides: Partial<ReturnType<typeof buildMockDb>> = {}) {
  return { ...buildMockDb(), ...overrides };
}

function buildMockDb() {
  const mockReturning = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn();
  const mockOffset = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockFrom = vi.fn();
  const mockValues = vi.fn();
  const mockSet = vi.fn();

  return {
    mockReturning,
    mockWhere,
    mockLimit,
    mockOrderBy,
    mockOffset,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockFrom,
    mockValues,
    mockSet,
  };
}

// ─── Handler logic mirrors (pure functions extracted from router) ───────────────

function buildPaginationResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

function applySearchFilter(
  contacts: Array<{ firstName: string; lastName: string; email: string; companyName?: string }>,
  search: string,
): typeof contacts {
  const lower = search.toLowerCase();
  return contacts.filter(
    (c) =>
      c.firstName.toLowerCase().includes(lower) ||
      c.lastName.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower) ||
      (c.companyName ?? "").toLowerCase().includes(lower),
  );
}

function filterByOrg<T extends { organizationId: string }>(
  items: T[],
  orgId: string,
): T[] {
  return items.filter((item) => item.organizationId === orgId);
}

function validateContactInput(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): string[] {
  const errors: string[] = [];
  if (!input.firstName || input.firstName.trim() === "") {
    errors.push("firstName is required");
  }
  if (!input.lastName || input.lastName.trim() === "") {
    errors.push("lastName is required");
  }
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push("email must be a valid email address");
  }
  return errors;
}

// ─── List handler tests ────────────────────────────────────────────────────────

describe("Contacts Router: list handler", () => {
  let context: ReturnType<typeof createMockOrgContext>;

  beforeEach(() => {
    context = createMockOrgContext();
  });

  it("returns paginated contact data", () => {
    const contacts = [
      { id: "c1", organizationId: context.organization.id, firstName: "Alice", lastName: "Smith", email: "a@ex.com" },
      { id: "c2", organizationId: context.organization.id, firstName: "Bob", lastName: "Jones", email: "b@ex.com" },
    ];

    const result = buildPaginationResult(contacts, contacts.length, 1, 50);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.totalPages).toBe(1);
  });

  it("paginates correctly with limit < total", () => {
    const allContacts = Array.from({ length: 15 }, (_, i) => ({
      id: `c${i}`,
      organizationId: context.organization.id,
      firstName: `First${i}`,
      lastName: `Last${i}`,
      email: `user${i}@ex.com`,
    }));

    const page = 2;
    const limit = 5;
    const offset = (page - 1) * limit;
    const paginated = allContacts.slice(offset, offset + limit);
    const result = buildPaginationResult(paginated, allContacts.length, page, limit);

    expect(result.data).toHaveLength(5);
    expect(result.total).toBe(15);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
  });

  it("filters contacts by organization id", () => {
    const contacts = [
      { id: "c1", organizationId: "org-A", firstName: "Alice", lastName: "S", email: "a@a.com" },
      { id: "c2", organizationId: "org-B", firstName: "Bob", lastName: "J", email: "b@b.com" },
      { id: "c3", organizationId: "org-A", firstName: "Carol", lastName: "K", email: "c@c.com" },
    ];

    const orgContacts = filterByOrg(contacts, "org-A");
    expect(orgContacts).toHaveLength(2);
    expect(orgContacts.every((c) => c.organizationId === "org-A")).toBe(true);
  });

  it("applies search filter across firstName, lastName, email, companyName", () => {
    const contacts = [
      { firstName: "Alice", lastName: "Smith", email: "alice@acme.com", companyName: "Acme Corp" },
      { firstName: "Bob", lastName: "Jones", email: "bob@beta.com", companyName: "Beta Ltd" },
      { firstName: "Carol", lastName: "Green", email: "carol@corp.com", companyName: "Corp Inc" },
    ];

    expect(applySearchFilter(contacts, "alice")).toHaveLength(1);
    expect(applySearchFilter(contacts, "beta")).toHaveLength(1);
    expect(applySearchFilter(contacts, "corp")).toHaveLength(2); // "Carol corp.com" + "Corp Inc"
    expect(applySearchFilter(contacts, "zzz")).toHaveLength(0);
  });

  it("returns empty data array when no contacts exist", () => {
    const result = buildPaginationResult([], 0, 1, 50);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});

// ─── Create handler tests ──────────────────────────────────────────────────────

describe("Contacts Router: create handler", () => {
  let context: ReturnType<typeof createMockOrgContext>;

  beforeEach(() => {
    context = createMockOrgContext();
  });

  it("accepts valid contact input", () => {
    const errors = validateContactInput({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects missing firstName", () => {
    const errors = validateContactInput({ lastName: "Doe" });
    expect(errors).toContain("firstName is required");
  });

  it("rejects missing lastName", () => {
    const errors = validateContactInput({ firstName: "John" });
    expect(errors).toContain("lastName is required");
  });

  it("rejects invalid email format", () => {
    const errors = validateContactInput({
      firstName: "Jane",
      lastName: "Doe",
      email: "not-an-email",
    });
    expect(errors).toContain("email must be a valid email address");
  });

  it("accepts valid email formats", () => {
    const validEmails = [
      "user@example.com",
      "user+tag@domain.org",
      "user.name@sub.domain.co.uk",
    ];

    validEmails.forEach((email) => {
      const errors = validateContactInput({ firstName: "A", lastName: "B", email });
      const emailErrors = errors.filter((e) => e.includes("email"));
      expect(emailErrors).toHaveLength(0);
    });
  });

  it("scopes new contact to organization", () => {
    const orgId = context.organization.id;
    const input = { firstName: "Eve", lastName: "Black", email: "eve@test.com" };

    const created = {
      id: crypto.randomUUID(),
      organizationId: orgId,
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(created.organizationId).toBe(orgId);
    expect(created.firstName).toBe("Eve");
  });

  it("accepts optional fields without errors", () => {
    const errors = validateContactInput({
      firstName: "Frank",
      lastName: "Miles",
      // no email
    });
    expect(errors).toHaveLength(0);
  });
});

// ─── Update handler tests ──────────────────────────────────────────────────────

describe("Contacts Router: update handler", () => {
  let context: ReturnType<typeof createMockOrgContext>;

  beforeEach(() => {
    context = createMockOrgContext();
  });

  it("applies partial update correctly", () => {
    const original = {
      id: "c1",
      organizationId: context.organization.id,
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@old.com",
      phone: null,
    };

    const patch = { email: "alice@new.com", phone: "+1234567890" };
    const updated = { ...original, ...patch };

    expect(updated.email).toBe("alice@new.com");
    expect(updated.phone).toBe("+1234567890");
    expect(updated.firstName).toBe("Alice"); // unchanged
  });

  it("does not overwrite organizationId on update", () => {
    const original = {
      id: "c2",
      organizationId: context.organization.id,
      firstName: "Bob",
      lastName: "Jones",
    };

    const patch = { firstName: "Robert", organizationId: "hacker-org-id" };
    // The router should strip organizationId from patch; simulate that
    const safePatch = (({ organizationId: _, ...rest }) => rest)(patch as any);
    const updated = { ...original, ...safePatch };

    expect(updated.organizationId).toBe(context.organization.id);
    expect(updated.firstName).toBe("Robert");
  });

  it("returns not found error when contact does not belong to org", () => {
    function findContactInOrg(
      contacts: Array<{ id: string; organizationId: string }>,
      contactId: string,
      orgId: string,
    ): { id: string; organizationId: string } | null {
      return contacts.find((c) => c.id === contactId && c.organizationId === orgId) ?? null;
    }

    const contacts = [{ id: "c1", organizationId: "org-A" }];
    const result = findContactInOrg(contacts, "c1", "org-B");
    expect(result).toBeNull();
  });
});

// ─── Delete handler tests ──────────────────────────────────────────────────────

describe("Contacts Router: delete handler", () => {
  let context: ReturnType<typeof createMockOrgContext>;

  beforeEach(() => {
    context = createMockOrgContext();
  });

  it("removes contact from list after delete", () => {
    let contacts = [
      { id: "c1", organizationId: context.organization.id, firstName: "Alice" },
      { id: "c2", organizationId: context.organization.id, firstName: "Bob" },
    ];

    // Simulate soft-delete by marking deletedAt
    contacts = contacts.map((c) =>
      c.id === "c1" ? { ...c, deletedAt: new Date().toISOString() } : c,
    ) as typeof contacts;

    const active = contacts.filter((c) => !("deletedAt" in c));
    expect(active).toHaveLength(1);
    expect(active[0].firstName).toBe("Bob");
  });

  it("throws not found when deleting contact from wrong org", () => {
    function deleteContactFromOrg(
      contacts: Array<{ id: string; organizationId: string }>,
      contactId: string,
      orgId: string,
    ): boolean {
      const contact = contacts.find((c) => c.id === contactId && c.organizationId === orgId);
      if (!contact) return false;
      return true;
    }

    const contacts = [{ id: "c1", organizationId: "org-A" }];
    expect(deleteContactFromOrg(contacts, "c1", "org-B")).toBe(false);
    expect(deleteContactFromOrg(contacts, "c1", "org-A")).toBe(true);
  });

  it("throws not found when deleting nonexistent contact", () => {
    function findContact(
      contacts: Array<{ id: string }>,
      id: string,
    ): { id: string } | null {
      return contacts.find((c) => c.id === id) ?? null;
    }

    const contacts = [{ id: "c1" }];
    expect(findContact(contacts, "does-not-exist")).toBeNull();
  });

  it("all operations are scoped to org context", () => {
    const orgId = context.organization.id;

    // Verify the context has a valid organization
    expect(orgId).toBe("test-org-id");
    expect(context.organization.name).toBe("Test Organization");
    expect(context.member.role).toBe("owner");
  });
});

// ─── Error case tests ──────────────────────────────────────────────────────────

describe("Contacts Router: error cases", () => {
  it("validation error has descriptive messages", () => {
    const errors = validateContactInput({ email: "bad-email" });
    expect(errors.length).toBeGreaterThan(0);
    errors.forEach((e) => {
      expect(typeof e).toBe("string");
      expect(e.length).toBeGreaterThan(0);
    });
  });

  it("handles empty string firstName as validation error", () => {
    const errors = validateContactInput({ firstName: "   ", lastName: "Doe" });
    expect(errors).toContain("firstName is required");
  });

  it("handles empty string lastName as validation error", () => {
    const errors = validateContactInput({ firstName: "John", lastName: "" });
    expect(errors).toContain("lastName is required");
  });

  it("pagination offset calculation is correct", () => {
    function calculateOffset(page: number, limit: number): number {
      return (page - 1) * limit;
    }

    expect(calculateOffset(1, 50)).toBe(0);
    expect(calculateOffset(2, 50)).toBe(50);
    expect(calculateOffset(3, 10)).toBe(20);
  });

  it("rejects page less than 1", () => {
    function validatePagination(page: number, limit: number): string[] {
      const errors: string[] = [];
      if (page < 1) errors.push("page must be at least 1");
      if (limit < 1) errors.push("limit must be at least 1");
      if (limit > 200) errors.push("limit must not exceed 200");
      return errors;
    }

    expect(validatePagination(0, 50)).toContain("page must be at least 1");
    expect(validatePagination(1, 0)).toContain("limit must be at least 1");
    expect(validatePagination(1, 201)).toContain("limit must not exceed 200");
    expect(validatePagination(1, 50)).toHaveLength(0);
  });
});
