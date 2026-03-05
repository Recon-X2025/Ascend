/**
 * Typesense client for Phase 5 job search.
 * Development (localhost): uses localhost:8108
 * Production: uses TYPESENSE_HOST, TYPESENSE_PORT, TYPESENSE_PROTOCOL, TYPESENSE_API_KEY
 */

import Typesense from "typesense";

const isDev = process.env.NODE_ENV === "development";
const host = isDev ? "localhost" : (process.env.TYPESENSE_HOST || "localhost");
const port = isDev ? 8108 : Number(process.env.TYPESENSE_PORT) || 8108;
const protocol = isDev ? "http" : (process.env.TYPESENSE_PROTOCOL || "http") as "http" | "https";
/* Local Typesense (docker-compose) uses api-key=xyz; .env.local may override with prod key */
const apiKey = isDev ? "xyz" : (process.env.TYPESENSE_API_KEY || "xyz");

export const typesenseClient = new Typesense.Client({
  nodes: [{ host, port, protocol }],
  apiKey,
  connectionTimeoutSeconds: 10,
});

/** Returns connection string for logging (e.g. "localhost:8108"). */
export function getTypesenseConnectionString(): string {
  return `${host}:${port}`;
}
