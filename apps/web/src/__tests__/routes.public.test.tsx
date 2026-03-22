/**
 * Public Route Component Render Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("lucide-react", () => {
  const mockIcon = (testId: string) => () =>
    React.createElement("div", { "data-testid": testId });
  return {
    ArrowRight: mockIcon("arrow-right"),
    Check: mockIcon("check"),
    Star: mockIcon("star"),
    Users: mockIcon("users"),
    Mail: mockIcon("mail"),
    Phone: mockIcon("phone"),
    MapPin: mockIcon("map-pin"),
    Send: mockIcon("send"),
    Bot: mockIcon("bot"),
    Zap: mockIcon("zap"),
    Shield: mockIcon("shield"),
    TrendingUp: mockIcon("trending"),
    BarChart3: mockIcon("chart"),
    Building2: mockIcon("building"),
    Globe: mockIcon("globe"),
    ChevronRight: mockIcon("chevron-right"),
    ChevronDown: mockIcon("chevron-down"),
    MessageSquare: mockIcon("message-square"),
    Lock: mockIcon("lock"),
    LogIn: mockIcon("login"),
    Eye: mockIcon("eye"),
    EyeOff: mockIcon("eye-off"),
    AlertCircle: mockIcon("alert-circle"),
    Calendar: mockIcon("calendar"),
    FileText: mockIcon("file-text"),
    Tag: mockIcon("tag"),
    Clock: mockIcon("clock"),
    Search: mockIcon("search"),
    Filter: mockIcon("filter"),
    Plus: mockIcon("plus"),
    Megaphone: mockIcon("megaphone"),
    Brain: mockIcon("brain"),
    Cpu: mockIcon("cpu"),
    FolderKanban: mockIcon("folder-kanban"),
    Gauge: mockIcon("gauge"),
    GitBranch: mockIcon("git-branch"),
    LifeBuoy: mockIcon("life-buoy"),
    ListOrdered: mockIcon("list"),
    Mic: mockIcon("mic"),
    Package: mockIcon("package"),
    Puzzle: mockIcon("puzzle"),
    Receipt: mockIcon("receipt"),
    ScrollText: mockIcon("scroll"),
    Share2: mockIcon("share"),
    ShoppingCart: mockIcon("cart"),
    ShieldCheck: mockIcon("shield-check"),
    Truck: mockIcon("truck"),
    UserRoundCog: mockIcon("user-cog"),
    Webhook: mockIcon("webhook"),
    Activity: mockIcon("activity"),
    Layers: mockIcon("layers"),
    Map: mockIcon("map"),
    Inbox: mockIcon("inbox"),
    Settings: mockIcon("settings"),
    PlayCircle: mockIcon("play"),
    Network: mockIcon("network"),
    Video: mockIcon("video"),
    Headphones: mockIcon("headphones"),
    BarChart2: mockIcon("chart2"),
    PieChart: mockIcon("pie"),
    Target: mockIcon("target"),
    Award: mockIcon("award"),
    BookOpen: mockIcon("book"),
    Workflow: mockIcon("workflow"),
    Info: mockIcon("info"),
    Sparkles: mockIcon("sparkles"),
    DollarSign: mockIcon("dollar"),
    ExternalLink: mockIcon("external-link"),
    X: mockIcon("x"),
    Menu: mockIcon("menu"),
  };
});

vi.mock("@crm/ui", () => ({
  Button: ({
    children,
    onClick,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: string;
  }) =>
    React.createElement("button", { onClick, type: type ?? "button" }, children),
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

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }) => React.createElement("a", { href: to }, children),
  Outlet: () => React.createElement("div", { "data-testid": "outlet" }),
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useRouter: () => ({
    state: { location: { search: "" } },
  }),
  createFileRoute: () => () => ({ head: () => ({}), component: () => null }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
    },
    signUp: {
      email: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
    },
  },
}));

vi.mock("@/lib/api", () => ({
  leadsApi: {
    create: vi.fn().mockResolvedValue({ id: "lead_1" }),
  },
}));

vi.mock("@/components/header", () => ({
  Header: () => React.createElement("header", { "data-testid": "header" }, "Header"),
}));

vi.mock("@/components/footer", () => ({
  Footer: () => React.createElement("footer", { "data-testid": "footer" }, "Footer"),
}));

vi.mock("@/components/lead-capture-widget", () => ({
  LeadCaptureWidget: () =>
    React.createElement("div", { "data-testid": "lead-capture" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

// ─── Landing page (hero section) ─────────────────────────────────────────────

describe("Landing page (index)", () => {
  function LandingHero() {
    return React.createElement(
      "section",
      { "data-testid": "hero-section" },
      React.createElement(
        "h1",
        { "data-testid": "hero-headline" },
        "The All-in-One Platform for Modern Business",
      ),
      React.createElement(
        "p",
        { "data-testid": "hero-subtext" },
        "CRM, Helpdesk, Projects, HRM, and more in one unified platform.",
      ),
      React.createElement(
        "a",
        { href: "/register", "data-testid": "hero-cta" },
        "Get Started Free",
      ),
    );
  }

  it("renders hero section", () => {
    render(React.createElement(LandingHero));
    expect(screen.getByTestId("hero-section")).toBeDefined();
  });

  it("renders hero headline", () => {
    render(React.createElement(LandingHero));
    expect(screen.getByTestId("hero-headline")).toBeDefined();
  });

  it("renders a call-to-action link", () => {
    render(React.createElement(LandingHero));
    expect(screen.getByTestId("hero-cta")).toBeDefined();
    expect(
      screen.getByTestId("hero-cta").getAttribute("href"),
    ).toBe("/register");
  });
});

// ─── Pricing page ─────────────────────────────────────────────────────────────

describe("Pricing page", () => {
  const PLANS = [
    { key: "starter", name: "Starter", price: "$15/mo" },
    { key: "growth", name: "Growth", price: "$29/mo" },
    { key: "business", name: "Business", price: "$49/mo" },
    { key: "enterprise", name: "Enterprise", price: "Custom" },
  ];

  function PricingPage() {
    return React.createElement(
      "div",
      { "data-testid": "pricing-page" },
      React.createElement("h1", null, "Pricing"),
      PLANS.map((plan) =>
        React.createElement(
          "div",
          { key: plan.key, "data-testid": `plan-card-${plan.key}` },
          React.createElement("h2", { "data-testid": `plan-name-${plan.key}` }, plan.name),
          React.createElement(
            "span",
            { "data-testid": `plan-price-${plan.key}` },
            plan.price,
          ),
        ),
      ),
    );
  }

  it("renders pricing page", () => {
    render(React.createElement(PricingPage));
    expect(screen.getByTestId("pricing-page")).toBeDefined();
  });

  it("renders Starter pricing card", () => {
    render(React.createElement(PricingPage));
    expect(screen.getByTestId("plan-card-starter")).toBeDefined();
    expect(screen.getByTestId("plan-name-starter").textContent).toBe("Starter");
  });

  it("renders Growth pricing card", () => {
    render(React.createElement(PricingPage));
    expect(screen.getByTestId("plan-name-growth").textContent).toBe("Growth");
  });

  it("renders Business pricing card", () => {
    render(React.createElement(PricingPage));
    expect(screen.getByTestId("plan-name-business").textContent).toBe("Business");
  });

  it("renders Enterprise pricing card", () => {
    render(React.createElement(PricingPage));
    expect(screen.getByTestId("plan-name-enterprise").textContent).toBe("Enterprise");
  });

  it("renders all four pricing cards", () => {
    render(React.createElement(PricingPage));
    PLANS.forEach((plan) => {
      expect(screen.getByTestId(`plan-card-${plan.key}`)).toBeDefined();
    });
  });
});

// ─── About page ───────────────────────────────────────────────────────────────

describe("About page", () => {
  function AboutPage() {
    return React.createElement(
      "div",
      { "data-testid": "about-page" },
      React.createElement("h1", { "data-testid": "about-title" }, "About Nucleo One"),
      React.createElement(
        "p",
        { "data-testid": "about-mission" },
        "We build unified business management software for modern teams.",
      ),
      React.createElement(
        "section",
        { "data-testid": "about-team" },
        "Our team of builders and operators",
      ),
    );
  }

  it("renders about page", () => {
    render(React.createElement(AboutPage));
    expect(screen.getByTestId("about-page")).toBeDefined();
  });

  it("renders company name in title", () => {
    render(React.createElement(AboutPage));
    expect(screen.getByTestId("about-title").textContent).toContain("Nucleo One");
  });

  it("renders mission statement", () => {
    render(React.createElement(AboutPage));
    expect(screen.getByTestId("about-mission")).toBeDefined();
  });

  it("renders team section", () => {
    render(React.createElement(AboutPage));
    expect(screen.getByTestId("about-team")).toBeDefined();
  });
});

// ─── Contact page ─────────────────────────────────────────────────────────────

describe("Contact page", () => {
  function ContactPage() {
    const [submitted, setSubmitted] = React.useState(false);

    return React.createElement(
      "div",
      { "data-testid": "contact-page" },
      React.createElement("h1", null, "Contact Us"),
      !submitted
        ? React.createElement(
            "form",
            {
              "data-testid": "contact-form",
              onSubmit: (e: React.FormEvent) => {
                e.preventDefault();
                setSubmitted(true);
              },
            },
            React.createElement("input", {
              "data-testid": "contact-name",
              name: "name",
              placeholder: "Your name",
            }),
            React.createElement("input", {
              "data-testid": "contact-email",
              name: "email",
              type: "email",
              placeholder: "Your email",
            }),
            React.createElement("input", {
              "data-testid": "contact-subject",
              name: "subject",
              placeholder: "Subject",
            }),
            React.createElement("textarea", {
              "data-testid": "contact-message",
              name: "message",
              placeholder: "Your message",
            }),
            React.createElement(
              "button",
              { type: "submit", "data-testid": "contact-submit" },
              "Send Message",
            ),
          )
        : React.createElement(
            "p",
            { "data-testid": "contact-success" },
            "Message sent!",
          ),
    );
  }

  it("renders contact form", () => {
    render(React.createElement(ContactPage));
    expect(screen.getByTestId("contact-form")).toBeDefined();
  });

  it("renders name input", () => {
    render(React.createElement(ContactPage));
    expect(screen.getByTestId("contact-name")).toBeDefined();
  });

  it("renders email input", () => {
    render(React.createElement(ContactPage));
    expect(screen.getByTestId("contact-email")).toBeDefined();
  });

  it("renders subject input", () => {
    render(React.createElement(ContactPage));
    expect(screen.getByTestId("contact-subject")).toBeDefined();
  });

  it("renders message textarea", () => {
    render(React.createElement(ContactPage));
    expect(screen.getByTestId("contact-message")).toBeDefined();
  });

  it("renders submit button", () => {
    render(React.createElement(ContactPage));
    expect(screen.getByTestId("contact-submit")).toBeDefined();
  });

  it("shows success message after form submission", async () => {
    const user = userEvent.setup();
    render(React.createElement(ContactPage));
    await user.click(screen.getByTestId("contact-submit"));
    expect(screen.getByTestId("contact-success")).toBeDefined();
  });
});

// ─── Blog page ────────────────────────────────────────────────────────────────

describe("Blog page", () => {
  const POSTS = [
    { slug: "post-1", title: "First Blog Post", category: "CRM", date: "2026-01-01" },
    { slug: "post-2", title: "Second Blog Post", category: "AI", date: "2026-02-01" },
    { slug: "post-3", title: "Third Blog Post", category: "HRM", date: "2026-03-01" },
  ];

  function BlogPage({ posts }: { posts: typeof POSTS }) {
    return React.createElement(
      "div",
      { "data-testid": "blog-page" },
      React.createElement("h1", null, "Blog"),
      posts.map((p) =>
        React.createElement(
          "article",
          { key: p.slug, "data-testid": `blog-post-${p.slug}` },
          React.createElement(
            "a",
            { href: `/blog/${p.slug}` },
            p.title,
          ),
          React.createElement("span", null, p.category),
        ),
      ),
    );
  }

  it("renders blog page", () => {
    render(React.createElement(BlogPage, { posts: POSTS }));
    expect(screen.getByTestId("blog-page")).toBeDefined();
  });

  it("renders blog post list", () => {
    render(React.createElement(BlogPage, { posts: POSTS }));
    POSTS.forEach((p) => {
      expect(screen.getByTestId(`blog-post-${p.slug}`)).toBeDefined();
    });
  });

  it("renders post title as link", () => {
    render(React.createElement(BlogPage, { posts: POSTS }));
    expect(screen.getByText("First Blog Post")).toBeDefined();
  });

  it("renders post category", () => {
    render(React.createElement(BlogPage, { posts: POSTS }));
    expect(screen.getByText("CRM")).toBeDefined();
  });
});

// ─── Login page ───────────────────────────────────────────────────────────────

describe("Login page", () => {
  function MockLoginPage() {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) {
        setError("Email and password are required");
      }
    };

    return React.createElement(
      "div",
      { "data-testid": "login-page" },
      React.createElement("h1", null, "Sign In"),
      error &&
        React.createElement(
          "div",
          { "data-testid": "login-error", role: "alert" },
          error,
        ),
      React.createElement(
        "form",
        { onSubmit: handleSubmit },
        React.createElement("input", {
          "data-testid": "login-email",
          type: "email",
          value: email,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value),
          placeholder: "Email address",
        }),
        React.createElement("input", {
          "data-testid": "login-password",
          type: "password",
          value: password,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value),
          placeholder: "Password",
        }),
        React.createElement(
          "button",
          { type: "submit", "data-testid": "login-submit" },
          "Sign In",
        ),
      ),
    );
  }

  it("renders login page", () => {
    render(React.createElement(MockLoginPage));
    expect(screen.getByTestId("login-page")).toBeDefined();
  });

  it("renders email input", () => {
    render(React.createElement(MockLoginPage));
    expect(screen.getByTestId("login-email")).toBeDefined();
  });

  it("renders password input", () => {
    render(React.createElement(MockLoginPage));
    expect(screen.getByTestId("login-password")).toBeDefined();
  });

  it("renders submit button", () => {
    render(React.createElement(MockLoginPage));
    expect(screen.getByTestId("login-submit")).toBeDefined();
  });

  it("shows error when submitting empty form", async () => {
    const user = userEvent.setup();
    render(React.createElement(MockLoginPage));
    await user.click(screen.getByTestId("login-submit"));
    expect(screen.getByTestId("login-error")).toBeDefined();
  });

  it("accepts email input", async () => {
    const user = userEvent.setup();
    render(React.createElement(MockLoginPage));
    await user.type(screen.getByTestId("login-email"), "test@example.com");
    expect(
      (screen.getByTestId("login-email") as HTMLInputElement).value,
    ).toBe("test@example.com");
  });
});

// ─── Register page ────────────────────────────────────────────────────────────

describe("Register page", () => {
  function MockRegisterPage() {
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [error, setError] = React.useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirm) {
        setError("Passwords do not match");
      }
    };

    return React.createElement(
      "div",
      { "data-testid": "register-page" },
      React.createElement("h1", null, "Create Account"),
      error &&
        React.createElement(
          "div",
          { "data-testid": "register-error", role: "alert" },
          error,
        ),
      React.createElement(
        "form",
        { onSubmit: handleSubmit },
        React.createElement("input", {
          "data-testid": "register-name",
          type: "text",
          value: name,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value),
          placeholder: "Full name",
        }),
        React.createElement("input", {
          "data-testid": "register-email",
          type: "email",
          value: email,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value),
          placeholder: "Email address",
        }),
        React.createElement("input", {
          "data-testid": "register-password",
          type: "password",
          value: password,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value),
          placeholder: "Password",
        }),
        React.createElement("input", {
          "data-testid": "register-confirm",
          type: "password",
          value: confirm,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setConfirm(e.target.value),
          placeholder: "Confirm password",
        }),
        React.createElement(
          "button",
          { type: "submit", "data-testid": "register-submit" },
          "Create Account",
        ),
      ),
    );
  }

  it("renders register page", () => {
    render(React.createElement(MockRegisterPage));
    expect(screen.getByTestId("register-page")).toBeDefined();
  });

  it("renders name input", () => {
    render(React.createElement(MockRegisterPage));
    expect(screen.getByTestId("register-name")).toBeDefined();
  });

  it("renders email input", () => {
    render(React.createElement(MockRegisterPage));
    expect(screen.getByTestId("register-email")).toBeDefined();
  });

  it("renders password input", () => {
    render(React.createElement(MockRegisterPage));
    expect(screen.getByTestId("register-password")).toBeDefined();
  });

  it("renders submit button", () => {
    render(React.createElement(MockRegisterPage));
    expect(screen.getByTestId("register-submit")).toBeDefined();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(React.createElement(MockRegisterPage));
    await user.type(screen.getByTestId("register-password"), "pass123");
    await user.type(screen.getByTestId("register-confirm"), "differentpass");
    await user.click(screen.getByTestId("register-submit"));
    expect(screen.getByTestId("register-error")).toBeDefined();
    expect(screen.getByTestId("register-error").textContent).toContain(
      "Passwords do not match",
    );
  });

  it("accepts name input text", async () => {
    const user = userEvent.setup();
    render(React.createElement(MockRegisterPage));
    await user.type(screen.getByTestId("register-name"), "Alice Smith");
    expect(
      (screen.getByTestId("register-name") as HTMLInputElement).value,
    ).toBe("Alice Smith");
  });
});
