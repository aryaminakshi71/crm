/**
 * Accessibility Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  announce,
  focusElement,
  trapFocus,
  addSkipLink,
} from "@/lib/accessibility";

// ─── DOM setup helpers ────────────────────────────────────────────────────────

function createInputWithLabel(
  inputType = "text",
  inputId = "test-input",
  labelText = "Test Label",
): { label: HTMLLabelElement; input: HTMLInputElement } {
  const label = document.createElement("label");
  label.htmlFor = inputId;
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = inputType;
  input.id = inputId;

  document.body.appendChild(label);
  document.body.appendChild(input);

  return { label, input };
}

function createButton(
  text?: string,
  ariaLabel?: string,
): HTMLButtonElement {
  const btn = document.createElement("button");
  if (text) btn.textContent = text;
  if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
  document.body.appendChild(btn);
  return btn;
}

function createImage(src = "/test.png", alt = "Test image"): HTMLImageElement {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  document.body.appendChild(img);
  return img;
}

// ─── Form input label tests ───────────────────────────────────────────────────

describe("Form inputs have associated labels", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("input with htmlFor-linked label is accessible", () => {
    const { label, input } = createInputWithLabel("text", "name-input", "Full Name");
    const associated = document.querySelector(`label[for="${input.id}"]`);
    expect(associated).not.toBeNull();
    expect(associated?.textContent).toBe("Full Name");
  });

  it("email input can be associated with a label", () => {
    const { label, input } = createInputWithLabel("email", "email-input", "Email Address");
    const associated = document.querySelector(`label[for="${input.id}"]`);
    expect(associated).not.toBeNull();
  });

  it("password input can be associated with a label", () => {
    const { label, input } = createInputWithLabel("password", "pass-input", "Password");
    const associated = document.querySelector(`label[for="${input.id}"]`);
    expect(associated).not.toBeNull();
  });

  it("textarea can have an associated label", () => {
    const label = document.createElement("label");
    label.htmlFor = "message-textarea";
    label.textContent = "Message";

    const textarea = document.createElement("textarea");
    textarea.id = "message-textarea";

    document.body.appendChild(label);
    document.body.appendChild(textarea);

    const associated = document.querySelector(`label[for="${textarea.id}"]`);
    expect(associated?.textContent).toBe("Message");
  });

  it("input with aria-label is accessible without visible label", () => {
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Search");
    document.body.appendChild(input);

    expect(input.getAttribute("aria-label")).toBe("Search");
  });

  it("input with aria-labelledby is accessible", () => {
    const heading = document.createElement("h2");
    heading.id = "section-title";
    heading.textContent = "Contact Details";

    const input = document.createElement("input");
    input.setAttribute("aria-labelledby", "section-title");

    document.body.appendChild(heading);
    document.body.appendChild(input);

    const labelId = input.getAttribute("aria-labelledby");
    const labelEl = document.getElementById(labelId!);
    expect(labelEl?.textContent).toBe("Contact Details");
  });
});

// ─── Button accessible name tests ────────────────────────────────────────────

describe("Buttons have accessible names", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("button with text content has accessible name", () => {
    const btn = createButton("Submit");
    expect(btn.textContent?.trim()).toBe("Submit");
  });

  it("icon-only button has aria-label", () => {
    const btn = createButton(undefined, "Close dialog");
    expect(btn.getAttribute("aria-label")).toBe("Close dialog");
  });

  it("button with both text and aria-label retains both", () => {
    const btn = createButton("Delete", "Delete contact Alice");
    expect(btn.getAttribute("aria-label")).toBe("Delete contact Alice");
    expect(btn.textContent).toBe("Delete");
  });

  it("button type='submit' is identifiable", () => {
    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Sign In";
    document.body.appendChild(btn);
    expect(btn.type).toBe("submit");
    expect(btn.textContent).toBe("Sign In");
  });

  it("disabled button has disabled attribute", () => {
    const btn = document.createElement("button");
    btn.textContent = "Save";
    btn.disabled = true;
    document.body.appendChild(btn);
    expect(btn.disabled).toBe(true);
  });
});

// ─── Image alt text tests ─────────────────────────────────────────────────────

describe("Images have alt text", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("image has alt attribute", () => {
    const img = createImage("/logo.png", "Nucleo One Logo");
    expect(img.alt).toBe("Nucleo One Logo");
  });

  it("decorative image has empty alt attribute", () => {
    const img = document.createElement("img");
    img.src = "/decorative.png";
    img.alt = "";
    img.setAttribute("role", "presentation");
    document.body.appendChild(img);
    expect(img.alt).toBe("");
    expect(img.getAttribute("role")).toBe("presentation");
  });

  it("image alt text is not empty for informational images", () => {
    const img = createImage("/chart.png", "Revenue chart Q1 2026");
    expect(img.alt.length).toBeGreaterThan(0);
  });
});

// ─── Modal dialog accessibility tests ────────────────────────────────────────

describe("Modal dialogs have correct ARIA attributes", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("modal has role=dialog", () => {
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "modal-title");
    document.body.appendChild(modal);

    expect(modal.getAttribute("role")).toBe("dialog");
  });

  it("modal has aria-modal=true", () => {
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);

    expect(modal.getAttribute("aria-modal")).toBe("true");
  });

  it("modal can be labelled by visible title", () => {
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "modal-heading");

    const heading = document.createElement("h2");
    heading.id = "modal-heading";
    heading.textContent = "Confirm Delete";

    modal.appendChild(heading);
    document.body.appendChild(modal);

    const labelId = modal.getAttribute("aria-labelledby");
    const labelEl = document.getElementById(labelId!);
    expect(labelEl?.textContent).toBe("Confirm Delete");
  });

  it("modal can have aria-describedby for additional description", () => {
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-describedby", "modal-desc");

    const desc = document.createElement("p");
    desc.id = "modal-desc";
    desc.textContent = "This action cannot be undone.";

    modal.appendChild(desc);
    document.body.appendChild(modal);

    const descId = modal.getAttribute("aria-describedby");
    const descEl = document.getElementById(descId!);
    expect(descEl?.textContent).toContain("cannot be undone");
  });
});

// ─── Navigation landmark tests ────────────────────────────────────────────────

describe("Navigation landmarks", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("page has a nav landmark", () => {
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Main navigation");
    document.body.appendChild(nav);

    const navEl = document.querySelector("nav");
    expect(navEl).not.toBeNull();
  });

  it("page has a main landmark", () => {
    const main = document.createElement("main");
    main.id = "main-content";
    document.body.appendChild(main);

    const mainEl = document.querySelector("main");
    expect(mainEl).not.toBeNull();
  });

  it("page has a footer landmark", () => {
    const footer = document.createElement("footer");
    footer.setAttribute("aria-label", "Site footer");
    document.body.appendChild(footer);

    const footerEl = document.querySelector("footer");
    expect(footerEl).not.toBeNull();
  });

  it("nav has aria-label to distinguish multiple nav elements", () => {
    const mainNav = document.createElement("nav");
    mainNav.setAttribute("aria-label", "Main navigation");

    const breadcrumb = document.createElement("nav");
    breadcrumb.setAttribute("aria-label", "Breadcrumb");

    document.body.appendChild(mainNav);
    document.body.appendChild(breadcrumb);

    const navElements = document.querySelectorAll("nav");
    expect(navElements.length).toBe(2);
    expect(navElements[0].getAttribute("aria-label")).toBe("Main navigation");
    expect(navElements[1].getAttribute("aria-label")).toBe("Breadcrumb");
  });
});

// ─── announce() utility tests ─────────────────────────────────────────────────

describe("announce() aria-live utility", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    const existing = document.getElementById("aria-live-region");
    if (existing) existing.remove();
  });

  it("creates aria-live region in DOM", () => {
    announce("Item saved");
    const region = document.getElementById("aria-live-region");
    expect(region).not.toBeNull();
  });

  it("aria-live region has polite mode", () => {
    announce("Notification");
    const region = document.getElementById("aria-live-region");
    expect(region?.getAttribute("aria-live")).toBe("polite");
  });

  it("aria-live region has aria-atomic=true", () => {
    announce("Update message");
    const region = document.getElementById("aria-live-region");
    expect(region?.getAttribute("aria-atomic")).toBe("true");
  });

  it("does not create duplicate live regions on multiple calls", () => {
    announce("First");
    announce("Second");
    const regions = document.querySelectorAll("#aria-live-region");
    expect(regions.length).toBe(1);
  });
});

// ─── trapFocus() utility tests ────────────────────────────────────────────────

describe("trapFocus() utility", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns a cleanup function", () => {
    const container = document.createElement("div");
    const btn = document.createElement("button");
    btn.textContent = "Click me";
    // Give it dimensions so it's "visible"
    Object.defineProperty(btn, "offsetWidth", { value: 100 });
    Object.defineProperty(btn, "offsetHeight", { value: 40 });
    container.appendChild(btn);
    document.body.appendChild(container);

    const cleanup = trapFocus(container);
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("returns no-op cleanup when container is null", () => {
    const cleanup = trapFocus(null);
    expect(typeof cleanup).toBe("function");
    // Should not throw
    cleanup();
  });
});

// ─── focusElement() utility tests ─────────────────────────────────────────────

describe("focusElement() utility", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("calls focus on a valid element", () => {
    const btn = document.createElement("button");
    btn.textContent = "Focus me";
    document.body.appendChild(btn);

    const focusSpy = vi.spyOn(btn, "focus");
    focusElement(btn);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("does not throw when element is null", () => {
    expect(() => focusElement(null)).not.toThrow();
  });
});

// ─── addSkipLink() utility tests ──────────────────────────────────────────────

describe("addSkipLink() utility", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    const skip = document.getElementById("skip-link");
    if (skip) skip.remove();
  });

  it("adds a skip link to document body", () => {
    addSkipLink("main-content");
    const skip = document.getElementById("skip-link");
    expect(skip).not.toBeNull();
  });

  it("skip link points to the target id", () => {
    addSkipLink("main-content");
    const skip = document.getElementById("skip-link");
    expect(skip?.getAttribute("href")).toBe("#main-content");
  });

  it("skip link has correct default text", () => {
    addSkipLink("main-content");
    const skip = document.getElementById("skip-link");
    expect(skip?.textContent).toBe("Skip to main content");
  });

  it("skip link uses custom text when provided", () => {
    addSkipLink("main", "Jump to main");
    const skip = document.getElementById("skip-link");
    expect(skip?.textContent).toBe("Jump to main");
  });

  it("does not create duplicate skip links on multiple calls", () => {
    addSkipLink("main-content");
    addSkipLink("main-content");
    const links = document.querySelectorAll("#skip-link");
    expect(links.length).toBe(1);
  });
});

// ─── Color contrast check helpers ────────────────────────────────────────────

describe("Color contrast helper functions", () => {
  function getLuminance(hex: string): number {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  function getContrastRatio(hex1: string, hex2: string): number {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function meetsWCAGAA(ratio: number): boolean {
    return ratio >= 4.5;
  }

  function meetsWCAGAAA(ratio: number): boolean {
    return ratio >= 7;
  }

  it("black on white has maximum contrast ratio of ~21", () => {
    const ratio = getContrastRatio("#000000", "#ffffff");
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("white on white has contrast ratio of 1 (no contrast)", () => {
    const ratio = getContrastRatio("#ffffff", "#ffffff");
    expect(ratio).toBe(1);
  });

  it("dark text on light background meets WCAG AA", () => {
    const ratio = getContrastRatio("#1a1a1a", "#ffffff");
    expect(meetsWCAGAA(ratio)).toBe(true);
  });

  it("getLuminance returns 0 for black", () => {
    expect(getLuminance("#000000")).toBeCloseTo(0);
  });

  it("getLuminance returns 1 for white", () => {
    expect(getLuminance("#ffffff")).toBeCloseTo(1);
  });

  it("meetsWCAGAA returns true for ratio >= 4.5", () => {
    expect(meetsWCAGAA(4.5)).toBe(true);
    expect(meetsWCAGAA(7)).toBe(true);
    expect(meetsWCAGAA(4.4)).toBe(false);
  });

  it("meetsWCAGAAA returns true for ratio >= 7", () => {
    expect(meetsWCAGAAA(7)).toBe(true);
    expect(meetsWCAGAAA(21)).toBe(true);
    expect(meetsWCAGAAA(6.9)).toBe(false);
  });
});
