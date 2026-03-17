/**
 * Unit Tests for API Error Handling
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import {
  ErrorCode,
  APIError,
  RateLimitError,
  Errors,
  formatErrorResponse,
  isRetryableError,
  parseApiError,
} from "../errors";

describe("APIError", () => {
  it("should create error with code, message, and status", () => {
    const error = new APIError(ErrorCode.BAD_REQUEST, "Invalid input", 400);

    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(error.message).toBe("Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe("APIError");
  });

  it("should include details when provided", () => {
    const error = new APIError(ErrorCode.VALIDATION_ERROR, "Validation failed", 400, { field: "email" });

    expect(error.details).toEqual({ field: "email" });
  });

  it("should have correct prototype chain", () => {
    const error = new APIError(ErrorCode.NOT_FOUND, "Not found", 404);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof APIError).toBe(true);
  });
});

describe("RateLimitError", () => {
  it("should create rate limit error with retry info", () => {
    const error = new RateLimitError("Too many requests", 60);

    expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
    expect(error.details).toEqual({ retryAfter: 60 });
  });
});

describe("Errors Factory", () => {
  describe("badRequest", () => {
    it("should create 400 error", () => {
      const error = Errors.badRequest();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("should use custom message", () => {
      const error = Errors.badRequest("Custom message");
      expect(error.message).toBe("Custom message");
    });
  });

  describe("validation", () => {
    it("should create validation error from ZodError", () => {
      const zodError = new ZodError([
        { code: "invalid_type", path: ["email"], message: "Invalid email" }
      ]);
      const error = Errors.validation(zodError);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.details).toBeDefined();
    });
  });

  describe("unauthorized", () => {
    it("should create 401 error", () => {
      const error = Errors.unauthorized();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    });
  });

  describe("forbidden", () => {
    it("should create 403 error", () => {
      const error = Errors.forbidden();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
    });
  });

  describe("notFound", () => {
    it("should create 404 error with resource name", () => {
      const error = Errors.notFound("Contact");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Contact not found");
    });
  });

  describe("conflict", () => {
    it("should create 409 error", () => {
      const error = Errors.conflict("Email already exists");
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe(ErrorCode.CONFLICT);
    });
  });

  describe("database", () => {
    it("should create 500 error with operation name", () => {
      const error = Errors.database("insert");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.message).toContain("insert");
    });
  });

  describe("server", () => {
    it("should create generic 500 error", () => {
      const error = Errors.server();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.SERVER_ERROR);
    });
  });

  describe("rateLimited", () => {
    it("should create 429 error without retry info", () => {
      const error = Errors.rateLimited();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    });

    it("should include retryAfter when provided", () => {
      const error = Errors.rateLimited("Too many", 30);
      expect(error.details).toEqual({ retryAfter: 30 });
    });
  });
});

describe("formatErrorResponse", () => {
  it("should format APIError as JSON response", () => {
    const error = Errors.notFound("Contact");
    const response = formatErrorResponse(error);

    expect(response.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(response.error.message).toBe("Contact not found");
  });

  it("should include details when present", () => {
    const error = new APIError(ErrorCode.VALIDATION_ERROR, "Invalid", 400, { field: "name" });
    const response = formatErrorResponse(error);

    expect(response.error.details).toEqual({ field: "name" });
  });

  it("should exclude details when undefined", () => {
    const error = new APIError(ErrorCode.BAD_REQUEST, "Bad", 400);
    const response = formatErrorResponse(error);

    expect(response.error.details).toBeUndefined();
  });
});

describe("isRetryableError", () => {
  it("should return true for 5xx errors", () => {
    const error500 = new APIError(ErrorCode.SERVER_ERROR, "Error", 500);
    const error502 = new APIError(ErrorCode.SERVER_ERROR, "Error", 502);
    const error503 = new APIError(ErrorCode.SERVER_ERROR, "Error", 503);

    expect(isRetryableError(error500)).toBe(true);
    expect(isRetryableError(error502)).toBe(true);
    expect(isRetryableError(error503)).toBe(true);
  });

  it("should return false for 4xx errors", () => {
    const error400 = Errors.badRequest();
    const error401 = Errors.unauthorized();
    const error404 = Errors.notFound("Test");

    expect(isRetryableError(error400)).toBe(false);
    expect(isRetryableError(error401)).toBe(false);
    expect(isRetryableError(error404)).toBe(false);
  });

  it("should return false for non-APIError", () => {
    expect(isRetryableError(new Error("Regular error"))).toBe(false);
    expect(isRetryableError("string error")).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});

describe("parseApiError", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should parse 400 error", () => {
    const response = new Response(null, { status: 400 });
    const error = parseApiError(response, { message: "Invalid" });

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it("should parse 401 error", () => {
    const response = new Response(null, { status: 401 });
    const error = parseApiError(response);

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it("should parse 404 error", () => {
    const response = new Response(null, { status: 404 });
    const error = parseApiError(response, { message: "Not found" });

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("should parse 429 error", () => {
    const response = new Response(null, { status: 429 });
    const error = parseApiError(response);

    expect(error.statusCode).toBe(429);
    expect(error.code).toBe(ErrorCode.RATE_LIMITED);
  });

  it("should parse 5xx errors as server errors", () => {
    const response500 = new Response(null, { status: 500 });
    const response502 = new Response(null, { status: 502 });

    expect(parseApiError(response500).statusCode).toBe(500);
    expect(parseApiError(response502).statusCode).toBe(500);
  });
});
