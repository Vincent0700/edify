/**
 * Auth - API server for browser extension
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import type { AuthTokens } from "./types.js";

const PORT = 8765;
const HOST = "127.0.0.1";

/**
 * Auth class - handles authentication flow
 */
export class Auth {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Start auth flow and wait for browser extension
   */
  run(): Promise<AuthTokens> {
    return new Promise((resolve, reject) => {
      let done = false;

      const srv = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        const reqUrl = new URL(req.url || "/", `http://${HOST}:${PORT}`);

        // CORS
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (done) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("Done");
          return;
        }

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        if (reqUrl.pathname === "/config" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ url: this.url }));
          return;
        }

        if (reqUrl.pathname === "/submit-tokens" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            try {
              const { accessToken, refreshToken, csrfToken } = JSON.parse(body);

              if (!accessToken || !refreshToken) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: "Missing tokens" }));
                return;
              }

              const tokens: AuthTokens = {
                accessToken,
                refreshToken,
                csrfToken: csrfToken || "",
              };

              if (!done) {
                done = true;
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));

                setTimeout(() => {
                  srv.close();
                  resolve(tokens);
                }, 100);
              }
            } catch {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "Invalid JSON" }));
            }
          });
          return;
        }

        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      });

      srv.listen(PORT, HOST, () => {
        console.log(`Login to Dify: ${this.url}`);
        console.log("Waiting for browser extension...");
        this.open(this.url);
      });

      // Timeout 10 min
      setTimeout(() => {
        if (!done) {
          done = true;
          srv.close();
          reject(new Error("认证超时 (10 分钟)"));
        }
      }, 10 * 60 * 1000);
    });
  }

  /**
   * Open URL in browser
   */
  private open(url: string): void {
    const p = process.platform;
    let cmd: string;
    let args: string[];

    if (p === "darwin") {
      cmd = "open";
      args = [url];
    } else if (p === "win32") {
      cmd = "cmd";
      args = ["/c", "start", url];
    } else {
      cmd = "xdg-open";
      args = [url];
    }

    spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
  }

  /**
   * Refresh access token
   */
  static async refresh(url: string, token: string): Promise<AuthTokens | null> {
    try {
      const res = await fetch(`${url}/console/api/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refresh_token=${token}`,
        },
      });

      if (!res.ok) {
        console.error("❌ Token 刷新失败:", res.status);
        return null;
      }

      const cookies = res.headers.getSetCookie();
      const tokens: Partial<AuthTokens> = {};

      for (const cookie of cookies) {
        const [pair] = cookie.split(";");
        const [key, value] = pair.split("=");

        if (key === "access_token") tokens.accessToken = value;
        if (key === "refresh_token") tokens.refreshToken = value;
        if (key === "csrf_token") tokens.csrfToken = value;
      }

      if (tokens.accessToken && tokens.refreshToken) {
        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          csrfToken: tokens.csrfToken || "",
        };
      }

      return null;
    } catch (err) {
      console.error("❌ Token 刷新错误:", err);
      return null;
    }
  }
}
