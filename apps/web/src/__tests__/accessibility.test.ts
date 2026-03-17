/**
 * Unit Tests for Accessibility Utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { announce, focusElement, trapFocus, addSkipLink } from "../lib/accessibility";

describe("announce", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    document.body.innerHTML = "";
  });

  it("should not throw in SSR context", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error - Testing SSR
    delete globalThis.window;

    expect(() => announce("Test message")).not.toThrow();

    globalThis.window = originalWindow;
  });

  it("should create live region if not exists", () => {
    announce("Test message");

    const liveRegion = document.getElementById("aria-live-region");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.getAttribute("aria-atomic")).toBe("true");
  });

  it("should update message after delay", async () => {
    vi.useFakeTimers();

    announce("Test message");

    // Initially empty
    const liveRegion = document.getElementById("aria-live-region");
    expect(liveRegion?.textContent).toBe("");

    // After delay
    vi.advanceTimersByTime(100);
    expect(liveRegion?.textContent).toBe("Test message");

    vi.useRealTimers();
  });
});

describe("focusElement", () => {
  it("should focus element if focusable", () => {
    const mockFocus = vi.fn();
    const element = { focus: mockFocus } as unknown as HTMLElement;

    focusElement(element);
    expect(mockFocus).toHaveBeenCalled();
  });

  it("should not throw for null", () => {
    expect(() => focusElement(null)).not.toThrow();
  });

  it("should not throw for element without focus method", () => {
    const element = {} as HTMLElement;
    expect(() => focusElement(element)).not.toThrow();
  });
});

describe("trapFocus", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    document.body.innerHTML = "";
  });

  it("should return cleanup function", () => {
    const cleanup = trapFocus(null);
    expect(typeof cleanup).toBe("function");
  });

  it("should not throw in SSR context", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error - Testing SSR
    delete globalThis.window;

    expect(() => trapFocus(null)).not.toThrow();

    globalThis.window = originalWindow;
  });

  it("should handle container with no focusable elements", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const cleanup = trapFocus(container);
    expect(typeof cleanup).toBe("function");
    cleanup();
  });
});

describe("addSkipLink", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    document.body.innerHTML = "";
  });

  it("should create skip link", () => {
    addSkipLink("main-content");

    const skipLink = document.getElementById("skip-link");
    expect(skipLink).not.toBeNull();
    expect(skipLink?.href).toContain("#main-content");
  });

  it("should not throw in SSR context", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error - Testing SSR
    delete globalThis.window;

    expect(() => addSkipLink("main-content")).not.toThrow();

    globalThis.window = originalWindow;
  });

  it("should use custom link text", () => {
    addSkipLink("main-content", "Skip to content");

    const skipLink = document.getElementById("skip-link");
    expect(skipLink?.textContent).toBe("Skip to content");
  });

  it("should not duplicate if already exists", () => {
    addSkipLink("main-content", "First");
    addSkipLink("main-content", "Second");

    const skipLinks = document.querySelectorAll("#skip-link");
    expect(skipLinks).toHaveLength(1);
  });
});
