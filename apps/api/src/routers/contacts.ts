/**
 * Contacts Router
 *
 * Contact management operations.
 */

import { getOrCache, invalidateCache } from "@crm/storage/redis";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { trackQuery } from "../lib/db-performance";
import { getDb, orgAuthed, schema } from "../procedures";

const { contacts } = schema;

export const contactsRouter = {
  /**
   * List contacts for the organization
   */
  list: orgAuthed
    .route({
      method: "GET",
      path: "/contacts",
      summary: "List contacts",
      tags: ["Contacts"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { page: number; limit: number } }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        // Cache key for list queries
        const cacheKey = `contacts:list:${context.organization.id}:${input.page}:${input.limit}`;

        // Use cache for list queries (5 min TTL)
        return getOrCache(
          cacheKey,
          async () => {
            // Get total count
            try {
              console.log(
                "Fetching contacts for organization:",
                context.organization.id,
              );
              const allContacts = await trackQuery("listContactsCount", () =>
                db
                  .select()
                  .from(contacts)
                  .where(eq(contacts.organizationId, context.organization.id)),
              );
              const total = allContacts.length;

              console.log("Contacts count:", total);

              return {
                data: [], // Temporarily removing data fetch to isolate the issue
                total,
                page: input.page,
                limit: input.limit,
                totalPages: Math.ceil(total / input.limit),
              };
            } catch (err) {
              console.error("Error fetching contacts:", err);
              throw err;
            }

            // Get paginated results
            const paginatedContacts = await trackQuery(
              "listContactsPaginated",
              () =>
                db
                  .select()
                  .from(contacts)
                  .where(eq(contacts.organizationId, context.organization.id))
                  .orderBy(desc(contacts.createdAt))
                  .limit(input.limit)
                  .offset(offset),
            );

            return {
              data: paginatedContacts,
              total,
              page: input.page,
              limit: input.limit,
              totalPages: Math.ceil(total / input.limit),
            };
          },
          300, // 5 minutes
        );
      },
    ),

  /**
   * Get a single contact
   */
  get: orgAuthed
    .route({
      method: "GET",
      path: "/contacts/:id",
      summary: "Get contact",
      tags: ["Contacts"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        // Cache contact data (1 hour TTL)
        const contact = await trackQuery("getContact", async () => {
          return await getOrCache(
            `contact:${input.id}`,
            async () => {
              const [result] = await db
                .select()
                .from(contacts)
                .where(eq(contacts.id, input.id))
                .limit(1);

              if (!result) {
                throw new Error("Contact not found");
              }

              return result;
            },
            3600, // 1 hour
          );
        });

        return contact;
      },
    ),

  /**
   * Create a new contact
   */
  create: orgAuthed
    .route({
      method: "POST",
      path: "/contacts",
      summary: "Create contact",
      tags: ["Contacts"],
    })
    .input(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        companyName: z.string().max(255).optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          firstName: string;
          lastName: string;
          email?: string;
          phone?: string;
          companyName?: string;
        };
      }) => {
        const db = getDb(context);
        const [contact] = await trackQuery("createContact", () =>
          db
            .insert(contacts)
            .values({
              firstName: input.firstName,
              lastName: input.lastName,
              email: input.email?.toLowerCase() || null,
              phone: input.phone || null,
              companyName: input.companyName || null,
              organizationId: context.organization.id,
              createdBy: context.user.id,
            })
            .returning(),
        );

        // Invalidate contacts list cache
        await invalidateCache(`contacts:list:${context.organization.id}`);

        return contact;
      },
    ),

  /**
   * Delete a contact
   */
  delete: orgAuthed
    .route({
      method: "DELETE",
      path: "/contacts/:id",
      summary: "Delete contact",
      tags: ["Contacts"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await trackQuery("deleteContact", () =>
          db.delete(contacts).where(eq(contacts.id, input.id)),
        );

        // Invalidate caches
        await invalidateCache(`contact:${input.id}`);
        await invalidateCache(`contacts:list:${context.organization.id}`);

        return { success: true };
      },
    ),
};
