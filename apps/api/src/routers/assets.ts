import { z } from "zod";
import type { OrgContext } from "../context";
import { orgAuthed } from "../procedures";

// Mock database for assets (in-memory for demo)
// In a real app, this would be a database table "assets"
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
   * Get signed URL for upload
   */
  getSignedUrl: orgAuthed
    .route({
      method: "POST",
      path: "/assets/upload-url",
      summary: "Get signed upload URL",
      tags: ["Assets"],
    })
    .input(z.object({ filename: z.string(), contentType: z.string() }))
    .output(z.object({ url: z.string(), key: z.string() }))
    .handler(
      async ({
        input,
      }: { input: { filename: string; contentType: string } }) => {
        // Return a mock upload URL
        return {
          url: `https://fake-s3-upload.com/${input.filename}`,
          key: input.filename,
        };
      },
    ),
};
