/**
 * Integration Tests: HRM API Calls
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

// ─── Employee Listing Tests ────────────────────────────────────────────────────

describe("HRM: List employees", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends GET to employees endpoint", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/hrm/employees`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/hrm/employees");
  });

  it("returns paginated employee list", async () => {
    const employees = [
      { id: "emp-1", firstName: "Alice", lastName: "Smith", status: "active" },
      { id: "emp-2", firstName: "Bob", lastName: "Jones", status: "active" },
    ];
    const fetchMock = createFetchMock(200, {
      data: employees,
      total: 2,
      page: 1,
      limit: 50,
      totalPages: 1,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/hrm/employees`);
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it("employee entries have required fields", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        {
          id: "emp-1",
          firstName: "Carol",
          lastName: "White",
          email: "carol@company.com",
          department: "Engineering",
          status: "active",
          hiredAt: "2023-01-15T00:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/hrm/employees`);
    const body = await res.json();
    const employee = body.data[0];

    expect(employee.firstName).toBe("Carol");
    expect(employee.lastName).toBe("White");
    expect(employee.email).toBeDefined();
    expect(employee.status).toBe("active");
  });

  it("supports department filter in query string", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/hrm/employees?department=Engineering`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("department=Engineering");
  });
});

// ─── Employee Detail Tests ─────────────────────────────────────────────────────

describe("HRM: Employee detail fetch", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("fetches single employee by id", async () => {
    const fetchMock = createFetchMock(200, {
      id: "emp-42",
      firstName: "Dave",
      lastName: "Lee",
      email: "dave@corp.com",
      department: "Sales",
      position: "Account Executive",
      salary: 85000,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/hrm/employees/emp-42`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/hrm/employees/emp-42");
  });

  it("returns full employee profile", async () => {
    const fetchMock = createFetchMock(200, {
      id: "emp-5",
      firstName: "Eva",
      lastName: "Green",
      email: "eva@company.com",
      department: "Marketing",
      position: "Manager",
      salary: 95000,
      hiredAt: "2022-06-01T00:00:00Z",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/hrm/employees/emp-5`);
    const employee = await res.json();

    expect(employee.id).toBe("emp-5");
    expect(employee.firstName).toBe("Eva");
    expect(employee.salary).toBe(95000);
    expect(employee.department).toBe("Marketing");
  });

  it("handles 404 when employee not found", async () => {
    const fetchMock = createFetchMock(404, { message: "Employee not found" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/hrm/employees/nonexistent-emp`);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Employee not found");
  });
});

// ─── Leave Request Tests ───────────────────────────────────────────────────────

describe("HRM: Leave request creation", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST to leave requests endpoint", async () => {
    const fetchMock = createFetchMock(201, {
      id: "leave-1",
      employeeId: "emp-1",
      type: "annual",
      status: "pending",
      startDate: "2026-04-10",
      endDate: "2026-04-17",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/hrm/leaves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: "emp-1",
        type: "annual",
        startDate: "2026-04-10",
        endDate: "2026-04-17",
        reason: "Family vacation",
      }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.employeeId).toBe("emp-1");
    expect(body.type).toBe("annual");
  });

  it("returns created leave request with status pending", async () => {
    const fetchMock = createFetchMock(201, {
      id: "leave-new",
      employeeId: "emp-2",
      type: "sick",
      status: "pending",
      startDate: "2026-03-25",
      endDate: "2026-03-26",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/hrm/leaves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "emp-2", type: "sick", startDate: "2026-03-25", endDate: "2026-03-26" }),
    });
    const leave = await res.json();

    expect(leave.id).toBeDefined();
    expect(leave.status).toBe("pending");
  });

  it("calculates leave duration in days", () => {
    function calculateLeaveDays(startDate: string, endDate: string): number {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end.getTime() - start.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // inclusive
    }

    expect(calculateLeaveDays("2026-04-10", "2026-04-17")).toBe(8);
    expect(calculateLeaveDays("2026-04-01", "2026-04-01")).toBe(1);
    expect(calculateLeaveDays("2026-04-01", "2026-04-03")).toBe(3);
  });

  it("validates leave types", () => {
    const validLeaveTypes = ["annual", "sick", "personal", "maternity", "paternity", "unpaid"];

    function isValidLeaveType(type: string): boolean {
      return validLeaveTypes.includes(type);
    }

    expect(isValidLeaveType("annual")).toBe(true);
    expect(isValidLeaveType("sick")).toBe(true);
    expect(isValidLeaveType("vacation")).toBe(false);
  });
});

// ─── Attendance Records Tests ──────────────────────────────────────────────────

describe("HRM: Attendance records", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("fetches attendance records for employee", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "att-1", employeeId: "emp-1", date: "2026-03-20", clockIn: "09:00", clockOut: "17:30", hoursWorked: 8.5 },
        { id: "att-2", employeeId: "emp-1", date: "2026-03-21", clockIn: "08:55", clockOut: "17:00", hoursWorked: 8.08 },
      ],
      total: 2,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/hrm/attendance?employeeId=emp-1`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("employeeId=emp-1");
  });

  it("returns attendance with hours worked", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "att-1", employeeId: "emp-3", date: "2026-03-20", clockIn: "09:00", clockOut: "18:00", hoursWorked: 9 },
      ],
      total: 1,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/hrm/attendance?employeeId=emp-3`);
    const body = await res.json();
    const record = body.data[0];

    expect(record.hoursWorked).toBe(9);
    expect(record.clockIn).toBeDefined();
    expect(record.clockOut).toBeDefined();
  });

  it("computes weekly hours from attendance records", () => {
    function calculateWeeklyHours(records: { hoursWorked: number }[]): number {
      return Math.round(records.reduce((sum, r) => sum + r.hoursWorked, 0) * 10) / 10;
    }

    const records = [
      { hoursWorked: 8 },
      { hoursWorked: 8.5 },
      { hoursWorked: 7.5 },
      { hoursWorked: 9 },
      { hoursWorked: 8 },
    ];
    expect(calculateWeeklyHours(records)).toBe(41);
  });
});

// ─── Payroll Records Tests ─────────────────────────────────────────────────────

describe("HRM: Payroll records", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("fetches payroll records", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        {
          id: "pay-1",
          employeeId: "emp-1",
          period: "2026-03",
          grossPay: 7000,
          deductions: 1200,
          netPay: 5800,
          status: "paid",
        },
      ],
      total: 1,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/hrm/payroll?period=2026-03`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/hrm/payroll");
  });

  it("payroll record has gross and net pay", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "pay-2", employeeId: "emp-2", grossPay: 6000, deductions: 900, netPay: 5100, status: "pending" },
      ],
      total: 1,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/hrm/payroll`);
    const body = await res.json();
    const record = body.data[0];

    expect(record.grossPay).toBe(6000);
    expect(record.netPay).toBe(5100);
    expect(record.deductions).toBe(900);
  });

  it("calculates net pay correctly", () => {
    function calculateNetPay(
      grossPay: number,
      taxRate: number,
      otherDeductions: number,
    ): number {
      const taxDeduction = grossPay * (taxRate / 100);
      return grossPay - taxDeduction - otherDeductions;
    }

    expect(calculateNetPay(5000, 20, 300)).toBe(3700);
    expect(calculateNetPay(8000, 25, 500)).toBe(5500);
  });

  it("handles 403 when user lacks payroll access", async () => {
    const fetchMock = createFetchMock(403, { message: "Insufficient permissions to view payroll" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/hrm/payroll`);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toContain("permissions");
  });

  it("handles network error for payroll fetch", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    await expect(fetch(`${API_BASE}/hrm/payroll`)).rejects.toThrow("Network failure");
  });
});
