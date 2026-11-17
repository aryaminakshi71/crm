/**
 * Input Validation Middleware
 *
 * Sanitizes and validates incoming request inputs.
 */

type Request = any;
type Response = any;
type NextFunction = any;

/**
 * Maximum input length for string fields
 */
const MAX_STRING_LENGTH = 10000;

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Limit string length
    return obj.slice(0, MAX_STRING_LENGTH);
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Remove keys that start with $ (Mongo-style injection attempts)
      if (key.startsWith("$")) {
        continue;
      }
      // Remove keys that contain dots (prototype pollution attempts)
      if (key.includes("__") || key.includes(".")) {
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  try {
    // Sanitize body
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body) as Record<string, unknown>;
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query) as Record<string, unknown>;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validate required headers
 */
export function requireHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Could add required headers validation here
  next();
}
