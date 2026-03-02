/**
 * Typesense client singleton for Phase 5 job search.
 * Config from env: TYPESENSE_HOST, TYPESENSE_PORT, TYPESENSE_PROTOCOL, TYPESENSE_API_KEY
 */

import Typesense from "typesense";

const getConfig = () => ({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST ?? "localhost",
      port: parseInt(process.env.TYPESENSE_PORT ?? "443", 10),
      protocol: (process.env.TYPESENSE_PROTOCOL ?? "https") as "http" | "https",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY ?? "",
  connectionTimeoutSeconds: 5,
});

let _client: InstanceType<typeof Typesense.Client> | null = null;

export function getTypesenseClient(): InstanceType<typeof Typesense.Client> | null {
  if (!process.env.TYPESENSE_API_KEY) return null;
  if (!_client) {
    _client = new Typesense.Client(getConfig());
  }
  return _client;
}

/** Singleton for use across search/sync; may be null if env not set. */
export const typesenseClient = getTypesenseClient();
