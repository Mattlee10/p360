import type { ProviderType } from "@p360/core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CreateClientFn = (...args: any[]) => SupabaseClient;

let _createClient: CreateClientFn | null = null;
function getCreateClient(): CreateClientFn {
  if (!_createClient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _createClient = require("@supabase/supabase-js").createClient as CreateClientFn;
  }
  return _createClient!;
}

let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = getCreateClient()(url, key);
  return _client;
}

interface UserData {
  slackUserId: string;
  provider?: ProviderType;
  providerToken?: string;
  createdAt: Date;
  lastCheckAt?: Date;
  onboardedAt?: Date;
}

interface BetaUserRow {
  slack_user_id: string;
  provider: string | null;
  provider_token: string | null;
  created_at: string;
  last_check_at: string | null;
  onboarded_at: string | null;
}

function rowToUser(row: BetaUserRow): UserData {
  return {
    slackUserId: row.slack_user_id,
    provider: (row.provider as ProviderType) ?? undefined,
    providerToken: row.provider_token ?? undefined,
    createdAt: new Date(row.created_at),
    lastCheckAt: row.last_check_at ? new Date(row.last_check_at) : undefined,
    onboardedAt: row.onboarded_at ? new Date(row.onboarded_at) : undefined,
  };
}

export async function getUser(slackUserId: string): Promise<UserData | undefined> {
  const client = getClient();
  if (!client) return undefined;

  const { data, error } = await client
    .from("beta_users")
    .select("*")
    .eq("slack_user_id", slackUserId)
    .maybeSingle();

  if (error || !data) return undefined;
  return rowToUser(data as BetaUserRow);
}

export async function setUser(slackUserId: string, patch: Partial<UserData>): Promise<UserData> {
  const client = getClient();

  const update: Partial<BetaUserRow> & { slack_user_id: string } = {
    slack_user_id: slackUserId,
  };

  if ("provider" in patch) update.provider = patch.provider ?? null;
  if ("providerToken" in patch) update.provider_token = patch.providerToken ?? null;
  if ("lastCheckAt" in patch) update.last_check_at = patch.lastCheckAt?.toISOString() ?? null;
  if ("onboardedAt" in patch) update.onboarded_at = patch.onboardedAt?.toISOString() ?? null;

  if (client) {
    const { data, error } = await client
      .from("beta_users")
      .upsert(update, { onConflict: "slack_user_id" })
      .select()
      .single();

    if (!error && data) return rowToUser(data as BetaUserRow);
  }

  // Fallback: return merged object if DB unavailable
  const existing = await getUser(slackUserId);
  return { slackUserId, createdAt: new Date(), ...existing, ...patch };
}

export async function setProvider(slackUserId: string, provider: ProviderType, token: string): Promise<void> {
  await setUser(slackUserId, { provider, providerToken: token });
}

export async function getProvider(slackUserId: string): Promise<ProviderType | undefined> {
  const user = await getUser(slackUserId);
  return user?.provider;
}

export async function getProviderToken(slackUserId: string): Promise<string | undefined> {
  const user = await getUser(slackUserId);
  return user?.providerToken;
}

export async function hasConnectedDevice(slackUserId: string): Promise<boolean> {
  const user = await getUser(slackUserId);
  return !!user?.providerToken;
}

export async function updateLastCheck(slackUserId: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  await client
    .from("beta_users")
    .update({ last_check_at: new Date().toISOString() })
    .eq("slack_user_id", slackUserId);
}

// Idempotent: only sets onboarded_at on first call (when NULL)
export async function markOnboarded(slackUserId: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  await client
    .from("beta_users")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("slack_user_id", slackUserId)
    .is("onboarded_at", null);
}
