import { createR2ClientFromEnv } from "@crm/storage/r2";
import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

function getR2() {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return null;
    }

    return createR2ClientFromEnv();
  } catch {
    return null;
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9.-]/g, "_");
}

function buildStorageKey(orgId: string, filename: string) {
  return `${orgId}/${Date.now()}-${sanitizeFilename(filename)}`;
}

function buildFileUrl(key: string) {
  const cdnUrl = process.env.VITE_PUBLIC_CDN_URL || process.env.CDN_URL;
  if (cdnUrl) {
    return `${cdnUrl}/${key}`;
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  if (accountId && bucketName) {
    return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;
  }

  return null;
}

function generateAssetTags(
  name: string,
  mimeType: string,
  existing: string[] = [],
) {
  const normalized = new Set(
    existing.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
  );

  const extension = name.split(".").pop()?.toLowerCase();
  const [category, subtypeRaw = ""] = mimeType.toLowerCase().split("/");
  const subtype = subtypeRaw.split(";")[0];

  if (category) normalized.add(category);
  if (subtype) normalized.add(subtype);
  if (extension && extension !== subtype) normalized.add(extension);

  const keywordBase = name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2);

  for (const token of keywordBase) {
    normalized.add(token);
    if (normalized.size >= 10) break;
  }

  if (category === "image") normalized.add("visual");
  if (mimeType.includes("pdf")) normalized.add("document");
  if (mimeType.includes("spreadsheet") || extension === "csv") {
    normalized.add("data");
  }

  return Array.from(normalized).slice(0, 10);
}

