/**
 * Contacts Router
 *
 * Contact management operations.
 */

import { getOrCache, invalidateCache } from "@crm/storage/redis";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { trackQuery } from "../lib/db-performance";
import { getDb, orgAuthed, schema } from "../procedures";

const { contacts } = schema;

// Create a Zod schema from the contacts table columns
const contactSchema = schema.contacts ? z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  companyName: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).passthrough() : z.unknown();

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
        search: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(contactSchema),
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
      }: {
        context: OrgContext;
        input: { page: number; limit: number; search?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;
        const search = input.search?.trim();
        const whereConditions = search
          ? and(
              eq(contacts.organizationId, context.organization.id),
              or(
                ilike(contacts.firstName, `%${search}%`),
                ilike(contacts.lastName, `%${search}%`),
                ilike(contacts.email, `%${search}%`),
                ilike(contacts.companyName, `%${search}%`),
              ),
            )
          : eq(contacts.organizationId, context.organization.id);

        // Cache key for list queries
        const cacheKey = `contacts:list:${context.organization.id}:${input.page}:${input.limit}:${search || "all"}`;

        // Use cache for list queries (5 min TTL)
        return getOrCache<{
          data: any[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(
          cacheKey,
          async () => {
            // Get total count using SQL COUNT()
            const countResult = await trackQuery("listContactsCount", () =>
              db.select({ count: count() }).from(contacts).where(whereConditions),
            );
            const total = countResult[0]?.count ?? 0;

            // Get paginated results
            const paginatedContacts = (await trackQuery(
              "listContactsPaginated",
              () =>
                db
                  .select()
                  .from(contacts)
                  .where(whereConditions)
                  .orderBy(desc(contacts.createdAt))
                  .limit(input.limit)
                  .offset(offset),
            )) as any[];

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
    .output(contactSchema)
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
                .where(
                  and(
                    eq(contacts.id, input.id),
                    eq(contacts.organizationId, context.organization.id),
                  ),
                )
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
   * Update a contact
   */
  update: orgAuthed
    .route({
      method: "PATCH",
      path: "/contacts/:id",
      summary: "Update contact",
      tags: ["Contacts"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        companyName: z.string().max(255).optional(),
      }),
    )
    .output(contactSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          id: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string;
          companyName?: string;
        };
      }) => {
        const db = getDb(context);
        const [contact] = (await trackQuery("updateContact", () =>
          db
            .update(contacts)
            .set({
              ...(input.firstName !== undefined
                ? { firstName: input.firstName }
                : {}),
              ...(input.lastName !== undefined
                ? { lastName: input.lastName }
                : {}),
              ...(input.email !== undefined
                ? { email: input.email.toLowerCase() }
                : {}),
              ...(input.phone !== undefined ? { phone: input.phone } : {}),
              ...(input.companyName !== undefined
                ? { companyName: input.companyName }
                : {}),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(contacts.id, input.id),
                eq(contacts.organizationId, context.organization.id),
              ),
            )
            .returning(),
        )) as any[];

        if (!contact) {
          throw new Error("Contact not found");
        }

        await invalidateCache(`contact:${input.id}`);
        await invalidateCache(`contacts:list:${context.organization.id}`);

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
    .output(contactSchema)
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
        const created = (await trackQuery("createContact", () =>
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
        )) as any[];
        const [contact] = created;

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
          db
            .delete(contacts)
            .where(
              and(
                eq(contacts.id, input.id),
                eq(contacts.organizationId, context.organization.id),
              ),
            ),
        );

        // Invalidate caches
        await invalidateCache(`contact:${input.id}`);
        await invalidateCache(`contacts:list:${context.organization.id}`);

        return { success: true };
      },
    ),
};
