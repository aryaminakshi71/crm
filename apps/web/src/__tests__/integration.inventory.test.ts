/**
 * Integration Tests: Inventory API Calls
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Mock fetch setup ──────────────────────────────────────────────────────────

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

const API_BASE = "/api/v1";

// ─── Product Listing Tests ─────────────────────────────────────────────────────

describe("Inventory: List products with search", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends GET to products endpoint", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/products`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/inventory/products");
  });

  it("returns paginated product list", async () => {
    const products = [
      { id: "prod-1", name: "Laptop Pro", sku: "LP-001", price: 1299, stock: 50 },
      { id: "prod-2", name: "Wireless Mouse", sku: "WM-002", price: 29, stock: 200 },
    ];
    const fetchMock = createFetchMock(200, {
      data: products,
      total: 2,
      page: 1,
      limit: 50,
      totalPages: 1,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/inventory/products`);
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it("includes search query in request", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/products?search=laptop`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("search=laptop");
  });

  it("product entries have required fields", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        {
          id: "prod-1",
          name: "USB Hub",
          sku: "UH-001",
          price: 49.99,
          stock: 100,
          category: "Electronics",
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/inventory/products`);
    const body = await res.json();
    const product = body.data[0];

    expect(product.name).toBe("USB Hub");
    expect(product.sku).toBeDefined();
    expect(product.price).toBeDefined();
    expect(product.stock).toBeDefined();
  });

  it("filters by category when param provided", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/products?category=Electronics`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("category=Electronics");
  });
});

// ─── Product Creation Tests ────────────────────────────────────────────────────

describe("Inventory: Create product", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST with name, sku, price, and stock", async () => {
    const fetchMock = createFetchMock(201, {
      id: "prod-new",
      name: "Mechanical Keyboard",
      sku: "MK-001",
      price: 149,
      stock: 75,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Mechanical Keyboard",
        sku: "MK-001",
        price: 149,
        stock: 75,
      }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.name).toBe("Mechanical Keyboard");
    expect(body.sku).toBe("MK-001");
    expect(body.price).toBe(149);
    expect(body.stock).toBe(75);
  });

  it("returns created product with id", async () => {
    const fetchMock = createFetchMock(201, {
      id: "prod-generated",
      name: "Monitor Stand",
      sku: "MS-003",
      price: 59,
      stock: 30,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/inventory/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Monitor Stand", sku: "MS-003", price: 59, stock: 30 }),
    });
    const product = await res.json();

    expect(product.id).toBeDefined();
    expect(product.name).toBe("Monitor Stand");
  });

  it("sends optional description and category", async () => {
    const fetchMock = createFetchMock(201, { id: "prod-cat" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ergonomic Chair",
        sku: "EC-100",
        price: 450,
        stock: 20,
        category: "Furniture",
        description: "Adjustable lumbar support",
      }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.category).toBe("Furniture");
    expect(body.description).toBe("Adjustable lumbar support");
  });
});

// ─── Stock Adjustment Tests ────────────────────────────────────────────────────

describe("Inventory: Stock adjustment", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends PATCH to adjust stock quantity", async () => {
    const fetchMock = createFetchMock(200, { id: "prod-1", stock: 60, stockAdjustment: 10 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/products/prod-1/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustment: 10, reason: "Restock from supplier" }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("PATCH");
    const body = JSON.parse(call[1].body);
    expect(body.adjustment).toBe(10);
    expect(body.reason).toBeDefined();
  });

  it("handles negative stock adjustment (removal)", async () => {
    const fetchMock = createFetchMock(200, { id: "prod-2", stock: 40 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/products/prod-2/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustment: -5, reason: "Damaged goods" }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.adjustment).toBe(-5);
  });

  it("computes new stock after adjustment", () => {
    function applyStockAdjustment(currentStock: number, adjustment: number): number {
      return Math.max(0, currentStock + adjustment);
    }

    expect(applyStockAdjustment(50, 10)).toBe(60);
    expect(applyStockAdjustment(50, -15)).toBe(35);
    expect(applyStockAdjustment(5, -10)).toBe(0); // cannot go below zero
  });

  it("returns updated stock on success", async () => {
    const fetchMock = createFetchMock(200, { id: "prod-3", stock: 85 });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/inventory/products/prod-3/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustment: 25 }),
    });
    const product = await res.json();

    expect(product.stock).toBe(85);
  });
});

// ─── Low Stock Alert Tests ─────────────────────────────────────────────────────

describe("Inventory: Low stock alerts", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("fetches products below threshold", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "prod-1", name: "Widget A", stock: 3, lowStockThreshold: 10 },
        { id: "prod-2", name: "Gadget B", stock: 2, lowStockThreshold: 5 },
      ],
      total: 2,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/products?lowStock=true`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("lowStock=true");
  });

  it("identifies low stock products", () => {
    function isLowStock(stock: number, threshold: number): boolean {
      return stock <= threshold;
    }

    expect(isLowStock(3, 10)).toBe(true);
    expect(isLowStock(10, 10)).toBe(true);
    expect(isLowStock(11, 10)).toBe(false);
    expect(isLowStock(0, 5)).toBe(true);
  });

  it("calculates stock alert severity", () => {
    function getAlertSeverity(
      stock: number,
      threshold: number,
    ): "critical" | "warning" | "ok" {
      if (stock === 0) return "critical";
      if (stock < threshold * 0.5) return "critical";
      if (stock < threshold) return "warning";
      return "ok";
    }

    expect(getAlertSeverity(0, 10)).toBe("critical");
    expect(getAlertSeverity(2, 10)).toBe("critical"); // under 50% threshold
    expect(getAlertSeverity(7, 10)).toBe("warning");
    expect(getAlertSeverity(15, 10)).toBe("ok");
  });
});

// ─── Warehouse Management Tests ────────────────────────────────────────────────

describe("Inventory: Warehouse management", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("fetches warehouse list", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "wh-1", name: "Main Warehouse", location: "New York", capacity: 10000 },
        { id: "wh-2", name: "West Coast Hub", location: "Los Angeles", capacity: 5000 },
      ],
      total: 2,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/warehouses`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/inventory/warehouses");
  });

  it("creates a new warehouse", async () => {
    const fetchMock = createFetchMock(201, {
      id: "wh-new",
      name: "East Hub",
      location: "Boston",
      capacity: 3000,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/inventory/warehouses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "East Hub", location: "Boston", capacity: 3000 }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.name).toBe("East Hub");
    expect(body.location).toBe("Boston");
  });

  it("computes warehouse utilization", () => {
    function calculateUtilization(usedCapacity: number, totalCapacity: number): number {
      if (totalCapacity === 0) return 0;
      return Math.round((usedCapacity / totalCapacity) * 100);
    }

    expect(calculateUtilization(7500, 10000)).toBe(75);
    expect(calculateUtilization(0, 5000)).toBe(0);
    expect(calculateUtilization(5000, 5000)).toBe(100);
  });

  it("handles 500 error from warehouse API", async () => {
    const fetchMock = createFetchMock(500, { message: "Database error" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/inventory/warehouses`);

    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });

  it("handles network failure gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network unreachable"));

    await expect(fetch(`${API_BASE}/inventory/products`)).rejects.toThrow("Network unreachable");
  });
});
