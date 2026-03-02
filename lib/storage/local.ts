import fs from "fs/promises";
import path from "path";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function saveLocalFile(
  key: string,
  body: Buffer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by adapter interface
  contentType: string
): Promise<string> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body);
  return key;
}

export async function getLocalFileUrl(key: string): Promise<string> {
  return `/api/files/${key}`;
}

export async function getLocalFileBuffer(key: string): Promise<Buffer | null> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

export async function deleteLocalFile(key: string): Promise<void> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  await fs.unlink(filePath).catch(() => {});
}
