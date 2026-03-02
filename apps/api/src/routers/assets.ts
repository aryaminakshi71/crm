import { z } from "zod";
import type { OrgContext } from "../context";
import { orgAuthed } from "../procedures";
import { createR2ClientFromEnv } from "@crm/storage/r2";

// In-memory asset storage for demo (replace with database in production)
let mockAssets: any[] = [
  {
    id: "asset-1",
    name: "contract-draft.pdf",
    url: "https://example.com/assets/contract.pdf",
    type: "application/pdf",
    size: 1024 * 500,
    tags: ["contract", "legal"],
    createdAt: new Date().toISOString(),
    organizationId: "demo-org",
  },
  {
    id: "asset-2",
    name: "office-photo.jpg",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c",
    type: "image/jpeg",
    size: 1024 * 1024 * 2,
    tags: ["office", "interior"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    organizationId: "demo-org",
  },
];

// Get R2 client (will be null if env vars not set)
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

export const assetsRouter = {
  /**
   * List assets
   */
  list: orgAuthed
    .route({
      method: "GET",
      path: "/assets",
      summary: "List assets",
      tags: ["Assets"],
    })
    .input(
      z.object({
        limit: z.number().optional().default(50),
        cursor: z.number().optional().default(0),
      }),
    )
    .output(
      z.object({
        items: z.array(z.any()),
        nextCursor: z.number().nullable(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const orgAssets = mockAssets.filter(
        (a) => a.organizationId === context.organization.id,
      );
      return {
        items: orgAssets,
        nextCursor: null,
      };
    }),

  /**
   * Create asset metadata
   */
  create: orgAuthed
    .route({
      method: "POST",
      path: "/assets",
      summary: "Create asset",
      tags: ["Assets"],
    })
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; type: string; size: number };
      }) => {
        const newAsset = {
          id: `asset-${Date.now()}`,
          ...input,
          url: "https://via.placeholder.com/300", // Mock URL
          tags: [],
          createdAt: new Date().toISOString(),
          organizationId: context.organization.id,
        };
        mockAssets.unshift(newAsset);
        return newAsset;
      },
    ),

  /**
   * Generate AI tags for an asset
   */
  generateTags: orgAuthed
    .route({
      method: "POST",
      path: "/assets/:id/tags",
      summary: "Generate AI tags",
      tags: ["Assets"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ tags: z.array(z.string()) }))
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { id: string } }) => {
        const asset = mockAssets.find(
          (a) =>
            a.id === input.id && a.organizationId === context.organization.id,
        );
        if (!asset) throw new Error("Asset not found");

        // Mock AI processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate mock tags based on asset name/type
        const newTags = [
          "ai-generated",
          asset.type.split("/")[1],
          "analyzed",
          Math.random() > 0.5 ? "priority" : "archive",
        ];

        // Update asset tags
        asset.tags = [...new Set([...asset.tags, ...newTags])];

        return { tags: asset.tags };
      },
    ),

  /**
   * Upload file directly (proxy through API to avoid CORS)
   */
  upload: orgAuthed
    .route({
      method: "POST",
      path: "/assets/upload",
      summary: "Upload file directly",
      tags: ["Assets"],
    })
    .input(z.object({ name: z.string(), type: z.string(), content: z.string() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; type: string; content: string };
      }) => {
        const orgId = context.organization.id;
        const sanitizedFilename = input.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `${orgId}/${Date.now()}-${sanitizedFilename}`;

        // Create asset without actual file upload (demo mode)
        // In production, you'd upload to R2/S3 here
        const isImage = input.type.startsWith("image/");
        const newAsset = {
          id: `asset-${Date.now()}`,
          name: input.name,
          type: input.type,
          size: Math.floor(input.content.length * 0.75),
          url: null, // No URL for demo - will show icon
          key: key,
          tags: [],
          createdAt: new Date().toISOString(),
          organizationId: orgId,
        };
        mockAssets.unshift(newAsset);
        return newAsset;
      },
    ),

  /**
   * Get signed URL for upload (for advanced use cases)
   */
  getSignedUrl: orgAuthed
    .route({
      method: "POST",
      path: "/assets/upload-url",
      summary: "Get signed upload URL",
      tags: ["Assets"],
    })
    .input(z.object({ filename: z.string(), contentType: z.string() }))
    .output(z.object({ uploadUrl: z.string(), fileUrl: z.string(), key: z.string() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { filename: string; contentType: string };
      }) => {
        const r2 = getR2();
        const orgId = context.organization.id;
        const key = `${orgId}/${Date.now()}-${input.filename}`;

        // Generate unique key for the file
        const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueKey = `${orgId}/${Date.now()}-${sanitizedFilename}`;

        if (r2) {
          // Use R2 for signed upload URL
          const uploadUrl = await r2.getSignedUploadUrl(uniqueKey, {
            contentType: input.contentType,
            expiresIn: 3600,
          });

          // Get CDN URL or R2 public URL
          const cdnUrl = process.env.VITE_PUBLIC_CDN_URL || process.env.CDN_URL;
          const fileUrl = cdnUrl
            ? `${cdnUrl}/${uniqueKey}`
            : `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${uniqueKey}`;

          return { uploadUrl, fileUrl, key: uniqueKey };
        } else {
          // Fallback for local dev without R2 - return mock URLs
          return {
            uploadUrl: `https://fake-s3-upload.com/${uniqueKey}`,
            fileUrl: `https://fake-s3-upload.com/files/${uniqueKey}`,
            key: uniqueKey,
          };
        }
      },
    ),

  /**
   * Confirm upload - save metadata after file is uploaded
   */
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
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; type: string; size: number; key: string };
      }) => {
        const cdnUrl = process.env.VITE_PUBLIC_CDN_URL || process.env.CDN_URL;
        const fileUrl = cdnUrl
          ? `${cdnUrl}/${input.key}`
          : `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${input.key}`;

        const newAsset = {
          id: `asset-${Date.now()}`,
          name: input.name,
          type: input.type,
          size: input.size,
          url: fileUrl,
          key: input.key,
          tags: [],
          createdAt: new Date().toISOString(),
          organizationId: context.organization.id,
        };
        mockAssets.unshift(newAsset);
        return newAsset;
      },
    ),
};
