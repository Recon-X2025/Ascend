import { S3Client } from "@aws-sdk/client-s3";

export const storageClient = new S3Client({
  region: process.env.VULTR_STORAGE_REGION || "ewr1",
  endpoint: process.env.VULTR_STORAGE_ENDPOINT || "https://ewr1.vultrobjects.com",
  credentials: {
    accessKeyId: process.env.VULTR_STORAGE_ACCESS_KEY || "placeholder",
    secretAccessKey: process.env.VULTR_STORAGE_SECRET_KEY || "placeholder",
  },
  forcePathStyle: true,
});

export const STORAGE_BUCKET = process.env.VULTR_STORAGE_BUCKET || "ascend";
