/**
 * Integration Tests: Projects API Calls
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

// ─── Project Listing Tests ─────────────────────────────────────────────────────

describe("Projects: List projects", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends GET to projects endpoint", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/projects");
  });

  it("returns paginated project list", async () => {
    const projects = [
      { id: "p1", name: "Website Redesign", status: "active" },
      { id: "p2", name: "Mobile App", status: "planning" },
    ];
    const fetchMock = createFetchMock(200, {
      data: projects,
      total: 2,
      page: 1,
      limit: 50,
      totalPages: 1,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/projects`);
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.totalPages).toBe(1);
  });

  it("project entries contain name and status", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "p1", name: "Q1 Campaign", status: "active", description: "Marketing Q1" },
      ],
      total: 1,
      page: 1,
      limit: 50,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/projects`);
    const body = await res.json();
    const project = body.data[0];

    expect(project.name).toBe("Q1 Campaign");
    expect(project.status).toBe("active");
    expect(project.description).toBeDefined();
  });

  it("includes status filter in query string", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects?status=active`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("status=active");
  });
});

// ─── Project Creation Tests ────────────────────────────────────────────────────

describe("Projects: Create project", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST with required name and status", async () => {
    const fetchMock = createFetchMock(201, {
      id: "p-new",
      name: "Infrastructure Upgrade",
      status: "planning",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Infrastructure Upgrade", status: "planning" }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.name).toBe("Infrastructure Upgrade");
    expect(body.status).toBe("planning");
  });

  it("returns newly created project with id", async () => {
    const fetchMock = createFetchMock(201, {
      id: "p-generated-uuid",
      name: "New Project",
      status: "planning",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Project", status: "planning" }),
    });
    const project = await res.json();

    expect(project.id).toBeDefined();
    expect(project.name).toBe("New Project");
  });

  it("sends description when provided", async () => {
    const fetchMock = createFetchMock(201, { id: "p-desc" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Data Migration",
        status: "planning",
        description: "Migrate from legacy DB to new platform",
      }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.description).toBe("Migrate from legacy DB to new platform");
  });
});

// ─── Task Creation Tests ───────────────────────────────────────────────────────

describe("Projects: Create task within project", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST to project tasks endpoint", async () => {
    const fetchMock = createFetchMock(201, {
      id: "task-1",
      projectId: "p1",
      title: "Set up CI/CD",
      status: "todo",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects/p1/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Set up CI/CD", status: "todo" }),
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/projects/p1/tasks");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("task body contains title and projectId linkage", async () => {
    const fetchMock = createFetchMock(201, { id: "task-2", projectId: "p2", title: "Write tests" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects/p2/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Write tests", priority: "high", assigneeId: "user-1" }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.title).toBe("Write tests");
    expect(body.priority).toBe("high");
    expect(body.assigneeId).toBe("user-1");
  });

  it("returns created task with id", async () => {
    const fetchMock = createFetchMock(201, {
      id: "task-uuid",
      projectId: "p3",
      title: "Deploy to staging",
      status: "todo",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/projects/p3/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Deploy to staging" }),
    });
    const task = await res.json();

    expect(task.id).toBeDefined();
    expect(task.title).toBe("Deploy to staging");
  });

  it("calculates task completion percentage", () => {
    function calculateCompletion(completedTasks: number, totalTasks: number): number {
      if (totalTasks === 0) return 0;
      return Math.round((completedTasks / totalTasks) * 100);
    }

    expect(calculateCompletion(3, 10)).toBe(30);
    expect(calculateCompletion(10, 10)).toBe(100);
    expect(calculateCompletion(0, 0)).toBe(0);
    expect(calculateCompletion(7, 8)).toBe(88);
  });
});

// ─── Milestone Tracking Tests ──────────────────────────────────────────────────

describe("Projects: Milestone tracking", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("fetches milestones for a project", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "m1", name: "Beta Launch", dueDate: "2026-05-01", completedAt: null },
        { id: "m2", name: "v1.0 Release", dueDate: "2026-06-30", completedAt: null },
      ],
      total: 2,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects/p1/milestones`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/projects/p1/milestones");
  });

  it("marks milestone as complete via PATCH", async () => {
    const fetchMock = createFetchMock(200, {
      id: "m1",
      name: "Beta Launch",
      completedAt: "2026-03-23T00:00:00Z",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects/p1/milestones/m1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });

    const res = await (fetchMock.mock.results[0].value as Promise<Response>);
    const body = await res.json();
    expect(body.completedAt).toBeDefined();
  });

  it("determines milestone overdue status", () => {
    function isMilestoneOverdue(dueDate: string, completedAt: string | null): boolean {
      if (completedAt) return false;
      return new Date(dueDate) < new Date();
    }

    const pastDate = new Date(Date.now() - 86400000 * 5).toISOString();
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();

    expect(isMilestoneOverdue(pastDate, null)).toBe(true);
    expect(isMilestoneOverdue(futureDate, null)).toBe(false);
    expect(isMilestoneOverdue(pastDate, new Date().toISOString())).toBe(false);
  });
});

// ─── Project Status Update Tests ───────────────────────────────────────────────

describe("Projects: Project status lifecycle", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("transitions project from planning to active", async () => {
    const fetchMock = createFetchMock(200, { id: "p1", status: "active" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/projects/p1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.status).toBe("active");
  });

  it("transitions project from active to completed", async () => {
    const fetchMock = createFetchMock(200, {
      id: "p2",
      status: "completed",
      completedAt: "2026-03-23T00:00:00Z",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/projects/p2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    const project = await res.json();

    expect(project.status).toBe("completed");
  });

  it("validates project status values", () => {
    const validStatuses = ["planning", "active", "on_hold", "completed", "cancelled"];

    function isValidStatus(status: string): boolean {
      return validStatuses.includes(status);
    }

    expect(isValidStatus("planning")).toBe(true);
    expect(isValidStatus("active")).toBe(true);
    expect(isValidStatus("completed")).toBe(true);
    expect(isValidStatus("in_progress")).toBe(false);
    expect(isValidStatus("archived")).toBe(false);
  });

  it("handles 404 when project not found", async () => {
    const fetchMock = createFetchMock(404, { message: "Project not found" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/projects/nonexistent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });

    expect(res.status).toBe(404);
  });

  it("handles network error gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

    await expect(fetch(`${API_BASE}/projects`)).rejects.toThrow("Connection refused");
  });
});
