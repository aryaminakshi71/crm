/**
 * API Keys & Webhooks Router
 *
 * API key management and webhook configuration.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const { webhooks } = schema;
// apiKeysOrg is the organization-scoped API keys table from agents.schema
const apiKeysOrg = schema.apiKeys as typeof schema.apiKeys;

const apiKeySchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  permissions: z.array(z.string()),
  expiresAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
});

const webhookSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  active: z.string(),
  headers: z.record(z.string(), z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const apiKeysRouter = {
  // ─── API Keys ────────────────────────────────────────────────────────────

  listKeys: orgAuthed
    .route({
      method: "GET",
      path: "/api-keys",
      summary: "List API keys",
      tags: ["API Keys"],
    })
    .output(z.object({ data: z.array(apiKeySchema) }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const data = await db
        .select()
        .from(apiKeysOrg)
        .where(eq(apiKeysOrg.organizationId, context.organization.id))
        .orderBy(desc(apiKeysOrg.createdAt));

      // Remove sensitive data
      return {
        data: data.map((k: typeof data[number]) => ({
          ...k,
          // Don't expose keyHash
        })),
      };
    }),

  createKey: orgAuthed
    .route({
      method: "POST",
      path: "/api-keys",
      summary: "Create API key",
      tags: ["API Keys"],
    })
    .input(
      z.object({
        name: z.string(),
        permissions: z.array(z.string()).default([]),
        expiresIn: z.number().optional(), // days
      }),
    )
    .output(z.object({ id: z.string().uuid(), key: z.string(), name: z.string() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; permissions?: string[]; expiresIn?: number };
      }) => {
        const db = getDb(context);

        // Generate key
        const rawKey = `nkey_${randomBytes(32).toString("hex")}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");

        const expiresAt = input.expiresIn
          ? new Date(Date.now() + input.expiresIn * 24 * 60 * 60 * 1000)
          : null;

        const [apiKey] = await db
          .insert(apiKeysOrg)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            keyHash,
            permissions: input.permissions || [],
            expiresAt,
            createdBy: context.user.id,
          })
          .returning();

        // Return the raw key only once
        return {
          id: apiKey.id,
          key: rawKey,
          name: apiKey.name,
        };
      },
    ),

  revokeKey: orgAuthed
    .route({
      method: "DELETE",
      path: "/api-keys/:id",
      summary: "Revoke API key",
      tags: ["API Keys"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(apiKeysOrg)
          .where(
            and(
              eq(apiKeysOrg.id, input.id),
              eq(apiKeysOrg.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),

  // ─── Webhooks ────────────────────────────────────────────────────────────

  listWebhooks: orgAuthed
    .route({
      method: "GET",
      path: "/webhooks",
      summary: "List webhooks",
      tags: ["Webhooks"],
    })
    .output(z.object({ data: z.array(webhookSchema) }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const data = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.organizationId, context.organization.id))
        .orderBy(desc(webhooks.createdAt));
      return { data };
    }),

  createWebhook: orgAuthed
    .route({
      method: "POST",
      path: "/webhooks",
      summary: "Create webhook",
      tags: ["Webhooks"],
    })
    .input(
      z.object({
        name: z.string(),
        url: z.string().url(),
        events: z.array(z.string()),
        secret: z.string().optional(),
        headers: z.record(z.string(), z.string()).optional(),
      }),
    )
    .output(webhookSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          name: string;
          url: string;
          events: string[];
          secret?: string;
          headers?: Record<string, string>;
        };
      }) => {
        const db = getDb(context);
        const [webhook] = await db
          .insert(webhooks)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            url: input.url,
            events: input.events,
            secret: input.secret || null,
            headers: input.headers || {},
          })
          .returning();
        return webhook;
      },
    ),

  updateWebhook: orgAuthed
    .route({
      method: "PATCH",
      path: "/webhooks/:id",
      summary: "Update webhook",
      tags: ["Webhooks"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        active: z.boolean().optional(),
        secret: z.string().optional(),
        headers: z.record(z.string(), z.string()).optional(),
      }),
    )
    .output(webhookSchema)
    .handler(async ({ context, input }: { context: OrgContext; input: any }) => {
      const db = getDb(context);

      const [webhook] = await db
        .update(webhooks)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.url !== undefined ? { url: input.url } : {}),
          ...(input.events !== undefined ? { events: input.events } : {}),
          ...(input.active !== undefined ? { active: input.active ? "true" : "false" } : {}),
          ...(input.secret !== undefined ? { secret: input.secret } : {}),
          ...(input.headers !== undefined ? { headers: input.headers } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(eq(webhooks.id, input.id), eq(webhooks.organizationId, context.organization.id)),
        )
        .returning();

      if (!webhook) {
        throw new APIError(ErrorCode.NOT_FOUND, "Webhook not found", 404);
      }
      return webhook;
    }),

  deleteWebhook: orgAuthed
    .route({
      method: "DELETE",
      path: "/webhooks/:id",
      summary: "Delete webhook",
      tags: ["Webhooks"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(webhooks)
          .where(
            and(eq(webhooks.id, input.id), eq(webhooks.organizationId, context.organization.id)),
          );
        return { success: true };
      },
    ),

  testWebhook: orgAuthed
    .route({
      method: "POST",
      path: "/webhooks/:id/test",
      summary: "Test webhook",
      tags: ["Webhooks"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        payload: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(z.object({ success: z.boolean(), message: z.string().optional() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string; payload?: Record<string, unknown> } }) => {
        const db = getDb(context);
        const [webhook] = await db
          .select()
          .from(webhooks)
          .where(
            and(eq(webhooks.id, input.id), eq(webhooks.organizationId, context.organization.id)),
          )
          .limit(1);

        if (!webhook) {
          throw new APIError(ErrorCode.NOT_FOUND, "Webhook not found", 404);
        }

        // Simulate webhook delivery
        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...webhook.headers,
              "X-Webhook-Secret": webhook.secret || "",
            },
            body: JSON.stringify({
              event: "test",
              timestamp: new Date().toISOString(),
              data: input.payload || {},
            }),
          });

          return {
            success: response.ok,
            message: response.ok ? "Webhook delivered successfully" : `Delivery failed: ${response.status}`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Delivery failed: ${String(error)}`,
          };
        }
      },
    ),
};
