/**
 * Cloudflare Workers environment bindings.
 */
export interface Bindings {
  /** VAPI secret token for Bearer auth verification. Set via wrangler secret. */
  VAPI_SECRET_TOKEN?: string;
  /** D1 database for persistent reservation storage. */
  DB: D1Database;
}
