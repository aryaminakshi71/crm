import { nanoid } from "nanoid";

/**
 * Generate a unique ID
 * Uses nanoid for URL-safe, unique IDs
 */
export function createId(): string {
  return nanoid();
}
