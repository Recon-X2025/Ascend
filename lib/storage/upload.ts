import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageClient, STORAGE_BUCKET } from "./client";

export async function uploadFile(
  key: string,
  body: Buffer | Blob,
  contentType: string
): Promise<string> {
  await storageClient.send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

export async function deleteFile(key: string): Promise<void> {
  await storageClient.send(
    new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    })
  );
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  return getSignedUrl(
    storageClient,
    new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

/** Get object body as Buffer (e.g. for integrity hash). Returns null if not configured or key missing. */
export async function getFileBuffer(key: string): Promise<Buffer | null> {
  try {
    const res = await storageClient.send(
      new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key })
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

export function generateStorageKey(
  folder: string,
  userId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const clean = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${folder}/${userId}/${timestamp}_${clean}`;
}

export function isStorageConfigured(): boolean {
  return !!(
    process.env.VULTR_STORAGE_ACCESS_KEY &&
    process.env.VULTR_STORAGE_ACCESS_KEY !== "placeholder"
  );
}
