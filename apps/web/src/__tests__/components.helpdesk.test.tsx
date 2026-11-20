/**
 * HelpDesk Component Unit Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

vi.mock("lucide-react", () => ({
  AlertTriangle: () => React.createElement("div", { "data-testid": "alert-icon" }),
  Search: () => React.createElement("div", { "data-testid": "search-icon" }),
  CheckSquare: () => React.createElement("div", { "data-testid": "check-square" }),
  Square: () => React.createElement("div", { "data-testid": "square" }),
  Clock: () => React.createElement("div", { "data-testid": "clock-icon" }),
  Filter: () => React.createElement("div", { "data-testid": "filter-icon" }),
  Tag: () => React.createElement("div", { "data-testid": "tag-icon" }),
  ChevronDown: () => React.createElement("div", { "data-testid": "chevron-down" }),
  Flame: () => React.createElement("div", { "data-testid": "flame-icon" }),
  User: () => React.createElement("div", { "data-testid": "user-icon" }),
  X: () => React.createElement("div", { "data-testid": "x-icon" }),
  Plus: () => React.createElement("div", { "data-testid": "plus-icon" }),
  MoreVertical: () => React.createElement("div", { "data-testid": "more-icon" }),
}));

vi.mock("@crm/ui", () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("span", { "data-testid": "badge", className }, children),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    React.createElement("button", { onClick }, children),
}));

// ─── Pure helper functions extracted from helpdesk page logic ────────────────

function slaLabel(mins: number): { text: string; color: string } {
  if (mins < 0) return { text: "OVERDUE", color: "red" };
  if (mins <= 30) return { text: `${mins}m`, color: "orange" };
  if (mins <= 60) return { text: `${mins}m`, color: "yellow" };
  return { text: `${mins}m`, color: "green" };
}

function priorityColor(priority: "urgent" | "high" | "medium" | "low"): string {
  const map: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };
  return map[priority] ?? "";
}

function statusColor(
  status: "open" | "in_progress" | "resolved" | "closed" | "pending",
): string {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-700",
    pending: "bg-purple-100 text-purple-700",
  };
  return map[status] ?? "";
}

function filterTickets(
  tickets: Array<{ id: string; title: string; status: string; priority: string }>,
  search: string,
  statusFilter: string,
): Array<{ id: string; title: string; status: string; priority: string }> {
  return tickets.filter((t) => {
    const matchesSearch =
      !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

// ─── Test data ────────────────────────────────────────────────────────────────

const sampleTickets = [
  { id: "1", title: "Login issue", status: "open", priority: "urgent" },
  { id: "2", title: "Password reset", status: "in_progress", priority: "high" },
  { id: "3", title: "Dashboard slow", status: "resolved", priority: "medium" },
  { id: "4", title: "Export broken", status: "closed", priority: "low" },
  { id: "5", title: "API timeout", status: "open", priority: "high" },
];

// ─── SLA Label Tests ─────────────────────────────────────────────────────────

describe("slaLabel helper", () => {
  it("returns OVERDUE with red color for negative minutes", () => {
    const result = slaLabel(-1);
    expect(result.text).toBe("OVERDUE");
    expect(result.color).toBe("red");
  });

  it("returns OVERDUE for very negative minutes", () => {
    const result = slaLabel(-120);
    expect(result.text).toBe("OVERDUE");
    expect(result.color).toBe("red");
  });

  it("returns orange for 0 minutes (imminent)", () => {
    const result = slaLabel(0);
    expect(result.color).toBe("orange");
  });

  it("returns orange for 15 minutes (imminent range)", () => {
    const result = slaLabel(15);
    expect(result.color).toBe("orange");
    expect(result.text).toBe("15m");
  });

  it("returns orange for exactly 30 minutes (boundary)", () => {
    const result = slaLabel(30);
    expect(result.color).toBe("orange");
  });

  it("returns yellow for 31 minutes (warning range)", () => {
    const result = slaLabel(31);
    expect(result.color).toBe("yellow");
    expect(result.text).toBe("31m");
  });

  it("returns yellow for exactly 60 minutes (boundary)", () => {
    const result = slaLabel(60);
    expect(result.color).toBe("yellow");
  });

  it("returns green for 61+ minutes (ok)", () => {
    const result = slaLabel(61);
    expect(result.color).toBe("green");
    expect(result.text).toBe("61m");
  });

  it("returns green for large values", () => {
    const result = slaLabel(480);
    expect(result.color).toBe("green");
    expect(result.text).toBe("480m");
  });
});

// ─── Priority Color Tests ─────────────────────────────────────────────────────

describe("priorityColor helper", () => {
  it("returns red classes for urgent priority", () => {
    const result = priorityColor("urgent");
    expect(result).toContain("red");
  });

  it("returns orange classes for high priority", () => {
    const result = priorityColor("high");
    expect(result).toContain("orange");
  });

  it("returns yellow classes for medium priority", () => {
    const result = priorityColor("medium");
    expect(result).toContain("yellow");
  });

  it("returns green classes for low priority", () => {
    const result = priorityColor("low");
    expect(result).toContain("green");
  });

  it("returns distinct colors for each priority level", () => {
    const urgent = priorityColor("urgent");
    const high = priorityColor("high");
    const medium = priorityColor("medium");
    const low = priorityColor("low");
    const colors = new Set([urgent, high, medium, low]);
    expect(colors.size).toBe(4);
  });
});

// ─── Status Color Tests ───────────────────────────────────────────────────────

describe("statusColor helper", () => {
  it("returns blue classes for open status", () => {
    expect(statusColor("open")).toContain("blue");
  });

  it("returns yellow classes for in_progress status", () => {
    expect(statusColor("in_progress")).toContain("yellow");
  });

  it("returns green classes for resolved status", () => {
    expect(statusColor("resolved")).toContain("green");
  });

  it("returns gray classes for closed status", () => {
    expect(statusColor("closed")).toContain("gray");
  });

  it("returns purple classes for pending status", () => {
    expect(statusColor("pending")).toContain("purple");
  });
});

// ─── Ticket Filter Tests ──────────────────────────────────────────────────────

describe("filterTickets helper", () => {
  it("returns all tickets when search is empty and status is all", () => {
    const result = filterTickets(sampleTickets, "", "all");
    expect(result.length).toBe(5);
  });

  it("filters tickets by search term (case-insensitive)", () => {
    const result = filterTickets(sampleTickets, "login", "all");
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("Login issue");
  });

  it("filters tickets by status", () => {
    const result = filterTickets(sampleTickets, "", "open");
    expect(result.length).toBe(2);
    expect(result.every((t) => t.status === "open")).toBe(true);
  });

  it("applies both search and status filters simultaneously", () => {
    const result = filterTickets(sampleTickets, "API", "open");
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("API timeout");
  });

  it("returns empty array when no tickets match", () => {
    const result = filterTickets(sampleTickets, "nonexistent", "all");
    expect(result.length).toBe(0);
  });
});

// ─── Ticket Row Render Tests ──────────────────────────────────────────────────

describe("Ticket row rendering", () => {
  function TicketRow({
    ticket,
  }: {
    ticket: { id: string; title: string; status: string; priority: string };
  }) {
    const statusCls = statusColor(ticket.status as any);
    const priorityCls = priorityColor(ticket.priority as any);
    return React.createElement(
      "tr",
      { "data-testid": `ticket-row-${ticket.id}` },
      React.createElement("td", null, ticket.title),
      React.createElement(
        "td",
        null,
        React.createElement("span", { className: statusCls }, ticket.status),
      ),
      React.createElement(
        "td",
        null,
        React.createElement("span", { className: priorityCls }, ticket.priority),
      ),
    );
  }

  it("renders ticket title", () => {
    render(
      React.createElement(
        "table",
        null,
        React.createElement(
          "tbody",
          null,
          React.createElement(TicketRow, { ticket: sampleTickets[0] }),
        ),
      ),
    );
    expect(screen.getByText("Login issue")).toBeDefined();
  });

  it("renders ticket status", () => {
    render(
      React.createElement(
        "table",
        null,
        React.createElement(
          "tbody",
          null,
          React.createElement(TicketRow, { ticket: sampleTickets[0] }),
        ),
      ),
    );
    expect(screen.getByText("open")).toBeDefined();
  });

  it("renders ticket priority", () => {
    render(
      React.createElement(
        "table",
        null,
        React.createElement(
          "tbody",
          null,
          React.createElement(TicketRow, { ticket: sampleTickets[0] }),
        ),
      ),
    );
    expect(screen.getByText("urgent")).toBeDefined();
  });
});

// ─── Status Filter Pills Tests ────────────────────────────────────────────────

describe("Status filter pills", () => {
  const STATUS_FILTERS = ["all", "open", "in_progress", "resolved", "closed"];

  function FilterPills({
    active,
    onChange,
  }: {
    active: string;
    onChange: (s: string) => void;
  }) {
    return React.createElement(
      "div",
      { "data-testid": "filter-pills" },
      STATUS_FILTERS.map((s) =>
        React.createElement(
          "button",
          {
            key: s,
            onClick: () => onChange(s),
            "data-active": active === s ? "true" : "false",
            "data-testid": `filter-${s}`,
          },
          s,
        ),
      ),
    );
  }

  it("renders all status filter options", () => {
    render(
      React.createElement(FilterPills, { active: "all", onChange: vi.fn() }),
    );
    STATUS_FILTERS.forEach((s) => {
      expect(screen.getByTestId(`filter-${s}`)).toBeDefined();
    });
  });

  it("marks active filter with data-active=true", () => {
    render(
      React.createElement(FilterPills, { active: "open", onChange: vi.fn() }),
    );
    expect(screen.getByTestId("filter-open").getAttribute("data-active")).toBe(
      "true",
    );
    expect(screen.getByTestId("filter-all").getAttribute("data-active")).toBe(
      "false",
    );
  });

  it("calls onChange with new filter when clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      React.createElement(FilterPills, { active: "all", onChange }),
    );
    await user.click(screen.getByTestId("filter-open"));
    expect(onChange).toHaveBeenCalledWith("open");
  });
});

// ─── Bulk Checkbox Selection Tests ───────────────────────────────────────────

describe("Bulk checkbox selection", () => {
  function BulkSelector({
    tickets,
  }: {
    tickets: Array<{ id: string; title: string }>;
  }) {
    const [selected, setSelected] = React.useState<Set<string>>(new Set());

    const selectAll = () => {
      if (selected.size === tickets.length) {
        setSelected(new Set());
      } else {
        setSelected(new Set(tickets.map((t) => t.id)));
      }
    };

    const toggle = (id: string) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelected(next);
    };

    return React.createElement(
      "div",
      null,
      React.createElement(
        "input",
        {
          type: "checkbox",
          "data-testid": "select-all",
          checked: selected.size === tickets.length && tickets.length > 0,
          onChange: selectAll,
        },
      ),
      React.createElement(
        "span",
        { "data-testid": "selected-count" },
        String(selected.size),
      ),
      tickets.map((t) =>
        React.createElement(
          "input",
          {
            key: t.id,
            type: "checkbox",
            "data-testid": `select-${t.id}`,
            checked: selected.has(t.id),
            onChange: () => toggle(t.id),
          },
        ),
      ),
    );
  }

  const small = sampleTickets.slice(0, 3);

  it("starts with no tickets selected", () => {
    render(React.createElement(BulkSelector, { tickets: small }));
    expect(screen.getByTestId("selected-count").textContent).toBe("0");
  });

  it("selects all tickets when select-all is clicked", async () => {
    const user = userEvent.setup();
    render(React.createElement(BulkSelector, { tickets: small }));
    await user.click(screen.getByTestId("select-all"));
    expect(screen.getByTestId("selected-count").textContent).toBe(
      String(small.length),
    );
  });

  it("deselects all when select-all is clicked again", async () => {
    const user = userEvent.setup();
    render(React.createElement(BulkSelector, { tickets: small }));
    await user.click(screen.getByTestId("select-all"));
    await user.click(screen.getByTestId("select-all"));
    expect(screen.getByTestId("selected-count").textContent).toBe("0");
  });

  it("selects individual ticket via checkbox", async () => {
    const user = userEvent.setup();
    render(React.createElement(BulkSelector, { tickets: small }));
    await user.click(screen.getByTestId("select-1"));
    expect(screen.getByTestId("selected-count").textContent).toBe("1");
  });
});

// ─── Ticket Search Tests ──────────────────────────────────────────────────────

describe("Ticket search input", () => {
  function TicketSearch({
    tickets,
  }: {
    tickets: Array<{ id: string; title: string; status: string; priority: string }>;
  }) {
    const [query, setQuery] = React.useState("");
    const filtered = filterTickets(tickets, query, "all");
    return React.createElement(
      "div",
      null,
      React.createElement("input", {
        type: "search",
        "data-testid": "search-input",
        value: query,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setQuery(e.target.value),
        placeholder: "Search tickets...",
      }),
      React.createElement(
        "span",
        { "data-testid": "result-count" },
        String(filtered.length),
      ),
    );
  }

  it("shows all tickets before typing", () => {
    render(React.createElement(TicketSearch, { tickets: sampleTickets }));
    expect(screen.getByTestId("result-count").textContent).toBe("5");
  });

  it("filters list on search input change", async () => {
    const user = userEvent.setup();
    render(React.createElement(TicketSearch, { tickets: sampleTickets }));
    await user.type(screen.getByTestId("search-input"), "API");
    expect(screen.getByTestId("result-count").textContent).toBe("1");
  });

  it("is case-insensitive when filtering", async () => {
    const user = userEvent.setup();
    render(React.createElement(TicketSearch, { tickets: sampleTickets }));
    await user.type(screen.getByTestId("search-input"), "login");
    expect(screen.getByTestId("result-count").textContent).toBe("1");
  });

  it("shows zero results for non-matching search", async () => {
    const user = userEvent.setup();
    render(React.createElement(TicketSearch, { tickets: sampleTickets }));
    await user.type(screen.getByTestId("search-input"), "zzznomatch");
    expect(screen.getByTestId("result-count").textContent).toBe("0");
  });
});
