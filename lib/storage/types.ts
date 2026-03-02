/**
 * Storage abstraction — provider-agnostic interface.
 * Supports local (dev) and Vultr Object Storage (production).
 */

export interface StorageProvider {
  upload(key: string, buffer: Buffer, contentType?: string): Promise<string>;
  getSignedUrl(key: string, expirySeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  getFileBuffer(key: string): Promise<Buffer | null>;
}
