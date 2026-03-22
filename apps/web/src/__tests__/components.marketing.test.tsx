/**
 * Marketing Component Unit Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

vi.mock("lucide-react", () => ({
  Plus: () => React.createElement("div", { "data-testid": "plus-icon" }),
  Search: () => React.createElement("div", { "data-testid": "search-icon" }),
  Filter: () => React.createElement("div", { "data-testid": "filter-icon" }),
  BarChart3: () => React.createElement("div", { "data-testid": "chart-icon" }),
  Mail: () => React.createElement("div", { "data-testid": "mail-icon" }),
  Globe: () => React.createElement("div", { "data-testid": "globe-icon" }),
  Megaphone: () => React.createElement("div", { "data-testid": "megaphone-icon" }),
  X: () => React.createElement("div", { "data-testid": "x-icon" }),
  ChevronDown: () => React.createElement("div", { "data-testid": "chevron-icon" }),
  Calendar: () => React.createElement("div", { "data-testid": "calendar-icon" }),
  Users: () => React.createElement("div", { "data-testid": "users-icon" }),
  TrendingUp: () => React.createElement("div", { "data-testid": "trending-icon" }),
  Link: () => React.createElement("div", { "data-testid": "link-icon" }),
  Copy: () => React.createElement("div", { "data-testid": "copy-icon" }),
  Eye: () => React.createElement("div", { "data-testid": "eye-icon" }),
}));

vi.mock("@crm/ui", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => React.createElement("button", { onClick }, children),
  Badge: ({ children }: { children: React.ReactNode }) =>
    React.createElement("span", { "data-testid": "badge" }, children),
  Card: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "card" }, children),
  CardContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "card-content" }, children),
  CardHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "card-header" }, children),
  CardTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h3", {}, children),
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const sampleCampaigns = [
  {
    id: "c1",
    name: "Q1 Email Blast",
    channel: "email",
    status: "active",
    audience: 5000,
    budget: 2000,
  },
  {
    id: "c2",
    name: "Spring Social Push",
    channel: "social",
    status: "draft",
    audience: 12000,
    budget: 5000,
  },
  {
    id: "c3",
    name: "Google Ads Retargeting",
    channel: "paid",
    status: "completed",
    audience: 8000,
    budget: 10000,
  },
];

// ─── Campaign List Tests ──────────────────────────────────────────────────────

describe("Campaign list rendering", () => {
  function CampaignList({
    campaigns,
  }: {
    campaigns: typeof sampleCampaigns;
  }) {
    return React.createElement(
      "table",
      { "data-testid": "campaign-table" },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          React.createElement("th", null, "Name"),
          React.createElement("th", null, "Channel"),
          React.createElement("th", null, "Status"),
        ),
      ),
      React.createElement(
        "tbody",
        null,
        campaigns.map((c) =>
          React.createElement(
            "tr",
            { key: c.id, "data-testid": `campaign-row-${c.id}` },
            React.createElement("td", { "data-testid": `campaign-name-${c.id}` }, c.name),
            React.createElement("td", { "data-testid": `campaign-channel-${c.id}` }, c.channel),
            React.createElement("td", { "data-testid": `campaign-status-${c.id}` }, c.status),
          ),
        ),
      ),
    );
  }

  it("renders campaign table", () => {
    render(React.createElement(CampaignList, { campaigns: sampleCampaigns }));
    expect(screen.getByTestId("campaign-table")).toBeDefined();
  });

  it("renders Name, Channel, Status column headers", () => {
    render(React.createElement(CampaignList, { campaigns: sampleCampaigns }));
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Channel")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
  });

  it("renders campaign name", () => {
    render(React.createElement(CampaignList, { campaigns: sampleCampaigns }));
    expect(screen.getByText("Q1 Email Blast")).toBeDefined();
  });

  it("renders campaign channel", () => {
    render(React.createElement(CampaignList, { campaigns: sampleCampaigns }));
    expect(screen.getByTestId("campaign-channel-c1").textContent).toBe("email");
  });

  it("renders campaign status", () => {
    render(React.createElement(CampaignList, { campaigns: sampleCampaigns }));
    expect(screen.getByTestId("campaign-status-c2").textContent).toBe("draft");
  });

  it("renders a row per campaign", () => {
    render(React.createElement(CampaignList, { campaigns: sampleCampaigns }));
    sampleCampaigns.forEach((c) => {
      expect(screen.getByTestId(`campaign-row-${c.id}`)).toBeDefined();
    });
  });
});

// ─── UTM Builder Tests ────────────────────────────────────────────────────────

describe("UTM builder component", () => {
  function buildUtmUrl(
    baseUrl: string,
    params: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    },
  ): string {
    if (!baseUrl) return "";
    const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
    if (params.source) url.searchParams.set("utm_source", params.source);
    if (params.medium) url.searchParams.set("utm_medium", params.medium);
    if (params.campaign) url.searchParams.set("utm_campaign", params.campaign);
    if (params.term) url.searchParams.set("utm_term", params.term);
    if (params.content) url.searchParams.set("utm_content", params.content);
    return url.toString();
  }

  function UtmBuilder() {
    const [baseUrl, setBaseUrl] = React.useState("https://example.com");
    const [source, setSource] = React.useState("");
    const [medium, setMedium] = React.useState("");
    const [campaign, setCampaign] = React.useState("");
    const generatedUrl = buildUtmUrl(baseUrl, { source, medium, campaign });

    return React.createElement(
      "div",
      null,
      React.createElement("input", {
        "data-testid": "utm-base-url",
        value: baseUrl,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setBaseUrl(e.target.value),
      }),
      React.createElement("input", {
        "data-testid": "utm-source",
        value: source,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setSource(e.target.value),
        placeholder: "Source",
      }),
      React.createElement("input", {
        "data-testid": "utm-medium",
        value: medium,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setMedium(e.target.value),
        placeholder: "Medium",
      }),
      React.createElement("input", {
        "data-testid": "utm-campaign",
        value: campaign,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setCampaign(e.target.value),
        placeholder: "Campaign",
      }),
      React.createElement(
        "div",
        { "data-testid": "utm-output" },
        generatedUrl,
      ),
    );
  }

  it("renders UTM input fields", () => {
    render(React.createElement(UtmBuilder));
    expect(screen.getByTestId("utm-source")).toBeDefined();
    expect(screen.getByTestId("utm-medium")).toBeDefined();
    expect(screen.getByTestId("utm-campaign")).toBeDefined();
  });

  it("updates URL when source input changes", async () => {
    const user = userEvent.setup();
    render(React.createElement(UtmBuilder));
    await user.type(screen.getByTestId("utm-source"), "newsletter");
    expect(screen.getByTestId("utm-output").textContent).toContain(
      "utm_source=newsletter",
    );
  });

  it("updates URL when medium input changes", async () => {
    const user = userEvent.setup();
    render(React.createElement(UtmBuilder));
    await user.type(screen.getByTestId("utm-medium"), "email");
    expect(screen.getByTestId("utm-output").textContent).toContain(
      "utm_medium=email",
    );
  });

  it("updates URL when campaign input changes", async () => {
    const user = userEvent.setup();
    render(React.createElement(UtmBuilder));
    await user.type(screen.getByTestId("utm-campaign"), "spring-sale");
    expect(screen.getByTestId("utm-output").textContent).toContain(
      "utm_campaign=spring-sale",
    );
  });

  it("builds URL helper correctly with all params", () => {
    const url = buildUtmUrl("https://example.com", {
      source: "google",
      medium: "cpc",
      campaign: "q1",
    });
    expect(url).toContain("utm_source=google");
    expect(url).toContain("utm_medium=cpc");
    expect(url).toContain("utm_campaign=q1");
  });

  it("buildUtmUrl returns empty string for empty base URL", () => {
    const url = buildUtmUrl("", { source: "google" });
    expect(url).toBe("");
  });
});

// ─── Heatmap Grid Tests ───────────────────────────────────────────────────────

describe("Engagement heatmap grid", () => {
  function HeatmapGrid() {
    const DAYS = 7;
    const HOURS = 24;
    const cells = [];
    for (let day = 0; day < DAYS; day++) {
      for (let hour = 0; hour < HOURS; hour++) {
        cells.push(
          React.createElement("div", {
            key: `${day}-${hour}`,
            "data-testid": `heatmap-cell-${day}-${hour}`,
            "data-day": day,
            "data-hour": hour,
          }),
        );
      }
    }
    return React.createElement(
      "div",
      { "data-testid": "heatmap-grid" },
      cells,
    );
  }

  it("renders the heatmap grid container", () => {
    render(React.createElement(HeatmapGrid));
    expect(screen.getByTestId("heatmap-grid")).toBeDefined();
  });

  it("renders exactly 168 cells (7 days × 24 hours)", () => {
    render(React.createElement(HeatmapGrid));
    const cells = screen
      .getByTestId("heatmap-grid")
      .querySelectorAll("[data-testid^='heatmap-cell-']");
    expect(cells.length).toBe(168);
  });

  it("renders cell for day 0 hour 0", () => {
    render(React.createElement(HeatmapGrid));
    expect(screen.getByTestId("heatmap-cell-0-0")).toBeDefined();
  });

  it("renders cell for day 6 hour 23 (last cell)", () => {
    render(React.createElement(HeatmapGrid));
    expect(screen.getByTestId("heatmap-cell-6-23")).toBeDefined();
  });

  it("cells have correct data-day and data-hour attributes", () => {
    render(React.createElement(HeatmapGrid));
    const cell = screen.getByTestId("heatmap-cell-3-12");
    expect(cell.getAttribute("data-day")).toBe("3");
    expect(cell.getAttribute("data-hour")).toBe("12");
  });
});

// ─── Campaign Modal Tests ─────────────────────────────────────────────────────

describe("Campaign modal", () => {
  function CampaignModal({
    open,
    onClose,
    onSubmit,
  }: {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
      name: string;
      channel: string;
      audience: string;
      budget: string;
    }) => void;
  }) {
    const [name, setName] = React.useState("");
    const [channel, setChannel] = React.useState("email");
    const [audience, setAudience] = React.useState("");
    const [budget, setBudget] = React.useState("");

    if (!open) return null;

    return React.createElement(
      "div",
      { role: "dialog", "aria-modal": "true", "data-testid": "campaign-modal" },
      React.createElement("h2", null, "New Campaign"),
      React.createElement("input", {
        "data-testid": "campaign-name-input",
        value: name,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setName(e.target.value),
        placeholder: "Campaign name",
      }),
      React.createElement(
        "select",
        {
          "data-testid": "campaign-channel-select",
          value: channel,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
            setChannel(e.target.value),
        },
        React.createElement("option", { value: "email" }, "Email"),
        React.createElement("option", { value: "social" }, "Social"),
        React.createElement("option", { value: "paid" }, "Paid Ads"),
      ),
      React.createElement("input", {
        "data-testid": "campaign-audience-input",
        value: audience,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setAudience(e.target.value),
        placeholder: "Target audience",
      }),
      React.createElement("input", {
        "data-testid": "campaign-budget-input",
        type: "number",
        value: budget,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setBudget(e.target.value),
        placeholder: "Budget",
      }),
      React.createElement(
        "button",
        {
          "data-testid": "campaign-submit",
          onClick: () => onSubmit({ name, channel, audience, budget }),
        },
        "Create Campaign",
      ),
      React.createElement(
        "button",
        { "data-testid": "campaign-cancel", onClick: onClose },
        "Cancel",
      ),
    );
  }

  it("does not render modal when open=false", () => {
    render(
      React.createElement(CampaignModal, {
        open: false,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    expect(screen.queryByTestId("campaign-modal")).toBeNull();
  });

  it("renders modal when open=true", () => {
    render(
      React.createElement(CampaignModal, {
        open: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    expect(screen.getByTestId("campaign-modal")).toBeDefined();
  });

  it("modal has role=dialog and aria-modal", () => {
    render(
      React.createElement(CampaignModal, {
        open: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    const modal = screen.getByTestId("campaign-modal");
    expect(modal.getAttribute("role")).toBe("dialog");
    expect(modal.getAttribute("aria-modal")).toBe("true");
  });

  it("renders name, channel, audience, budget fields", () => {
    render(
      React.createElement(CampaignModal, {
        open: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    expect(screen.getByTestId("campaign-name-input")).toBeDefined();
    expect(screen.getByTestId("campaign-channel-select")).toBeDefined();
    expect(screen.getByTestId("campaign-audience-input")).toBeDefined();
    expect(screen.getByTestId("campaign-budget-input")).toBeDefined();
  });

  it("calls onSubmit with form values on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      React.createElement(CampaignModal, {
        open: true,
        onClose: vi.fn(),
        onSubmit,
      }),
    );
    await user.type(screen.getByTestId("campaign-name-input"), "Test Campaign");
    await user.click(screen.getByTestId("campaign-submit"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test Campaign" }),
    );
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      React.createElement(CampaignModal, {
        open: true,
        onClose,
        onSubmit: vi.fn(),
      }),
    );
    await user.click(screen.getByTestId("campaign-cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── New Campaign Button Tests ────────────────────────────────────────────────

describe("New Campaign button opens modal", () => {
  function CampaignsPageHeader() {
    const [modalOpen, setModalOpen] = React.useState(false);
    return React.createElement(
      "div",
      null,
      React.createElement(
        "button",
        {
          "data-testid": "new-campaign-btn",
          onClick: () => setModalOpen(true),
        },
        "New Campaign",
      ),
      modalOpen &&
        React.createElement(
          "div",
          { "data-testid": "modal-overlay" },
          "Campaign Modal",
        ),
    );
  }

  it("modal is not visible on initial render", () => {
    render(React.createElement(CampaignsPageHeader));
    expect(screen.queryByTestId("modal-overlay")).toBeNull();
  });

  it("modal opens when New Campaign button is clicked", async () => {
    const user = userEvent.setup();
    render(React.createElement(CampaignsPageHeader));
    await user.click(screen.getByTestId("new-campaign-btn"));
    expect(screen.getByTestId("modal-overlay")).toBeDefined();
  });
});
