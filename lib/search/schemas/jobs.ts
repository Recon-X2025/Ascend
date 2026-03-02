/**
 * Typesense collection schema for jobs and ensureJobsCollection.
 */

import type { CollectionCreateSchema } from "typesense";
import { typesenseClient } from "../client";

export const JOBS_COLLECTION = "jobs";

const jobsSchema: CollectionCreateSchema = {
  name: JOBS_COLLECTION,
  fields: [
    { name: "id", type: "string" },
    { name: "title", type: "string", infix: true },
    { name: "description", type: "string" },
    { name: "companyName", type: "string", facet: true, optional: true },
    { name: "companySlug", type: "string", optional: true },
    { name: "location", type: "string[]", facet: true },
    { name: "workMode", type: "string", facet: true },
    { name: "jobType", type: "string", facet: true },
    { name: "skills", type: "string[]", facet: true },
    { name: "salaryMin", type: "int32", optional: true },
    { name: "salaryMax", type: "int32", optional: true },
    { name: "salaryVisible", type: "bool" },
    { name: "experienceMin", type: "int32", optional: true },
    { name: "experienceMax", type: "int32", optional: true },
    { name: "educationLevel", type: "string", facet: true },
    { name: "tags", type: "string[]", facet: true },
    { name: "status", type: "string", facet: true },
    { name: "easyApply", type: "bool", facet: true },
    { name: "companyRating", type: "float", optional: true },
    { name: "companyVerified", type: "bool", facet: true, optional: true },
    { name: "publishedAt", type: "int64" },
    { name: "viewCount", type: "int32" },
    { name: "applicationCount", type: "int32" },
  ],
  default_sorting_field: "publishedAt",
};

export type TypesenseJobDocument = {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  companySlug?: string;
  location: string[];
  workMode: string;
  jobType: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryVisible: boolean;
  experienceMin?: number;
  experienceMax?: number;
  educationLevel: string;
  tags: string[];
  status: string;
  easyApply: boolean;
  companyRating?: number;
  companyVerified?: boolean;
  publishedAt: number;
  viewCount: number;
  applicationCount: number;
};

export async function ensureJobsCollection(): Promise<void> {
  const client = typesenseClient;
  if (!client) return;

  try {
    const collections = await client.collections().retrieve();
    const exists = collections.some((c) => c.name === JOBS_COLLECTION);
    if (!exists) {
      await client.collections().create(jobsSchema);
    }
  } catch (err) {
    console.error("[Typesense] ensureJobsCollection error:", err);
    throw err;
  }
}
