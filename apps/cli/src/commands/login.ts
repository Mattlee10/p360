import * as http from "http";
import * as crypto from "crypto";
import { setOuraTokens, setAnthropicApiKey, getConfigPath } from "../lib/config";

// Oura OAuth config - use environment variables
const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID || "";
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET || "";
const OURA_AUTH_URL = "https://cloud.ouraring.com/oauth/authorize";
const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
const REDIRECT_URI = "http://localhost:3360/callback";
const SCOPES = "daily personal heartrate workout tag session spo2";

// PKCE generation
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function loginCommand(): Promise<void> {
  // If no client secret, show instructions
  if (!OURA_CLIENT_SECRET) {
    console.log("");
    console.log("  🔐 Oura Ring Login");
    console.log("");
    console.log("  To use OAuth, set environment variables:");
    console.log("");
    console.log("    export OURA_CLIENT_ID=your_client_id");
    console.log("    export OURA_CLIENT_SECRET=your_client_secret");
    console.log("    p360 login");
    console.log("");
    console.log("  ─────────────────────────────────────");
    console.log("");
    console.log("  Or use a Personal Access Token:");
    console.log("");
    console.log("    p360 login --token YOUR_TOKEN");
    console.log("");
    return;
  }

  // Start OAuth flow
  await startOAuthFlow();
}

async function startOAuthFlow(): Promise<void> {
  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Build authorization URL
  const authUrl = new URL(OURA_AUTH_URL);
  authUrl.searchParams.set("client_id", OURA_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log("");
  console.log("  🔐 Oura Ring OAuth Login");
  console.log("");
  console.log("  Open this URL in your browser to log in:");
  console.log("");
  console.log(`  ${authUrl.toString()}`);
  console.log("");
  console.log("  Waiting for authorization...");

  // Wait for callback on local server
  try {
    const code = await waitForCallback(state);
    console.log("  Authorization code received!");

    // Token exchange
    await exchangeToken(code, codeVerifier);
  } catch (error) {
    console.error("  ❌ OAuth failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function waitForCallback(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "", `http://localhost:3360`);

      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<h1>❌ Error: ${error}</h1><p>Return to terminal.</p>`);
          server.close();
          reject(new Error(error));
          return;
        }

        if (state !== expectedState) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>❌ State mismatch</h1>");
          server.close();
          reject(new Error("State mismatch"));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>❌ No code received</h1>");
          server.close();
          reject(new Error("No code"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <html>
            <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0F172A; color: white;">
              <div style="text-align: center;">
                <h1>✅ Connected!</h1>
                <p>You can close this window and return to the terminal.</p>
              </div>
            </body>
          </html>
        `);

        server.close();
        resolve(code);
      }
    });

    server.listen(3360, () => {
      // Server started
    });

    // 5 minute timeout
    setTimeout(() => {
      server.close();
      reject(new Error("Timeout - exceeded 5 minutes"));
    }, 5 * 60 * 1000);
  });
}

async function exchangeToken(code: string, codeVerifier: string): Promise<void> {
  console.log("  Exchanging token...");

  const params = new URLSearchParams();
  params.set("grant_type", "authorization_code");
  params.set("code", code);
  params.set("redirect_uri", REDIRECT_URI);
  params.set("client_id", OURA_CLIENT_ID);
  params.set("client_secret", OURA_CLIENT_SECRET);
  params.set("code_verifier", codeVerifier);

  const response = await fetch(OURA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };

  // Save tokens
  setOuraTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  console.log("");
  console.log("  ✅ Oura Ring connected!");
  console.log("");
  console.log("  You can now run:");
  console.log("     p360 workout");
  console.log("");
  console.log(`  Config saved at: ${getConfigPath()}`);
  console.log("");
}

// ============================================
// Anthropic API Key Login
// ============================================

export function loginWithAnthropicKey(key: string): void {
  if (!key || !key.startsWith("sk-ant-")) {
    console.log("");
    console.log("  ⚠️  Invalid key format. Anthropic keys start with 'sk-ant-'");
    console.log("");
    return;
  }

  setAnthropicApiKey(key);
  console.log("");
  console.log("  ✅ Anthropic API key saved!");
  console.log("");
  console.log("  You can now run:");
  console.log("     p360 ask \"should I work out today?\"");
  console.log("");
  console.log(`  Config saved at: ${getConfigPath()}`);
  console.log("");
}

// ============================================
// Oura Token Login
// ============================================

interface LoginTokenOptions {
  token?: string;
}

export async function loginWithToken(options: LoginTokenOptions): Promise<void> {
  const { token } = options;

  if (!token) {
    console.error("Error: Please provide a token with --token YOUR_TOKEN");
    process.exit(1);
  }

  console.log("");
  console.log("  Validating token...");

  try {
    const response = await fetch(
      "https://api.ouraring.com/v2/usercollection/personal_info",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.error("  ❌ Invalid token.");
      } else {
        console.error(`  ❌ Error: HTTP ${response.status}`);
      }
      process.exit(1);
    }

    setOuraTokens({
      accessToken: token,
      refreshToken: "",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    console.log("  ✅ Token saved!");
    console.log("");
    console.log("  You can now run:");
    console.log("     p360 workout");
    console.log("");
    console.log(`  Config saved at: ${getConfigPath()}`);
    console.log("");
  } catch (error) {
    console.error(
      "  ❌ Token validation error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}
