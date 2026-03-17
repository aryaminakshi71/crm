/**
 * Test Setup for API Lib Unit Tests
 */

import { beforeEach, vi } from "vitest";

// Mock environment variables
vi.stubEnv("NODE_ENV", "test");

beforeEach(() => {
  vi.clearAllMocks();
});
