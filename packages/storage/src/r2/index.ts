import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

// Polyfill DOMParser for Cloudflare Workers
// @ts-ignore
if (typeof globalThis.DOMParser === 'undefined') {
  // Simple XML parser for AWS S3 error responses
  function parseXML(str: string) {
    const codeMatch = str.match(/<Code>(.*?)<\/Code>/);
    const messageMatch = str.match(/<Message>(.*?)<\/Message>/);
    return {
      documentElement: {
        getElementsByTagName: (tag: string) => {
          if (tag === 'Error') {
            return [{
              getElementsByTagName: (subTag: string) => {
                if (subTag === 'Code') return [{ textContent: codeMatch ? codeMatch[1] : 'Unknown' }];
                if (subTag === 'Message') return [{ textContent: messageMatch ? messageMatch[1] : 'Unknown error' }];
                return [];
              }
            }];
          }
          return [];
        }
      }
    };
  }

  // @ts-ignore
  globalThis.DOMParser = class DOMParser {
    parseFromString(str: string, contentType: string) {
      return parseXML(str);
    }
  } as any;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

/**
 * Create R2 client using S3-compatible API
 * Uses custom endpoint and region for Cloudflare R2
 */
export function createR2Client(config: R2Config) {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestHandler: new FetchHttpHandler(),
    forcePathStyle: true,
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

      try {
        await client.send(command);
        return key;
      } catch (error: any) {
        // Log the error but don't crash on XML parsing issues
        console.error("R2 upload error:", error?.message || error);
        throw new Error(
          `R2 upload failed: ${error?.message || "Unknown error"}`,
        );
      }
    },

    /**
     * Get a file from R2
     */
    async get(key: string) {
      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      try {
        const response = await client.send(command);
        return response;
      } catch (error: any) {
        console.error("R2 get error:", error?.message || error);
        throw new Error(`R2 get failed: ${error?.message || "Unknown error"}`);
      }
    },

    /**
     * Delete a file from R2
     */
    async delete(key: string) {
      const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      try {
        await client.send(command);
      } catch (error: any) {
        console.error("R2 delete error:", error?.message || error);
        throw new Error(
          `R2 delete failed: ${error?.message || "Unknown error"}`,
        );
      }
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

      try {
        const response = await client.send(command);
        return response.Contents ?? [];
      } catch (error: any) {
        console.error("R2 list error:", error?.message || error);
        throw new Error(`R2 list failed: ${error?.message || "Unknown error"}`);
      }
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
