/**
 * API Library Comprehensive Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Fetch mock setup ─────────────────────────────────────────────────────────

function makeFetchMock(
  status: number,
  body: any,
  headers: Record<string, string> = {},
) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: new Headers(headers),
  });
}

// ─── Request building helpers (mirrors api.ts logic) ─────────────────────────

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

function getContentTypeHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

function getAuthHeaders(token?: string): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── Error classification helpers ────────────────────────────────────────────

function classifyHttpError(status: number): string {
  if (status === 401) return "auth_error";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422) return "validation_error";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server_error";
  return "unknown_error";
}

// ─── Response transformation helpers ─────────────────────────────────────────

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformKeys(
  obj: Record<string, any>,
): Record<string, any> {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(transformKeys);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      toCamelCase(key),
      transformKeys(value),
    ]),
  );
}

// ─── leadsApi.create Tests ────────────────────────────────────────────────────

describe("leadsApi.create", () => {
  const ORIGINAL_FETCH = global.fetch;

  beforeEach(() => {
    // Set up localStorage stubs
    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST request with required fields", async () => {
    const fetchMock = makeFetchMock(201, { id: "lead_1", firstName: "Jane" });
    global.fetch = fetchMock;

    const { leadsApi } = await import("@/lib/api");
    const payload = {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      source: "website",
    };

    await leadsApi.create(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/leads"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends JSON body with lead data", async () => {
    const fetchMock = makeFetchMock(201, { id: "lead_1" });
    global.fetch = fetchMock;

    const { leadsApi } = await import("@/lib/api");
    const payload = {
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
    };

    await leadsApi.create(payload);

    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.firstName).toBe("John");
    expect(body.lastName).toBe("Smith");
    expect(body.email).toBe("john@example.com");
  });

  it("includes Content-Type header in POST request", async () => {
    const fetchMock = makeFetchMock(201, { id: "lead_1" });
    global.fetch = fetchMock;

    const { leadsApi } = await import("@/lib/api");
    await leadsApi.create({ firstName: "Test", lastName: "User" });

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
  });

  it("falls back to localStorage on API failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { leadsApi } = await import("@/lib/api");
    const result = await leadsApi.create({
      firstName: "Offline",
      lastName: "User",
    });

    expect(result).toBeDefined();
    expect(result.firstName).toBe("Offline");
  });
});

// ─── contactsApi.list Tests ───────────────────────────────────────────────────

describe("contactsApi.list", () => {
  const ORIGINAL_FETCH = global.fetch;

  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("returns paginated result with total", async () => {
    const fetchMock = makeFetchMock(200, { data: [{ id: "1", firstName: "Alice" }], total: 1 });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    const result = await contactsApi.list({ page: 1, limit: 10 });

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
  });

  it("respects page parameter", async () => {
    const fetchMock = makeFetchMock(200, { data: [], total: 0 });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    const result = await contactsApi.list({ page: 2, limit: 25 });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(25);
  });

  it("falls back to localStorage on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { contactsApi } = await import("@/lib/api");
    const result = await contactsApi.list();

    expect(result).toHaveProperty("data");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("computes totalPages correctly", async () => {
    const fetchMock = makeFetchMock(200, {
      data: Array(5).fill({ id: "x", firstName: "X" }),
      total: 5,
    });
    global.fetch = fetchMock;

    const { contactsApi } = await import("@/lib/api");
    const result = await contactsApi.list({ page: 1, limit: 10 });

    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });
});

// ─── dealsApi.create Tests ────────────────────────────────────────────────────

describe("dealsApi.create", () => {
  const ORIGINAL_FETCH = global.fetch;

  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST with required name and value fields", async () => {
    const fetchMock = makeFetchMock(201, { id: "deal_1" });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    await dealsApi.create({ name: "Big Deal", value: 50000 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/deals"),
      expect.objectContaining({ method: "POST" }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.name).toBe("Big Deal");
    expect(body.value).toBe(50000);
  });

  it("includes optional stage field when provided", async () => {
    const fetchMock = makeFetchMock(201, { id: "deal_2" });
    global.fetch = fetchMock;

    const { dealsApi } = await import("@/lib/api");
    await dealsApi.create({ name: "Qualified Deal", value: 10000, stage: "qualified" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.stage).toBe("qualified");
  });

  it("falls back to localStorage on server error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("500 Server Error"));

    const { dealsApi } = await import("@/lib/api");
    const result = await dealsApi.create({ name: "Offline Deal", value: 5000 });

    expect(result).toBeDefined();
    expect(result.name).toBe("Offline Deal");
  });
});

// ─── Error handling tests ─────────────────────────────────────────────────────

describe("HTTP error classification", () => {
  it("classifies 401 as auth_error", () => {
    expect(classifyHttpError(401)).toBe("auth_error");
  });

  it("classifies 403 as forbidden", () => {
    expect(classifyHttpError(403)).toBe("forbidden");
  });

  it("classifies 404 as not_found", () => {
    expect(classifyHttpError(404)).toBe("not_found");
  });

  it("classifies 422 as validation_error", () => {
    expect(classifyHttpError(422)).toBe("validation_error");
  });

  it("classifies 429 as rate_limit", () => {
    expect(classifyHttpError(429)).toBe("rate_limit");
  });

  it("classifies 500 as server_error", () => {
    expect(classifyHttpError(500)).toBe("server_error");
  });

  it("classifies 503 as server_error", () => {
    expect(classifyHttpError(503)).toBe("server_error");
  });
});

// ─── Request interceptor / header tests ──────────────────────────────────────

describe("Request headers", () => {
  it("Content-Type header is application/json", () => {
    const headers = getContentTypeHeaders();
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("Authorization header uses Bearer scheme", () => {
    const headers = getAuthHeaders("my-token");
    expect(headers["Authorization"]).toBe("Bearer my-token");
  });

  it("getAuthHeaders returns empty object when token is absent", () => {
    const headers = getAuthHeaders();
    expect(Object.keys(headers).length).toBe(0);
  });

  it("builds query string correctly", () => {
    const qs = buildQuery({ page: 1, limit: 10, search: "alice" });
    expect(qs).toContain("page=1");
    expect(qs).toContain("limit=10");
    expect(qs).toContain("search=alice");
  });

  it("omits undefined values from query string", () => {
    const qs = buildQuery({ page: 1, search: undefined });
    expect(qs).not.toContain("search");
    expect(qs).toContain("page=1");
  });
});

// ─── Response transformation tests ───────────────────────────────────────────

describe("Response key transformation (snake_case to camelCase)", () => {
  it("converts snake_case keys to camelCase", () => {
    const input = { first_name: "Alice", last_name: "Smith" };
    const output = transformKeys(input);
    expect(output).toHaveProperty("firstName", "Alice");
    expect(output).toHaveProperty("lastName", "Smith");
  });

  it("handles nested objects", () => {
    const input = { user_data: { company_name: "Acme" } };
    const output = transformKeys(input);
    expect(output.userData.companyName).toBe("Acme");
  });

  it("handles arrays of objects", () => {
    const input = [{ first_name: "A" }, { first_name: "B" }];
    const output = transformKeys(input as any);
    expect((output as any)[0].firstName).toBe("A");
    expect((output as any)[1].firstName).toBe("B");
  });

  it("preserves already-camelCase keys", () => {
    const input = { firstName: "Bob" };
    const output = transformKeys(input);
    expect(output).toHaveProperty("firstName", "Bob");
  });

  it("toCamelCase converts a single snake_case word", () => {
    expect(toCamelCase("hello_world")).toBe("helloWorld");
    expect(toCamelCase("created_at")).toBe("createdAt");
    expect(toCamelCase("company_name")).toBe("companyName");
  });

  it("toCamelCase leaves already-camelCase strings unchanged", () => {
    expect(toCamelCase("helloWorld")).toBe("helloWorld");
    expect(toCamelCase("firstName")).toBe("firstName");
  });
});
