/**
 * Integration Tests: CRM API Calls
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Mock fetch setup ─────────────────────────────────────────────────────────

function createFetchMock(status: number, responseBody: any) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => responseBody,
    text: async () => JSON.stringify(responseBody),
  });
}

const ORIGINAL_FETCH = global.fetch;

function mockLocalStorage() {
  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
}

// ─── Create Contact Tests ─────────────────────────────────────────────────────

describe("CRM: Create contact", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends firstName field in POST body", async () => {
    const fetchMock = createFetchMock(201, { id: "c1", firstName: "Alice" });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    await contactsApi.create({
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@corp.com",
      companyName: "Corp Inc",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.firstName).toBe("Alice");
  });

  it("sends lastName field in POST body", async () => {
    const fetchMock = createFetchMock(201, { id: "c1" });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    await contactsApi.create({ firstName: "Bob", lastName: "Jones" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.lastName).toBe("Jones");
  });

  it("sends email field when provided", async () => {
    const fetchMock = createFetchMock(201, { id: "c2" });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    await contactsApi.create({
      firstName: "Carol",
      lastName: "White",
      email: "carol@example.com",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.email).toBe("carol@example.com");
  });

  it("sends companyName field when provided", async () => {
    const fetchMock = createFetchMock(201, { id: "c3" });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    await contactsApi.create({
      firstName: "Dave",
      lastName: "Lee",
      companyName: "StartupCo",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.companyName).toBe("StartupCo");
  });

  it("uses POST method", async () => {
    const fetchMock = createFetchMock(201, { id: "c4" });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    await contactsApi.create({ firstName: "Eve", lastName: "Brown" });

    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("falls back to local storage when API fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { contactsApi } = await import("@/lib/api");
    const result = await contactsApi.create({
      firstName: "Frank",
      lastName: "Black",
    });
    expect(result).toBeDefined();
    expect(result.firstName).toBe("Frank");
    expect(result.id).toBeDefined(); // local ID generated
  });
});

// ─── Create Lead Tests ────────────────────────────────────────────────────────

describe("CRM: Create lead", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends all required fields in POST body", async () => {
    const fetchMock = createFetchMock(201, { id: "l1" });
    global.fetch = fetchMock;

    const { leadsApi } = await import("@/lib/api");
    await leadsApi.create({
      firstName: "Gina",
      lastName: "Red",
      email: "gina@leads.com",
      source: "website",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.firstName).toBe("Gina");
    expect(body.lastName).toBe("Red");
    expect(body.email).toBe("gina@leads.com");
    expect(body.source).toBe("website");
  });

  it("sends source field", async () => {
    const fetchMock = createFetchMock(201, { id: "l2" });
    global.fetch = fetchMock;

    const { leadsApi } = await import("@/lib/api");
    await leadsApi.create({
      firstName: "Henry",
      lastName: "Blue",
      source: "referral",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.source).toBe("referral");
  });

  it("targets the /leads endpoint", async () => {
    const fetchMock = createFetchMock(201, { id: "l3" });
    global.fetch = fetchMock;

    const { leadsApi } = await import("@/lib/api");
    await leadsApi.create({ firstName: "Ivan", lastName: "Green" });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/leads");
  });

  it("falls back to localStorage on API failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Server error"));

    const { leadsApi } = await import("@/lib/api");
    const result = await leadsApi.create({ firstName: "Julia", lastName: "Gold" });

    expect(result).toBeDefined();
    expect(result.firstName).toBe("Julia");
  });
});

// ─── Create Deal Tests ────────────────────────────────────────────────────────

describe("CRM: Create deal", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends name field in POST body", async () => {
    const fetchMock = createFetchMock(201, { id: "d1" });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    await dealsApi.create({ name: "Enterprise License", value: 50000 });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.name).toBe("Enterprise License");
  });

  it("sends value field in POST body", async () => {
    const fetchMock = createFetchMock(201, { id: "d2" });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    await dealsApi.create({ name: "Starter Deal", value: 5000 });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.value).toBe(5000);
  });

  it("sends stage field when provided", async () => {
    const fetchMock = createFetchMock(201, { id: "d3" });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    await dealsApi.create({ name: "Mid Deal", value: 20000, stage: "qualified" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.stage).toBe("qualified");
  });

  it("targets /deals endpoint", async () => {
    const fetchMock = createFetchMock(201, { id: "d4" });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    await dealsApi.create({ name: "Test Deal", value: 1000 });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/deals");
  });
});

// ─── Update Contact Tests ─────────────────────────────────────────────────────

describe("CRM: Update contact (PATCH)", () => {
  beforeEach(() => {
    mockLocalStorage();
    (localStorage.getItem as any).mockReturnValue(
      JSON.stringify([
        { id: "contact-1", firstName: "Alice", lastName: "Smith", email: "alice@old.com" },
      ]),
    );
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends PATCH method for update", async () => {
    const fetchMock = createFetchMock(200, { id: "contact-1", firstName: "Alice" });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    await contactsApi.update("contact-1", { email: "alice@new.com" });

    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
  });

  it("sends only changed fields in PATCH body", async () => {
    const fetchMock = createFetchMock(200, { id: "contact-1" });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    await contactsApi.update("contact-1", { email: "new@example.com" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.email).toBe("new@example.com");
  });

  it("targets the correct contact endpoint", async () => {
    const fetchMock = createFetchMock(200, { id: "contact-1" });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    await contactsApi.update("contact-1", { firstName: "Alicia" });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/contacts/contact-1");
  });

  it("falls back to updating localStorage on API failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { contactsApi } = await import("@/lib/api");
    const result = await contactsApi.update("contact-1", { firstName: "Alicia" });

    expect(result).toBeDefined();
    expect(result.firstName).toBe("Alicia");
  });
});

// ─── Delete Lead Tests ────────────────────────────────────────────────────────

describe("CRM: Delete lead", () => {
  beforeEach(() => {
    mockLocalStorage();
    (localStorage.getItem as any).mockReturnValue(
      JSON.stringify([{ id: "lead-1", firstName: "OldLead" }]),
    );
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends DELETE request to API", async () => {
    const fetchMock = createFetchMock(204, null);
    global.fetch = fetchMock;

    const { leadsApi } = await import("@/lib/api");
    await leadsApi.delete("lead-1");

    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("targets correct lead endpoint", async () => {
    const fetchMock = createFetchMock(204, null);
    global.fetch = fetchMock;

    const { leadsApi } = await import("@/lib/api");
    await leadsApi.delete("lead-1");

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/leads/lead-1");
  });

  it("falls back to removing from localStorage on API failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { leadsApi } = await import("@/lib/api");
    // Should not throw
    await expect(leadsApi.delete("lead-1")).resolves.not.toThrow();
  });
});

// ─── Deal list filtering tests ────────────────────────────────────────────────

describe("CRM: Deal list with filters", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("includes stage filter in query string", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0 });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    await dealsApi.list({ stage: "qualified" });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("stage=qualified");
  });

  it("includes search filter in query string", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0 });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    await dealsApi.list({ search: "enterprise" });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("search=enterprise");
  });

  it("returns correct pagination metadata", async () => {
    const fetchMock = createFetchMock(200, {
      data: [{ id: "d1", name: "Test" }],
      total: 1,
    });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    const result = await dealsApi.list({ page: 1, limit: 10 });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result).toHaveProperty("totalPages");
  });
});
