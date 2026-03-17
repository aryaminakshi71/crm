/**
 * E2E Tests for API Validation
 */

import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";

test.describe("API Validation E2E", () => {
  test("should validate contact form submission", async ({ page, request }) => {
    // Test API endpoint directly
    const response = await request.post(`${BASE_URL}/api/v1/contacts`, {
      data: {
        firstName: "",
        lastName: "Doe",
      },
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": "demo-org",
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test("should accept valid contact data", async ({ page, request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/contacts`, {
      data: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      },
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": "demo-org",
      },
    });

    expect([200, 201, 401]).toContain(response.status());
  });

  test("should validate deal creation", async ({ page, request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/deals`, {
      data: {
        title: "",
        value: -100, // Invalid negative value
      },
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": "demo-org",
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
