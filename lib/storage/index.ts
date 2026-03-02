/**
 * Storage abstraction — provider-agnostic (local dev, Vultr production).
 * Switch via STORAGE_PROVIDER=local|vultr.
 */

import { LocalStorageProvider } from "./providers/local";
import { VultrStorageProvider } from "./providers/vultr";
import { generateStorageKey } from "./upload";
import type { StorageProvider } from "./types";

export { generateStorageKey };

function getProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  if (provider === "vultr") return new VultrStorageProvider();
  return new LocalStorageProvider();
}

const _provider = () => getProvider();

/** True when using Vultr Object Storage (production). */
export function isStorageConfigured(): boolean {
  return (
    process.env.STORAGE_PROVIDER === "vultr" &&
    !!process.env.VULTR_STORAGE_ACCESS_KEY &&
    process.env.VULTR_STORAGE_ACCESS_KEY !== "placeholder"
  );
}

export async function storeFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  return _provider().upload(key, body, contentType);
}

export async function getFileUrl(key: string): Promise<string> {
  return _provider().getSignedUrl(key, 3600);
}

export async function getFileBuffer(key: string): Promise<Buffer | null> {
  return _provider().getFileBuffer(key);
}

/** Signed URL with custom expiry (e.g. 420 for 7 min, 604800 for 7 days). */
export async function getSignedDownloadUrlWithExpiry(
  key: string,
  expiresInSeconds: number
): Promise<string> {
  return _provider().getSignedUrl(key, expiresInSeconds);
}

/** Legacy alias — same as getSignedDownloadUrlWithExpiry(key, 3600). */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  return _provider().getSignedUrl(key, expiresInSeconds);
}

export async function removeFile(key: string): Promise<void> {
  return _provider().delete(key);
}
