/**
 * Test Utilities for CRM App
 *
 * Shared utilities for testing oRPC routers
 */

import type { Logger } from "@crm/logger";
import type { AuthContext, InitialContext, OrgContext } from "../../context";

/**
 * Create mock logger for tests
 */
export function createMockLogger(): Logger {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    trace: () => {},
    child: () => createMockLogger(),
  };
}

/**
 * Create mock initial context
 */
export function createMockInitialContext(
  overrides: Partial<InitialContext> = {},
): InitialContext {
  return {
    env: {
      DATABASE: {
        connectionString: process.env.TEST_DATABASE_URL || "postgresql://test",
      },
      CACHE: {} as KVNamespace,
      BUCKET: {} as R2Bucket,
      BETTER_AUTH_SECRET: "test-secret",
      VITE_PUBLIC_SITE_URL: "http://localhost:3000",
      NODE_ENV: "test",
      ...overrides.env,
    },
    headers: new Headers(overrides.headers || {}),
    requestId: overrides.requestId || "test-request-id",
    logger: overrides.logger || createMockLogger(),
  };
}

/**
 * Create mock auth context
 */
export function createMockAuthContext(
  overrides: Partial<AuthContext> = {},
): AuthContext {
  const initialContext = createMockInitialContext(overrides);

  return {
    ...initialContext,
    auth: overrides.auth || ({} as any),
    user:
      overrides.user ||
      ({
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any),
    session:
      overrides.session ||
      ({
        id: "test-session-id",
        userId: "test-user-id",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        token: "test-token",
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
        activeOrganizationId: "test-org-id",
      } as any),
  };
}

/**
 * Create mock organization context
 */
export function createMockOrgContext(
  overrides: Partial<OrgContext> = {},
): OrgContext {
  const authContext = createMockAuthContext(overrides);

  return {
    ...authContext,
    organization: overrides.organization || {
      id: "test-org-id",
      name: "Test Organization",
      slug: "test-org",
      plan: "pro",
    },
    member: overrides.member || {
      id: "test-member-id",
      role: "owner" as const,
    },
  };
}

/**
 * Test data factory for contacts
 */
export async function createTestContact(
  db: any,
  context: OrgContext,
  data: {
    id?: string;
    name?: string;
    email?: string;
  } = {},
) {
  const { contacts } = await import("@crm/storage/db/schema");

  const [contact] = await db
    .insert(contacts)
    .values({
      id: data.id || crypto.randomUUID(),
      organizationId: context.organization.id,
      name: data.name || "Test Contact",
      email: data.email || `test-${Date.now()}@example.com`,
    })
    .returning();

  return contact;
}
