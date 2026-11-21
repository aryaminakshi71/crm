/**
 * Cursor pagination helpers.
 *
 * Keyset pagination is stable and fast at any offset: instead of
 * `OFFSET n`, the next page starts after the last row's (created_at, id).
 */

export interface Cursor {
  createdAt: string;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(raw: string | undefined | null): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Cursor;
    if (!parsed?.createdAt || !parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
