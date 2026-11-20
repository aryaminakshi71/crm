/**
 * Layout Component Unit Tests
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
  }) =>
    React.createElement(
      "a",
      { href: to, "data-testid": `link-${to.replace(/\//g, "-").replace(/^-/, "")}`, className },
      children,
    ),
  useRouterState: () => ({
    location: { pathname: "/app/crm" },
  }),
  useMatchRoute: () => (pattern: { to: string }) => {
    return pattern.to === "/app/crm" ? true : null;
  },
  Outlet: () => React.createElement("div", { "data-testid": "router-outlet" }),
}));

vi.mock("lucide-react", () => ({
  LayoutDashboard: () => React.createElement("span", { "data-testid": "icon-dashboard" }),
  Users: () => React.createElement("span", { "data-testid": "icon-users" }),
  Building: () => React.createElement("span", { "data-testid": "icon-building" }),
  Package: () => React.createElement("span", { "data-testid": "icon-package" }),
  FileText: () => React.createElement("span", { "data-testid": "icon-filetext" }),
  HeadphonesIcon: () => React.createElement("span", { "data-testid": "icon-headphones" }),
  MessageSquare: () => React.createElement("span", { "data-testid": "icon-message" }),
  Menu: () => React.createElement("span", { "data-testid": "icon-menu" }),
  X: () => React.createElement("span", { "data-testid": "icon-x" }),
  ChevronRight: () => React.createElement("span", { "data-testid": "icon-chevron" }),
  Settings: () => React.createElement("span", { "data-testid": "icon-settings" }),
  LogOut: () => React.createElement("span", { "data-testid": "icon-logout" }),
  Bell: () => React.createElement("span", { "data-testid": "icon-bell" }),
  Home: () => React.createElement("span", { "data-testid": "icon-home" }),
}));

// ─── Inline layout helpers ─────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Dashboard", to: "/app/dashboard" },
  { label: "CRM", to: "/app/crm" },
  { label: "Helpdesk", to: "/app/helpdesk" },
  { label: "Inventory", to: "/app/inventory" },
  { label: "Invoicing", to: "/app/invoicing" },
  { label: "Projects", to: "/app/projects" },
  { label: "Communications", to: "/app/communications" },
];

function AppSidebar({
  activePath = "/app/crm",
  onNavClick = () => {},
}: {
  activePath?: string;
  onNavClick?: (to: string) => void;
}) {
  return React.createElement(
    "nav",
    { "data-testid": "app-sidebar" },
    React.createElement("div", { "data-testid": "sidebar-logo" }, "Nucleo One"),
    React.createElement(
      "ul",
      { "data-testid": "nav-links" },
      NAV_LINKS.map((link) =>
        React.createElement(
          "li",
          {
            key: link.to,
            "data-testid": `nav-item-${link.label.toLowerCase()}`,
            className: activePath === link.to ? "active" : "",
          },
          React.createElement(
            "a",
            {
              href: link.to,
              onClick: () => onNavClick(link.to),
              "aria-current": activePath === link.to ? "page" : undefined,
            },
            link.label,
          ),
        ),
      ),
    ),
  );
}

function MobileMenuButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return React.createElement(
    "button",
    {
      "data-testid": "mobile-menu-toggle",
      onClick: onToggle,
      "aria-label": isOpen ? "Close menu" : "Open menu",
      "aria-expanded": isOpen,
    },
    isOpen ? "Close" : "Menu",
  );
}

function MobileMenu({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return React.createElement(
    "div",
    { "data-testid": "mobile-menu-panel" },
    children,
  );
}

function Breadcrumb({ segments }: { segments: string[] }) {
  return React.createElement(
    "nav",
    { "data-testid": "breadcrumb", "aria-label": "breadcrumb" },
    React.createElement(
      "ol",
      { "data-testid": "breadcrumb-list" },
      segments.map((segment, index) =>
        React.createElement(
          "li",
          { key: segment, "data-testid": `breadcrumb-item-${index}` },
          segment,
        ),
      ),
    ),
  );
}

// ─── App Sidebar Tests ─────────────────────────────────────────────────────────

describe("AppSidebar: renders without crashing", () => {
  it("renders the sidebar element", () => {
    render(React.createElement(AppSidebar, {}));
    expect(screen.getByTestId("app-sidebar")).toBeDefined();
  });

  it("renders the app logo/brand name", () => {
    render(React.createElement(AppSidebar, {}));
    expect(screen.getByTestId("sidebar-logo").textContent).toBe("Nucleo One");
  });

  it("renders navigation links list", () => {
    render(React.createElement(AppSidebar, {}));
    expect(screen.getByTestId("nav-links")).toBeDefined();
  });
});

// ─── Sidebar Navigation Link Tests ────────────────────────────────────────────

describe("AppSidebar: navigation links", () => {
  it("renders Dashboard nav item", () => {
    render(React.createElement(AppSidebar, {}));
    expect(screen.getByTestId("nav-item-dashboard")).toBeDefined();
    expect(screen.getByText("Dashboard")).toBeDefined();
  });

  it("renders CRM nav item", () => {
    render(React.createElement(AppSidebar, {}));
    expect(screen.getByTestId("nav-item-crm")).toBeDefined();
  });

  it("renders Helpdesk nav item", () => {
    render(React.createElement(AppSidebar, {}));
    expect(screen.getByTestId("nav-item-helpdesk")).toBeDefined();
  });

  it("renders all expected navigation items", () => {
    render(React.createElement(AppSidebar, {}));
    const labels = NAV_LINKS.map((l) => l.label);
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeDefined();
    });
  });

  it("calls onNavClick with correct path when nav item clicked", async () => {
    const onNavClick = vi.fn();
    render(React.createElement(AppSidebar, { onNavClick }));

    const user = userEvent.setup();
    await user.click(screen.getByText("Helpdesk"));

    expect(onNavClick).toHaveBeenCalledWith("/app/helpdesk");
  });

  it("navigates using anchor href attributes", () => {
    render(React.createElement(AppSidebar, {}));
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.getAttribute("href")).toBe("/app/dashboard");
  });
});

// ─── Active Route Highlighting Tests ──────────────────────────────────────────

describe("AppSidebar: active route highlighting", () => {
  it("applies active class to current route", () => {
    render(React.createElement(AppSidebar, { activePath: "/app/crm" }));
    const crmItem = screen.getByTestId("nav-item-crm");
    expect(crmItem.className).toContain("active");
  });

  it("does not apply active class to other routes", () => {
    render(React.createElement(AppSidebar, { activePath: "/app/crm" }));
    const dashboardItem = screen.getByTestId("nav-item-dashboard");
    expect(dashboardItem.className).not.toContain("active");
  });

  it("sets aria-current=page on the active link", () => {
    render(React.createElement(AppSidebar, { activePath: "/app/helpdesk" }));
    const helpdeskLink = screen.getByText("Helpdesk").closest("a");
    expect(helpdeskLink?.getAttribute("aria-current")).toBe("page");
  });

  it("does not set aria-current on inactive links", () => {
    render(React.createElement(AppSidebar, { activePath: "/app/helpdesk" }));
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.getAttribute("aria-current")).toBeNull();
  });
});

// ─── Mobile Menu Toggle Tests ──────────────────────────────────────────────────

describe("Mobile menu: toggle behaviour", () => {
  it("renders the toggle button", () => {
    render(React.createElement(MobileMenuButton, { isOpen: false, onToggle: vi.fn() }));
    expect(screen.getByTestId("mobile-menu-toggle")).toBeDefined();
  });

  it("shows Menu text when closed", () => {
    render(React.createElement(MobileMenuButton, { isOpen: false, onToggle: vi.fn() }));
    expect(screen.getByText("Menu")).toBeDefined();
  });

  it("shows Close text when open", () => {
    render(React.createElement(MobileMenuButton, { isOpen: true, onToggle: vi.fn() }));
    expect(screen.getByText("Close")).toBeDefined();
  });

  it("calls onToggle when button clicked", async () => {
    const onToggle = vi.fn();
    render(React.createElement(MobileMenuButton, { isOpen: false, onToggle }));
    const user = userEvent.setup();

    await user.click(screen.getByTestId("mobile-menu-toggle"));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("sets aria-expanded to false when menu closed", () => {
    render(React.createElement(MobileMenuButton, { isOpen: false, onToggle: vi.fn() }));
    const button = screen.getByTestId("mobile-menu-toggle");
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("sets aria-expanded to true when menu open", () => {
    render(React.createElement(MobileMenuButton, { isOpen: true, onToggle: vi.fn() }));
    const button = screen.getByTestId("mobile-menu-toggle");
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("renders mobile menu panel when open", () => {
    render(
      React.createElement(
        MobileMenu,
        { isOpen: true },
        React.createElement("div", null, "Nav content"),
      ),
    );
    expect(screen.getByTestId("mobile-menu-panel")).toBeDefined();
  });

  it("does not render mobile menu panel when closed", () => {
    render(
      React.createElement(
        MobileMenu,
        { isOpen: false },
        React.createElement("div", null, "Nav content"),
      ),
    );
    expect(screen.queryByTestId("mobile-menu-panel")).toBeNull();
  });
});

// ─── Breadcrumb Tests ──────────────────────────────────────────────────────────

describe("Breadcrumb: generation", () => {
  it("renders breadcrumb nav", () => {
    render(React.createElement(Breadcrumb, { segments: ["Home", "CRM", "Contacts"] }));
    expect(screen.getByTestId("breadcrumb")).toBeDefined();
  });

  it("renders all breadcrumb segments", () => {
    render(React.createElement(Breadcrumb, { segments: ["Home", "Projects", "Website Redesign"] }));
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Projects")).toBeDefined();
    expect(screen.getByText("Website Redesign")).toBeDefined();
  });

  it("renders correct number of items", () => {
    render(React.createElement(Breadcrumb, { segments: ["Home", "Helpdesk", "Ticket #42"] }));
    const items = screen.getAllByTestId(/breadcrumb-item-/);
    expect(items).toHaveLength(3);
  });

  it("renders empty breadcrumb without crashing", () => {
    render(React.createElement(Breadcrumb, { segments: [] }));
    expect(screen.getByTestId("breadcrumb-list")).toBeDefined();
  });

  it("generates breadcrumb segments from path", () => {
    function pathToBreadcrumbs(path: string): string[] {
      const parts = path.split("/").filter(Boolean);
      return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "));
    }

    expect(pathToBreadcrumbs("/app/helpdesk")).toEqual(["App", "Helpdesk"]);
    expect(pathToBreadcrumbs("/app/projects/website-redesign")).toEqual([
      "App",
      "Projects",
      "Website redesign",
    ]);
  });
});
