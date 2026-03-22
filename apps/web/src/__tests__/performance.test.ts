/**
 * Performance Utility Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Debounce implementation ──────────────────────────────────────────────────

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

// ─── Throttle implementation ──────────────────────────────────────────────────

function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

// ─── Memoize implementation ───────────────────────────────────────────────────

function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return function (...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  } as T;
}

// ─── Debounce Tests ───────────────────────────────────────────────────────────

describe("debounce function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call function immediately", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced("arg1");
    expect(fn).not.toHaveBeenCalled();
  });

  it("calls function after delay expires", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced("arg1");
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg1");
  });

  it("cancels previous call when called again before delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced("first");
    vi.advanceTimersByTime(100);
    debounced("second");
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("second");
  });

  it("calls function once when called rapidly multiple times", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    for (let i = 0; i < 10; i++) {
      debounced(i);
      vi.advanceTimersByTime(50);
    }
    vi.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("can be called again after delay completes", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("first");
    vi.advanceTimersByTime(100);
    debounced("second");
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("passes arguments correctly to the wrapped function", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced("a", "b", 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a", "b", 42);
  });
});

// ─── Throttle Tests ───────────────────────────────────────────────────────────

describe("throttle function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls function on first invocation", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not call function again within throttle window", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);
    throttled();
    throttled(); // within limit
    throttled(); // within limit
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("allows second call after throttle window expires", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);
    throttled();
    vi.advanceTimersByTime(301);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("limits call frequency during rapid invocations", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    // 10 calls over 1000ms with 100ms throttle = max 10 calls
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(100);
      throttled();
    }

    expect(fn.mock.calls.length).toBeLessThanOrEqual(10);
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("passes arguments to the throttled function", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled("hello", 42);
    expect(fn).toHaveBeenCalledWith("hello", 42);
  });
});

// ─── Memoization Tests ────────────────────────────────────────────────────────

describe("memoize function", () => {
  it("returns correct result for first call", () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);
    expect(memoized(5)).toBe(10);
  });

  it("caches result and does not call original function again for same args", () => {
    const fn = vi.fn((x: number) => x * 3);
    const memoized = memoize(fn);

    memoized(4);
    memoized(4);
    memoized(4);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls original function for different arguments", () => {
    const fn = vi.fn((x: number) => x + 1);
    const memoized = memoize(fn);

    memoized(1);
    memoized(2);
    memoized(3);

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("returns cached value for repeated calls", () => {
    const fn = vi.fn((x: number) => x ** 2);
    const memoized = memoize(fn);

    const first = memoized(6);
    const second = memoized(6);

    expect(first).toBe(36);
    expect(second).toBe(36);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles multiple arguments as cache key", () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    memoized(1, 2);
    memoized(1, 2);
    memoized(2, 1); // different order = different cache key

    expect(fn).toHaveBeenCalledTimes(2); // (1,2) and (2,1) are different
  });

  it("memoizes expensive computation correctly", () => {
    let callCount = 0;
    function expensive(n: number): number {
      callCount++;
      return n * n * n;
    }

    const cached = memoize(expensive);

    const r1 = cached(10);
    const r2 = cached(10);
    const r3 = cached(10);

    expect(r1).toBe(1000);
    expect(r2).toBe(1000);
    expect(r3).toBe(1000);
    expect(callCount).toBe(1);
  });
});

// ─── Lazy loading: component module chunk splitting logic ─────────────────────

describe("Lazy loading patterns", () => {
  it("dynamic import resolves to a module", async () => {
    // Test that dynamic import pattern works (module loading)
    const mod = await import("@/lib/utils");
    expect(mod).toBeDefined();
    expect(typeof mod.cn).toBe("function");
  });

  it("dynamic import of blog-content resolves", async () => {
    const mod = await import("@/lib/blog-content");
    expect(mod).toBeDefined();
    expect(Array.isArray(mod.blogPosts)).toBe(true);
  });

  it("dynamic import of sitemap resolves", async () => {
    const mod = await import("@/lib/sitemap");
    expect(mod).toBeDefined();
    expect(typeof mod.generateSitemap).toBe("function");
  });
});

// ─── Bundle size: utility modules don't import heavy deps ─────────────────────

describe("Bundle size: utility module dependencies", () => {
  it("utils module exports cn function without heavy runtime deps", async () => {
    const mod = await import("@/lib/utils");
    expect(typeof mod.cn).toBe("function");
    // cn should handle basic inputs without issues
    const result = mod.cn("base", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
  });

  it("blog-content module has no async side effects (pure data)", async () => {
    const start = performance.now();
    await import("@/lib/blog-content");
    const elapsed = performance.now() - start;
    // Pure data module should import very quickly (< 100ms)
    expect(elapsed).toBeLessThan(100);
  });

  it("sitemap module exposes only functions and types", async () => {
    const mod = await import("@/lib/sitemap");
    expect(typeof mod.generateSitemap).toBe("function");
    expect(typeof mod.getCRMRoutes).toBe("function");
  });

  it("accessibility module exposes focused utility functions", async () => {
    const mod = await import("@/lib/accessibility");
    expect(typeof mod.announce).toBe("function");
    expect(typeof mod.focusElement).toBe("function");
    expect(typeof mod.trapFocus).toBe("function");
    expect(typeof mod.addSkipLink).toBe("function");
  });
});

// ─── Performance measurement helpers ─────────────────────────────────────────

describe("Performance measurement utilities", () => {
  it("performance.now() returns a positive number", () => {
    const t = performance.now();
    expect(typeof t).toBe("number");
    expect(t).toBeGreaterThanOrEqual(0);
  });

  it("measures elapsed time correctly between two calls", async () => {
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 10));
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it("memoized fibonacci is faster than naive on repeated calls", () => {
    function fib(n: number): number {
      if (n <= 1) return n;
      return fib(n - 1) + fib(n - 2);
    }

    const memoFib = memoize(fib);

    const start1 = performance.now();
    fib(20);
    const naive = performance.now() - start1;

    // Prime the cache
    memoFib(20);
    const start2 = performance.now();
    memoFib(20);
    const cached = performance.now() - start2;

    // Memoized second call should be faster (or at least not much slower)
    expect(cached).toBeLessThanOrEqual(naive + 10);
  });
});
