import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

/**
 * Create R2 client using S3-compatible API
 */
export function createR2Client(config: R2Config) {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    client,
    bucketName: config.bucketName,

    /**
     * Upload a file to R2
     */
    async put(
      key: string,
      body: Buffer | Uint8Array | string | ReadableStream,
      options?: {
        contentType?: string;
        metadata?: Record<string, string>;
      },
    ) {
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
      });

      await client.send(command);
      return key;
    },

    /**
     * Get a file from R2
     */
    async get(key: string) {
      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      const response = await client.send(command);
      return response;
    },

    /**
     * Delete a file from R2
     */
    async delete(key: string) {
      const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      await client.send(command);
    },

    /**
     * Delete multiple files from R2
     */
    async deleteMany(keys: string[]) {
      await Promise.all(keys.map((key) => this.delete(key)));
    },

    /**
     * List files with a prefix
     */
    async list(prefix: string, maxKeys = 1000) {
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await client.send(command);
      return response.Contents ?? [];
    },

    /**
     * Generate a presigned URL for downloading
     */
    async getSignedDownloadUrl(key: string, expiresIn = 3600) {
      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      return getSignedUrl(client, command, { expiresIn });
    },

    /**
     * Generate a presigned URL for uploading
     */
    async getSignedUploadUrl(
      key: string,
      options?: {
        contentType?: string;
        expiresIn?: number;
      },
    ) {
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ContentType: options?.contentType,
      });

      return getSignedUrl(client, command, {
        expiresIn: options?.expiresIn ?? 3600,
      });
    },
  };
}

/**
 * Create R2 client from environment variables
 * Uses process.env for Node.js compatibility or global env for Cloudflare Workers
 */
export function createR2ClientFromEnv() {
  // Check if we're in a Cloudflare Workers environment
  const getEnvVar = (key: string): string | undefined => {
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env[key as string]
    ) {
      return process.env[key as string];
    }
    // In Cloudflare Workers, use global env (available at runtime, not during typecheck)
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as Record<string, unknown>)[key]
    ) {
      return String((globalThis as Record<string, unknown>)[key]);
    }
    return undefined;
  };

  const config: R2Config = {
    accountId: getEnvVar("CLOUDFLARE_ACCOUNT_ID") ?? "",
    accessKeyId: getEnvVar("R2_ACCESS_KEY_ID") ?? "",
    secretAccessKey: getEnvVar("R2_SECRET_ACCESS_KEY") ?? "",
    bucketName: getEnvVar("R2_BUCKET_NAME") ?? "",
  };

  return createR2Client(config);
}

export type R2Client = ReturnType<typeof createR2Client>;
