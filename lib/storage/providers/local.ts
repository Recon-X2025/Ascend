import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageProvider } from "../types";

const BASE_PATH = process.env.LOCAL_STORAGE_PATH ?? "/tmp/ascend-storage";

export class LocalStorageProvider implements StorageProvider {
  async upload(key: string, buffer: Buffer): Promise<string> {
    const fullPath = path.join(BASE_PATH, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return key;
  }

  async getSignedUrl(key: string, expirySeconds: number): Promise<string> {
    const { redis } = await import("@/lib/redis/client");
    const token = randomUUID();
    await redis.setex(`local-storage-token:${token}`, expirySeconds, key);
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return `${base.replace(/\/$/, "")}/api/storage/local/${token}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(BASE_PATH, key);
    await fs.unlink(fullPath).catch(() => {});
  }

  async getFileBuffer(key: string): Promise<Buffer | null> {
    const fullPath = path.join(BASE_PATH, key);
    try {
      return await fs.readFile(fullPath);
    } catch {
      return null;
    }
  }
}
