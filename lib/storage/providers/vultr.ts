import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "../types";

export class VultrStorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.VULTR_STORAGE_BUCKET ?? "ascend-session-records";
    this.client = new S3Client({
      endpoint: process.env.VULTR_STORAGE_ENDPOINT ?? "https://sgp1.vultrobjects.com",
      region: process.env.VULTR_STORAGE_REGION ?? "sgp1",
      credentials: {
        accessKeyId: process.env.VULTR_STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.VULTR_STORAGE_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string = "application/pdf"
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "private",
      })
    );
    return key;
  }

  async getSignedUrl(key: string, expirySeconds: number): Promise<string> {
    return awsGetSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expirySeconds }
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }

  async getFileBuffer(key: string): Promise<Buffer | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      if (!res.Body) return null;
      const chunks: Uint8Array[] = [];
      for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }
}
