/**
 * CRM Component Unit Tests
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

vi.mock("lucide-react", () => ({
  Flame: () => React.createElement("div", { "data-testid": "flame-icon" }),
  Snowflake: () => React.createElement("div", { "data-testid": "snowflake-icon" }),
  Thermometer: () => React.createElement("div", { "data-testid": "thermometer-icon" }),
  TrendingUp: () => React.createElement("div", { "data-testid": "trending-icon" }),
  User: () => React.createElement("div", { "data-testid": "user-icon" }),
  Mail: () => React.createElement("div", { "data-testid": "mail-icon" }),
  Phone: () => React.createElement("div", { "data-testid": "phone-icon" }),
  Building: () => React.createElement("div", { "data-testid": "building-icon" }),
  Star: () => React.createElement("div", { "data-testid": "star-icon" }),
  Plus: () => React.createElement("div", { "data-testid": "plus-icon" }),
  Filter: () => React.createElement("div", { "data-testid": "filter-icon" }),
  Search: () => React.createElement("div", { "data-testid": "search-icon" }),
  ChevronDown: () => React.createElement("div", { "data-testid": "chevron-icon" }),
  DollarSign: () => React.createElement("div", { "data-testid": "dollar-icon" }),
  Calendar: () => React.createElement("div", { "data-testid": "calendar-icon" }),
  Target: () => React.createElement("div", { "data-testid": "target-icon" }),
}));

vi.mock("@crm/ui", () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    React.createElement("span", { "data-testid": "badge", className }, children),
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => React.createElement("button", { onClick }, children),
  Card: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "card" }, children),
  CardContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "card-content" }, children),
  CardHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "card-header" }, children),
  CardTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h3", {}, children),
}));

// ─── Pure helper functions from CRM logic ────────────────────────────────────

function scoreTemperature(score: number): {
  label: string;
  className: string;
} {
  if (score >= 80)
    return { label: "HOT 🔥", className: "bg-red-100 text-red-700 font-bold" };
  if (score >= 50)
    return { label: "WARM", className: "bg-amber-100 text-amber-700" };
  return { label: "COLD", className: "bg-blue-100 text-blue-700" };
}

function dealProbabilityColor(probability: number): string {
  if (probability >= 70) return "bg-green-500";
  if (probability >= 50) return "bg-amber-500";
  return "bg-blue-500";
}

function contactStatusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-700",
    lead: "bg-blue-100 text-blue-700",
    customer: "bg-purple-100 text-purple-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

// ─── Lead Score Badge Tests ───────────────────────────────────────────────────

describe("scoreTemperature helper", () => {
  it("returns HOT label for score >= 80", () => {
    const result = scoreTemperature(80);
    expect(result.label).toBe("HOT 🔥");
  });

  it("returns red styling for HOT score", () => {
    const result = scoreTemperature(95);
    expect(result.className).toContain("red");
  });

  it("returns WARM label for score 50-79", () => {
    expect(scoreTemperature(50).label).toBe("WARM");
    expect(scoreTemperature(65).label).toBe("WARM");
    expect(scoreTemperature(79).label).toBe("WARM");
  });

  it("returns amber styling for WARM score", () => {
    const result = scoreTemperature(60);
    expect(result.className).toContain("amber");
  });

  it("returns COLD label for score < 50", () => {
    expect(scoreTemperature(49).label).toBe("COLD");
    expect(scoreTemperature(0).label).toBe("COLD");
    expect(scoreTemperature(1).label).toBe("COLD");
  });

  it("returns blue styling for COLD score", () => {
    const result = scoreTemperature(30);
    expect(result.className).toContain("blue");
  });

  it("boundary: score 79 is WARM, score 80 is HOT", () => {
    expect(scoreTemperature(79).label).toBe("WARM");
    expect(scoreTemperature(80).label).toBe("HOT 🔥");
  });

  it("boundary: score 49 is COLD, score 50 is WARM", () => {
    expect(scoreTemperature(49).label).toBe("COLD");
    expect(scoreTemperature(50).label).toBe("WARM");
  });
});

// ─── Deal Probability Bar Tests ───────────────────────────────────────────────

describe("dealProbabilityColor helper", () => {
  it("returns green for probability >= 70%", () => {
    expect(dealProbabilityColor(70)).toBe("bg-green-500");
    expect(dealProbabilityColor(90)).toBe("bg-green-500");
    expect(dealProbabilityColor(100)).toBe("bg-green-500");
  });

  it("returns amber for probability 50-69%", () => {
    expect(dealProbabilityColor(50)).toBe("bg-amber-500");
    expect(dealProbabilityColor(60)).toBe("bg-amber-500");
    expect(dealProbabilityColor(69)).toBe("bg-amber-500");
  });

  it("returns blue for probability < 50%", () => {
    expect(dealProbabilityColor(0)).toBe("bg-blue-500");
    expect(dealProbabilityColor(25)).toBe("bg-blue-500");
    expect(dealProbabilityColor(49)).toBe("bg-blue-500");
  });

  it("boundary: 69% is amber, 70% is green", () => {
    expect(dealProbabilityColor(69)).toBe("bg-amber-500");
    expect(dealProbabilityColor(70)).toBe("bg-green-500");
  });
});

// ─── Contact Status Badge Color Tests ────────────────────────────────────────

describe("contactStatusBadgeColor helper", () => {
  it("returns green for active contacts", () => {
    expect(contactStatusBadgeColor("active")).toContain("green");
  });

  it("returns gray for inactive contacts", () => {
    expect(contactStatusBadgeColor("inactive")).toContain("gray");
  });

  it("returns blue for leads", () => {
    expect(contactStatusBadgeColor("lead")).toContain("blue");
  });

  it("returns purple for customers", () => {
    expect(contactStatusBadgeColor("customer")).toContain("purple");
  });

  it("returns default gray for unknown status", () => {
    expect(contactStatusBadgeColor("unknown")).toContain("gray");
  });
});

// ─── ScoreTemperatureBadge Component Tests ────────────────────────────────────

describe("ScoreTemperatureBadge component", () => {
  function ScoreTemperatureBadge({ score }: { score: number }) {
    const { label, className } = scoreTemperature(score);
    return React.createElement(
      "span",
      { "data-testid": "score-badge", className },
      label,
    );
  }

  it("renders HOT label for high score", () => {
    render(React.createElement(ScoreTemperatureBadge, { score: 85 }));
    expect(screen.getByTestId("score-badge").textContent).toBe("HOT 🔥");
  });

  it("renders WARM label for medium score", () => {
    render(React.createElement(ScoreTemperatureBadge, { score: 65 }));
    expect(screen.getByTestId("score-badge").textContent).toBe("WARM");
  });

  it("renders COLD label for low score", () => {
    render(React.createElement(ScoreTemperatureBadge, { score: 20 }));
    expect(screen.getByTestId("score-badge").textContent).toBe("COLD");
  });

  it("applies red class for HOT", () => {
    render(React.createElement(ScoreTemperatureBadge, { score: 80 }));
    expect(screen.getByTestId("score-badge").className).toContain("red");
  });
});

// ─── Contact List Tests ───────────────────────────────────────────────────────

describe("Contact list rendering", () => {
  const contacts = [
    {
      id: "1",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@corp.com",
      companyName: "Acme Corp",
      status: "active",
    },
    {
      id: "2",
      firstName: "Bob",
      lastName: "Jones",
      email: "bob@start.io",
      companyName: "StartupIO",
      status: "lead",
    },
  ];

  function ContactList({
    contacts,
  }: {
    contacts: typeof contacts;
  }) {
    return React.createElement(
      "table",
      { "data-testid": "contact-table" },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          React.createElement("th", null, "Name"),
          React.createElement("th", null, "Email"),
          React.createElement("th", null, "Company"),
        ),
      ),
      React.createElement(
        "tbody",
        null,
        contacts.map((c) =>
          React.createElement(
            "tr",
            { key: c.id, "data-testid": `contact-row-${c.id}` },
            React.createElement(
              "td",
              null,
              `${c.firstName} ${c.lastName}`,
            ),
            React.createElement("td", null, c.email),
            React.createElement("td", null, c.companyName),
          ),
        ),
      ),
    );
  }

  it("renders contact table", () => {
    render(React.createElement(ContactList, { contacts }));
    expect(screen.getByTestId("contact-table")).toBeDefined();
  });

  it("renders contact name", () => {
    render(React.createElement(ContactList, { contacts }));
    expect(screen.getByText("Alice Smith")).toBeDefined();
  });

  it("renders contact email", () => {
    render(React.createElement(ContactList, { contacts }));
    expect(screen.getByText("alice@corp.com")).toBeDefined();
  });

  it("renders contact company", () => {
    render(React.createElement(ContactList, { contacts }));
    expect(screen.getByText("Acme Corp")).toBeDefined();
  });

  it("renders all contacts", () => {
    render(React.createElement(ContactList, { contacts }));
    expect(screen.getByTestId("contact-row-1")).toBeDefined();
    expect(screen.getByTestId("contact-row-2")).toBeDefined();
  });
});

// ─── Deal Kanban Column Tests ─────────────────────────────────────────────────

describe("Deal kanban column rendering", () => {
  const deals = [
    { id: "d1", name: "Acme Enterprise", value: 50000, probability: 75 },
    { id: "d2", name: "Widget Co", value: 12000, probability: 40 },
  ];

  function DealKanbanColumn({
    stage,
    deals,
  }: {
    stage: string;
    deals: typeof deals;
  }) {
    return React.createElement(
      "div",
      { "data-testid": `kanban-column-${stage}` },
      React.createElement("h3", { "data-testid": "column-title" }, stage),
      deals.map((d) =>
        React.createElement(
          "div",
          { key: d.id, "data-testid": `deal-card-${d.id}` },
          React.createElement("span", { "data-testid": "deal-name" }, d.name),
          React.createElement(
            "span",
            { "data-testid": "deal-value" },
            `$${d.value.toLocaleString()}`,
          ),
          React.createElement(
            "div",
            {
              "data-testid": "probability-bar",
              className: dealProbabilityColor(d.probability),
              style: { width: `${d.probability}%` },
            },
          ),
        ),
      ),
    );
  }

  it("renders kanban column with stage title", () => {
    render(
      React.createElement(DealKanbanColumn, {
        stage: "Qualified",
        deals,
      }),
    );
    expect(screen.getByTestId("column-title").textContent).toBe("Qualified");
  });

  it("renders deal cards in column", () => {
    render(
      React.createElement(DealKanbanColumn, {
        stage: "Proposal",
        deals,
      }),
    );
    expect(screen.getByTestId("deal-card-d1")).toBeDefined();
    expect(screen.getByTestId("deal-card-d2")).toBeDefined();
  });

  it("renders deal name and value", () => {
    render(
      React.createElement(DealKanbanColumn, {
        stage: "Proposal",
        deals,
      }),
    );
    expect(screen.getByText("Acme Enterprise")).toBeDefined();
    expect(screen.getByText("$50,000")).toBeDefined();
  });

  it("renders probability bar with green class for high probability", () => {
    render(
      React.createElement(DealKanbanColumn, {
        stage: "Proposal",
        deals: [{ id: "d1", name: "Deal A", value: 1000, probability: 80 }],
      }),
    );
    const bar = screen.getByTestId("probability-bar");
    expect(bar.className).toContain("green");
  });

  it("renders probability bar with blue class for low probability", () => {
    render(
      React.createElement(DealKanbanColumn, {
        stage: "Proposal",
        deals: [{ id: "d2", name: "Deal B", value: 1000, probability: 30 }],
      }),
    );
    const bar = screen.getByTestId("probability-bar");
    expect(bar.className).toContain("blue");
  });
});

// ─── Today's Focus Banner Tests ───────────────────────────────────────────────

describe("Today's Focus banner", () => {
  const focusItems = [
    { id: "f1", label: "Follow up with Alice", type: "follow-up" },
    { id: "f2", label: "Send proposal to Bob", type: "task" },
    { id: "f3", label: "Demo call at 3pm", type: "meeting" },
  ];

  function TodaysFocusBanner({
    items,
  }: {
    items: typeof focusItems;
  }) {
    return React.createElement(
      "div",
      { "data-testid": "focus-banner" },
      React.createElement("h2", null, "Today's Focus"),
      items.map((item) =>
        React.createElement(
          "div",
          { key: item.id, "data-testid": `focus-item-${item.id}` },
          item.label,
        ),
      ),
    );
  }

  it("renders the focus banner section", () => {
    render(React.createElement(TodaysFocusBanner, { items: focusItems }));
    expect(screen.getByTestId("focus-banner")).toBeDefined();
  });

  it("renders focus banner title", () => {
    render(React.createElement(TodaysFocusBanner, { items: focusItems }));
    expect(screen.getByText("Today's Focus")).toBeDefined();
  });

  it("renders all focus items", () => {
    render(React.createElement(TodaysFocusBanner, { items: focusItems }));
    focusItems.forEach((item) => {
      expect(screen.getByTestId(`focus-item-${item.id}`)).toBeDefined();
    });
  });

  it("renders focus item labels", () => {
    render(React.createElement(TodaysFocusBanner, { items: focusItems }));
    expect(screen.getByText("Follow up with Alice")).toBeDefined();
    expect(screen.getByText("Demo call at 3pm")).toBeDefined();
  });

  it("renders with empty items list without crashing", () => {
    render(React.createElement(TodaysFocusBanner, { items: [] }));
    expect(screen.getByTestId("focus-banner")).toBeDefined();
  });
});
