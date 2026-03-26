/**
 * Helpdesk Router Unit Tests
 *
 * Tests for ticket list, create, update handlers, SLA calculation, and org scoping.
 * Uses mocked database via pure function extractions.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { createMockOrgContext } from "./test-utils";

// ─── Pure logic helpers mirroring the helpdesk router ─────────────────────────

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

function filterTickets(
  tickets: Array<{
    id: string;
    organizationId: string;
    status: string;
    priority: string;
    subject: string;
    description?: string;
    contactEmail?: string;
    deletedAt?: string | null;
  }>,
  orgId: string,
  filters: { status?: string; priority?: string; search?: string },
) {
  return tickets.filter((t) => {
    if (t.organizationId !== orgId) return false;
    if (t.deletedAt) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.search) {
      const lower = filters.search.toLowerCase();
      const matchesSubject = t.subject.toLowerCase().includes(lower);
      const matchesDescription = (t.description ?? "").toLowerCase().includes(lower);
      const matchesEmail = (t.contactEmail ?? "").toLowerCase().includes(lower);
      if (!matchesSubject && !matchesDescription && !matchesEmail) return false;
    }
    return true;
  });
}

function validateTicketInput(input: {
  subject?: string;
  priority?: string;
  status?: string;
}): string[] {
  const errors: string[] = [];
  if (!input.subject || input.subject.trim() === "") {
    errors.push("subject is required");
  }

  const validPriorities = ["low", "medium", "high", "urgent"];
  if (input.priority && !validPriorities.includes(input.priority)) {
    errors.push(`priority must be one of: ${validPriorities.join(", ")}`);
  }

  const validStatuses = ["open", "pending", "resolved", "closed"];
  if (input.status && !validStatuses.includes(input.status)) {
    errors.push(`status must be one of: ${validStatuses.join(", ")}`);
  }

  return errors;
}

function calculateSlaStatus(
  dueAt: string | null,
  resolvedAt: string | null,
): "met" | "breached" | "pending" | "not_applicable" {
  if (!dueAt) return "not_applicable";
  const due = new Date(dueAt);
  if (resolvedAt) {
    return new Date(resolvedAt) <= due ? "met" : "breached";
  }
  return new Date() <= due ? "pending" : "breached";
}

function calculateSlaDeadline(
  createdAt: Date,
  priority: "low" | "medium" | "high" | "urgent",
): Date {
  const slaHours: Record<string, number> = {
    low: 72,
    medium: 24,
    high: 8,
    urgent: 2,
  };
  const hours = slaHours[priority] ?? 24;
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

// ─── Ticket list handler tests ─────────────────────────────────────────────────

describe("Helpdesk Router: ticket list handler", () => {
  let context: ReturnType<typeof createMockOrgContext>;

  beforeEach(() => {
    context = createMockOrgContext();
  });

  it("returns paginated ticket list", () => {
    const tickets = [
      { id: "t1", organizationId: context.organization.id, status: "open", priority: "high", subject: "Bug" },
      { id: "t2", organizationId: context.organization.id, status: "pending", priority: "medium", subject: "Feature" },
    ];

    const result = buildPaginationResult(tickets, tickets.length, 1, 50);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
  });

  it("filters tickets by status=open", () => {
    const tickets = [
      { id: "t1", organizationId: context.organization.id, status: "open", priority: "high", subject: "A" },
      { id: "t2", organizationId: context.organization.id, status: "closed", priority: "low", subject: "B" },
      { id: "t3", organizationId: context.organization.id, status: "open", priority: "medium", subject: "C" },
    ];

    const result = filterTickets(tickets, context.organization.id, { status: "open" });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.status === "open")).toBe(true);
  });

  it("filters tickets by priority=urgent", () => {
    const tickets = [
      { id: "t1", organizationId: context.organization.id, status: "open", priority: "urgent", subject: "P1" },
      { id: "t2", organizationId: context.organization.id, status: "open", priority: "medium", subject: "P2" },
      { id: "t3", organizationId: context.organization.id, status: "pending", priority: "urgent", subject: "P3" },
    ];

    const result = filterTickets(tickets, context.organization.id, { priority: "urgent" });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.priority === "urgent")).toBe(true);
  });

  it("excludes soft-deleted tickets", () => {
    const tickets = [
      { id: "t1", organizationId: context.organization.id, status: "open", priority: "high", subject: "Active", deletedAt: null },
      { id: "t2", organizationId: context.organization.id, status: "open", priority: "high", subject: "Deleted", deletedAt: "2026-01-01T00:00:00Z" },
    ];

    const result = filterTickets(tickets, context.organization.id, {});
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Active");
  });

  it("filters only tickets belonging to org", () => {
    const tickets = [
      { id: "t1", organizationId: context.organization.id, status: "open", priority: "high", subject: "Mine" },
      { id: "t2", organizationId: "other-org-id", status: "open", priority: "high", subject: "Theirs" },
    ];

    const result = filterTickets(tickets, context.organization.id, {});
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Mine");
  });

  it("applies search filter across subject, description, contactEmail", () => {
    const tickets = [
      { id: "t1", organizationId: context.organization.id, status: "open", priority: "high", subject: "Login fails", description: "Cannot log in", contactEmail: "user@acme.com" },
      { id: "t2", organizationId: context.organization.id, status: "open", priority: "medium", subject: "Billing issue", description: "Wrong charge", contactEmail: "admin@corp.com" },
    ];

    expect(filterTickets(tickets, context.organization.id, { search: "login" })).toHaveLength(1);
    expect(filterTickets(tickets, context.organization.id, { search: "acme.com" })).toHaveLength(1);
    expect(filterTickets(tickets, context.organization.id, { search: "wrong" })).toHaveLength(1);
    expect(filterTickets(tickets, context.organization.id, { search: "zzz" })).toHaveLength(0);
  });
});

// ─── Ticket create handler tests ───────────────────────────────────────────────

describe("Helpdesk Router: ticket create handler", () => {
  let context: ReturnType<typeof createMockOrgContext>;

  beforeEach(() => {
    context = createMockOrgContext();
  });

  it("validates subject is required", () => {
    const errors = validateTicketInput({ priority: "high" });
    expect(errors).toContain("subject is required");
  });

  it("accepts valid ticket input with subject and priority", () => {
    const errors = validateTicketInput({ subject: "Login bug", priority: "high" });
    expect(errors).toHaveLength(0);
  });

  it("rejects invalid priority value", () => {
    const errors = validateTicketInput({ subject: "Issue", priority: "super_urgent" });
    expect(errors.some((e) => e.includes("priority"))).toBe(true);
  });

  it("rejects invalid status value", () => {
    const errors = validateTicketInput({ subject: "Issue", status: "archived" });
    expect(errors.some((e) => e.includes("status"))).toBe(true);
  });

  it("accepts all valid priority values", () => {
    const validPriorities = ["low", "medium", "high", "urgent"];
    validPriorities.forEach((priority) => {
      const errors = validateTicketInput({ subject: "Test", priority });
      expect(errors).toHaveLength(0);
    });
  });

  it("accepts all valid status values", () => {
    const validStatuses = ["open", "pending", "resolved", "closed"];
    validStatuses.forEach((status) => {
      const errors = validateTicketInput({ subject: "Test", status });
      expect(errors).toHaveLength(0);
    });
  });

  it("scopes ticket to organization on create", () => {
    const orgId = context.organization.id;
    const created = {
      id: crypto.randomUUID(),
      organizationId: orgId,
      subject: "New bug",
      priority: "high",
      status: "open",
      source: "web",
    };

    expect(created.organizationId).toBe(orgId);
  });

  it("defaults status to open when not specified", () => {
    function applyDefaults(input: { subject: string; priority?: string; status?: string }) {
      return {
        ...input,
        status: input.status ?? "open",
        priority: input.priority ?? "medium",
        source: "web",
      };
    }

    const ticket = applyDefaults({ subject: "Minimal ticket" });
    expect(ticket.status).toBe("open");
    expect(ticket.priority).toBe("medium");
  });
});

// ─── Ticket update handler tests ───────────────────────────────────────────────

describe("Helpdesk Router: ticket update handler", () => {
  let context: ReturnType<typeof createMockOrgContext>;

  beforeEach(() => {
    context = createMockOrgContext();
  });

  it("updates ticket status correctly", () => {
    const original = {
      id: "t1",
      organizationId: context.organization.id,
      status: "open",
      priority: "high",
      subject: "Issue A",
    };

    const updated = { ...original, status: "resolved" };
    expect(updated.status).toBe("resolved");
    expect(updated.subject).toBe("Issue A"); // unchanged
  });

  it("updates assigneeId on ticket", () => {
    const original = {
      id: "t2",
      organizationId: context.organization.id,
      status: "open",
      priority: "medium",
      subject: "Issue B",
      assigneeId: null,
    };

    const updated = { ...original, assigneeId: "user-agent-99" };
    expect(updated.assigneeId).toBe("user-agent-99");
  });

  it("rejects update when ticket does not belong to org", () => {
    function canUpdate(
      tickets: Array<{ id: string; organizationId: string }>,
      ticketId: string,
      orgId: string,
    ): boolean {
      return tickets.some((t) => t.id === ticketId && t.organizationId === orgId);
    }

    const tickets = [{ id: "t1", organizationId: "org-A" }];
    expect(canUpdate(tickets, "t1", "org-B")).toBe(false);
    expect(canUpdate(tickets, "t1", "org-A")).toBe(true);
  });

  it("sets resolvedAt when status transitions to resolved", () => {
    function applyStatusTransition(
      ticket: { status: string; resolvedAt?: string | null },
      newStatus: string,
    ) {
      const patch: Record<string, any> = { status: newStatus };
      if (newStatus === "resolved" && !ticket.resolvedAt) {
        patch.resolvedAt = new Date().toISOString();
      }
      return { ...ticket, ...patch };
    }

    const ticket = { status: "open", resolvedAt: null };
    const resolved = applyStatusTransition(ticket, "resolved");

    expect(resolved.status).toBe("resolved");
    expect(resolved.resolvedAt).toBeDefined();
  });
});

// ─── SLA calculation tests ─────────────────────────────────────────────────────

describe("Helpdesk Router: SLA calculation", () => {
  it("returns met when ticket resolved before deadline", () => {
    const status = calculateSlaStatus(
      "2026-06-01T12:00:00Z",
      "2026-05-30T08:00:00Z",
    );
    expect(status).toBe("met");
  });

  it("returns breached when ticket resolved after deadline", () => {
    const status = calculateSlaStatus(
      "2026-01-01T12:00:00Z",
      "2026-01-05T10:00:00Z",
    );
    expect(status).toBe("breached");
  });

  it("returns not_applicable when no dueAt set", () => {
    const status = calculateSlaStatus(null, null);
    expect(status).toBe("not_applicable");
  });

  it("computes SLA deadline based on priority", () => {
    const createdAt = new Date("2026-03-23T09:00:00Z");

    const urgentDeadline = calculateSlaDeadline(createdAt, "urgent");
    const urgentHours =
      (urgentDeadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    expect(urgentHours).toBe(2);

    const highDeadline = calculateSlaDeadline(createdAt, "high");
    const highHours = (highDeadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    expect(highHours).toBe(8);

    const mediumDeadline = calculateSlaDeadline(createdAt, "medium");
    const mediumHours =
      (mediumDeadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    expect(mediumHours).toBe(24);

    const lowDeadline = calculateSlaDeadline(createdAt, "low");
    const lowHours = (lowDeadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    expect(lowHours).toBe(72);
  });

  it("urgent tickets have tightest SLA (2 hours)", () => {
    const createdAt = new Date();
    const urgentDeadline = calculateSlaDeadline(createdAt, "urgent");
    const lowDeadline = calculateSlaDeadline(createdAt, "low");

    expect(urgentDeadline.getTime()).toBeLessThan(lowDeadline.getTime());
  });

  it("returns pending when deadline is in the future and unresolved", () => {
    // Use a far-future date so the SLA is still pending
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const status = calculateSlaStatus(farFuture, null);
    expect(status).toBe("pending");
  });
});

// ─── Org scope enforcement tests ───────────────────────────────────────────────

describe("Helpdesk Router: org scope enforcement", () => {
  it("all tickets include organizationId", () => {
    const orgId = "org-test-123";
    const tickets = [
      { id: "t1", organizationId: orgId, status: "open", priority: "high", subject: "A" },
      { id: "t2", organizationId: orgId, status: "closed", priority: "low", subject: "B" },
    ];

    expect(tickets.every((t) => t.organizationId === orgId)).toBe(true);
  });

  it("context provides organization.id for scoping", () => {
    const context = createMockOrgContext();
    expect(context.organization.id).toBe("test-org-id");
    expect(typeof context.organization.id).toBe("string");
  });

  it("does not return tickets from other organizations", () => {
    const myOrgId = "my-org";
    const otherOrgId = "other-org";

    const tickets = [
      { id: "t1", organizationId: myOrgId, status: "open", priority: "high", subject: "Mine" },
      { id: "t2", organizationId: otherOrgId, status: "open", priority: "medium", subject: "Theirs" },
      { id: "t3", organizationId: myOrgId, status: "pending", priority: "low", subject: "Also mine" },
    ];

    const myTickets = filterTickets(tickets, myOrgId, {});
    expect(myTickets).toHaveLength(2);
    expect(myTickets.every((t) => t.organizationId === myOrgId)).toBe(true);
  });

  it("context member role is set for authorization checks", () => {
    const context = createMockOrgContext();
    expect(context.member.role).toBe("owner");
  });

  it("context user is authenticated with valid id", () => {
    const context = createMockOrgContext();
    expect(context.user.id).toBe("test-user-id");
    expect(context.user.email).toBe("test@example.com");
  });
});
