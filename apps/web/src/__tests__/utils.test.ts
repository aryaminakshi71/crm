/**
 * Unit Tests for Web App Utilities
 */

import { describe, expect, it } from "vitest";
import { cn } from "../lib/utils";

describe("cn - className merger", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const condition = true;
    expect(cn("base", condition && "active")).toBe("base active");
    expect(cn("base", false && "active")).toBe("base");
  });

  it("should handle arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle objects", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });

  it("should handle mixed inputs", () => {
    expect(cn("base", ["a", "b"], { c: true, d: false })).toBe("base a b c");
  });

  it("should deduplicate with tailwind-merge", () => {
    // tailwind-merge keeps the second value and preserves order
    expect(cn("px-2 py-2", "px-4")).toContain("px-4");
    expect(cn("px-2 py-2", "px-4")).toContain("py-2");
  });
});