function mapAsset(
  row: typeof schema.digitalAssets.$inferSelect,
  tags: string[] = [],
  urlOverride: string | null = null,
) {
  return {
    id: row.id,
    name: row.name,
    type: row.mimeType,
    mimeType: row.mimeType,
    size: row.size,
    storageKey: row.storageKey,
    url: urlOverride ?? buildFileUrl(row.storageKey),
    tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function resolveCreatedBy(orgId: string, userId: string | undefined) {
  if (!userId) return null;
  if (orgId === "demo-org" || userId.startsWith("demo-")) return null;
  return userId;
}

export const assetsRouter = {
  list: orgAuthed
    .route({
      method: "GET",
      path: "/assets",
      summary: "List assets",
      tags: ["Assets"],
    })
    .input(
      z.object({
        limit: z.number().min(1).max(200).optional().default(50),
        cursor: z.number().min(0).optional().default(0),
        search: z.string().optional(),
      }),
    )
    .output(
      z.object({
        items: z.array(z.any()),
        nextCursor: z.number().nullable(),
      }),
    )
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const where = input.search
        ? and(
            eq(schema.digitalAssets.organizationId, context.organization.id),
            ilike(schema.digitalAssets.name, `%${input.search}%`),
          )
        : eq(schema.digitalAssets.organizationId, context.organization.id);

      const rows = await db
        .select()
        .from(schema.digitalAssets)
        .where(where)
        .orderBy(desc(schema.digitalAssets.createdAt))
        .limit(input.limit + 1)
        .offset(input.cursor);

      const hasMore = rows.length > input.limit;
      const pageRows: Array<typeof schema.digitalAssets.$inferSelect> = hasMore
        ? rows.slice(0, input.limit)
        : rows;
      const assetIds = pageRows.map(
        (asset: typeof schema.digitalAssets.$inferSelect) => asset.id,
      );

      const tagsByAsset = new Map<string, string[]>();
      if (assetIds.length > 0) {
        const tagRows = await db
          .select({
            assetId: schema.digitalAssetTags.assetId,
            name: schema.assetTags.name,
          })
          .from(schema.digitalAssetTags)
          .innerJoin(
            schema.assetTags,
            eq(schema.assetTags.id, schema.digitalAssetTags.tagId),
          )
          .where(inArray(schema.digitalAssetTags.assetId, assetIds));

        for (const tag of tagRows) {
          const current = tagsByAsset.get(tag.assetId) || [];
          current.push(tag.name);
          tagsByAsset.set(tag.assetId, current);
        }
      }

      return {
        items: pageRows.map((asset: typeof schema.digitalAssets.$inferSelect) =>
          mapAsset(asset, tagsByAsset.get(asset.id) || []),
        ),
        nextCursor: hasMore ? input.cursor + input.limit : null,
      };
    }),

  create: orgAuthed
    .route({
      method: "POST",
      path: "/assets",
      summary: "Create asset",
      tags: ["Assets"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        size: z.number().nonnegative(),
        storageKey: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;
      const key = input.storageKey || buildStorageKey(orgId, input.name);

      const [asset] = await db
        .insert(schema.digitalAssets)
        .values({
          organizationId: orgId,
          name: input.name,
          mimeType: input.type,
          size: input.size,
          storageKey: key,
          createdBy: resolveCreatedBy(orgId, context.user.id),
        })
        .returning();

      return mapAsset(asset, []);
    }),

  generateTags: orgAuthed
    .route({
      method: "POST",
      path: "/assets/:id/tags",
      summary: "Generate AI tags",
      tags: ["Assets"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ tags: z.array(z.string()) }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [asset] = await db
        .select()
        .from(schema.digitalAssets)
        .where(
          and(
            eq(schema.digitalAssets.id, input.id),
            eq(schema.digitalAssets.organizationId, orgId),
          ),
        )
        .limit(1);

      if (!asset) {
        throw new APIError(ErrorCode.NOT_FOUND, "Asset not found", 404);
      }

      const existingTagRows = (await db
        .select({
          tagId: schema.assetTags.id,
          name: schema.assetTags.name,
        })
        .from(schema.digitalAssetTags)
        .innerJoin(
          schema.assetTags,
          eq(schema.assetTags.id, schema.digitalAssetTags.tagId),
        )
        .where(eq(schema.digitalAssetTags.assetId, asset.id))) as Array<{
        tagId: string;
        name: string;
      }>;

      const existingTagNames = existingTagRows.map(
        (row: { name: string }) => row.name,
      );
      const nextTags = generateAssetTags(
        asset.name,
        asset.mimeType,
        existingTagNames,
      );

      const existingTagRecords: Array<typeof schema.assetTags.$inferSelect> =
        nextTags.length > 0
          ? await db
              .select()
              .from(schema.assetTags)
              .where(
                and(
                  eq(schema.assetTags.organizationId, orgId),
                  inArray(schema.assetTags.name, nextTags),
                ),
              )
          : [];

      const existingNameSet = new Set(
        existingTagRecords.map(
          (tag: typeof schema.assetTags.$inferSelect) => tag.name,
        ),
      );
      const missingNames = nextTags.filter((tag) => !existingNameSet.has(tag));

      const insertedTags: Array<typeof schema.assetTags.$inferSelect> =
        missingNames.length > 0
          ? await db
              .insert(schema.assetTags)
              .values(
                missingNames.map((name) => ({
                  organizationId: orgId,
                  name,
                })),
              )
              .returning()
          : [];

      const allTags = [...existingTagRecords, ...insertedTags];
      const existingLinkTagIds = new Set(
        existingTagRows.map((row: { tagId: string }) => row.tagId),
      );
      const missingLinkTagIds = allTags
        .map((tag) => tag.id)
        .filter((tagId) => !existingLinkTagIds.has(tagId));

      if (missingLinkTagIds.length > 0) {
        await db.insert(schema.digitalAssetTags).values(
          missingLinkTagIds.map((tagId) => ({
            assetId: asset.id,
            tagId,
            isAiGenerated: 1,
          })),
        );
      }

      return { tags: nextTags };
    }),

  upload: orgAuthed
    .route({
      method: "POST",
      path: "/assets/upload",
      summary: "Upload file directly",
      tags: ["Assets"],
    })
    .input(
      z.object({ name: z.string(), type: z.string(), content: z.string() }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;
      const key = buildStorageKey(orgId, input.name);
      const fileData = Buffer.from(input.content, "base64");
      const r2 = getR2();
      if (!r2) {
        throw new APIError(ErrorCode.SERVER_ERROR, "R2 storage is not configured", 500);
      }
      await r2.put(key, fileData, { contentType: input.type });

      const [asset] = await db
        .insert(schema.digitalAssets)
        .values({
          organizationId: orgId,
          name: input.name,
          mimeType: input.type,
          size: fileData.length,
          storageKey: key,
          createdBy: resolveCreatedBy(orgId, context.user.id),
        })
        .returning();

      return mapAsset(asset, []);
    }),

  getSignedUrl: orgAuthed
    .route({
      method: "POST",
      path: "/assets/upload-url",
      summary: "Get signed upload URL",
      tags: ["Assets"],
    })
    .input(z.object({ filename: z.string(), contentType: z.string() }))
    .output(
      z.object({ uploadUrl: z.string(), fileUrl: z.string(), key: z.string() }),
    )
    .handler(async ({ context, input }) => {
      const r2 = getR2();
      if (!r2) {
        throw new APIError(ErrorCode.SERVER_ERROR, "R2 storage is not configured", 500);
      }
      const orgId = context.organization.id;
      const key = buildStorageKey(orgId, input.filename);

      const uploadUrl = await r2.getSignedUploadUrl(key, {
        contentType: input.contentType,
        expiresIn: 3600,
      });
      return {
        uploadUrl,
        fileUrl: buildFileUrl(key) || uploadUrl.split("?")[0],
        key,
      };
    }),

  confirmUpload: orgAuthed
    .route({
      method: "POST",
      path: "/assets/confirm",
      summary: "Confirm file upload and save metadata",
      tags: ["Assets"],
    })
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
        key: z.string(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [asset] = await db
        .insert(schema.digitalAssets)
        .values({
          organizationId: orgId,
          name: input.name,
          mimeType: input.type,
          size: input.size,
          storageKey: input.key,
          createdBy: resolveCreatedBy(orgId, context.user.id),
        })
        .returning();

      return mapAsset(asset, []);
    }),
};
