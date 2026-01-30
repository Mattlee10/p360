import * as http from "http";
import * as crypto from "crypto";
import { setOuraTokens, getConfigPath } from "../lib/config";

// Oura OAuth 설정 - 환경변수 또는 기본값 사용
const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID || "095f7bec-5809-4ec1-a9f4-55781263e521";
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET || "";
const OURA_AUTH_URL = "https://cloud.ouraring.com/oauth/authorize";
const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
const REDIRECT_URI = "http://localhost:3360/callback";
const SCOPES = "daily personal heartrate workout tag session spo2";

// PKCE 생성
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function loginCommand(): Promise<void> {
  // Client Secret이 없으면 PAT 안내
  if (!OURA_CLIENT_SECRET) {
    console.log("");
    console.log("  🔐 Oura Ring Login");
    console.log("");
    console.log("  OAuth를 사용하려면 환경변수를 설정하세요:");
    console.log("");
    console.log("    export OURA_CLIENT_ID=your_client_id");
    console.log("    export OURA_CLIENT_SECRET=your_client_secret");
    console.log("    p360 login");
    console.log("");
    console.log("  ─────────────────────────────────────");
    console.log("");
    console.log("  또는 Personal Access Token 사용:");
    console.log("");
    console.log("    p360 login --token YOUR_TOKEN");
    console.log("");
    return;
  }

  // OAuth flow 시작
  await startOAuthFlow();
}

async function startOAuthFlow(): Promise<void> {
  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Authorization URL 생성
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
  console.log("  브라우저에서 다음 URL을 열어 로그인하세요:");
  console.log("");
  console.log(`  ${authUrl.toString()}`);
  console.log("");
  console.log("  대기 중...");

  // 로컬 서버로 callback 대기
  try {
    const code = await waitForCallback(state);
    console.log("  인증 코드 수신!");

    // Token exchange
    await exchangeToken(code, codeVerifier);
  } catch (error) {
    console.error("  ❌ OAuth 실패:", error instanceof Error ? error.message : error);
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
          res.end(`<h1>❌ 오류: ${error}</h1><p>터미널로 돌아가세요.</p>`);
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
                <h1>✅ 연결 완료!</h1>
                <p>이 창을 닫고 터미널로 돌아가세요.</p>
              </div>
            </body>
          </html>
        `);

        server.close();
        resolve(code);
      }
    });

    server.listen(3360, () => {
      // 서버 시작됨
    });

    // 5분 타임아웃
    setTimeout(() => {
      server.close();
      reject(new Error("Timeout - 5분 초과"));
    }, 5 * 60 * 1000);
  });
}

async function exchangeToken(code: string, codeVerifier: string): Promise<void> {
  console.log("  토큰 교환 중...");

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

  // 토큰 저장
  setOuraTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  console.log("");
  console.log("  ✅ Oura Ring 연결 완료!");
  console.log("");
  console.log("  이제 다음 명령어를 사용할 수 있습니다:");
  console.log("     p360 workout");
  console.log("");
  console.log(`  설정 파일: ${getConfigPath()}`);
  console.log("");
}

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
  console.log("  토큰 검증 중...");

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
        console.error("  ❌ 유효하지 않은 토큰입니다.");
      } else {
        console.error(`  ❌ 오류: HTTP ${response.status}`);
      }
      process.exit(1);
    }

    setOuraTokens({
      accessToken: token,
      refreshToken: "",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    console.log("  ✅ 토큰 저장 완료!");
    console.log("");
    console.log("  이제 다음 명령어를 사용할 수 있습니다:");
    console.log("     p360 workout");
    console.log("");
    console.log(`  설정 파일: ${getConfigPath()}`);
    console.log("");
  } catch (error) {
    console.error(
      "  ❌ 토큰 검증 오류:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}
