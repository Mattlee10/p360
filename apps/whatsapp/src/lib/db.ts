import { Pool } from "pg";
import { resolve4 } from "dns/promises";

let poolPromise: Promise<Pool> | null = null;

export async function getPool(): Promise<Pool> {
  if (!poolPromise) poolPromise = createPool();
  return poolPromise;
}

async function createPool(): Promise<Pool> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const parsed = new URL(url);
  const [ipv4] = await resolve4(parsed.hostname);
  parsed.hostname = ipv4;

  return new Pool({ connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } });
}
