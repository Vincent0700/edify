/**
 * Dify API Client
 */

import type {
  EnvConfig,
  ImportRequest,
  ImportResponse,
  ImportStatus,
} from "./types.js";

/**
 * Dify API Client
 */
export class Dify {
  private base: string;
  private token: string;
  private csrf: string;

  constructor(cfg: EnvConfig) {
    this.base = cfg.url.replace(/\/$/, "");
    this.token = cfg.accessToken || "";
    this.csrf = cfg.csrfToken || "";
  }

  /**
   * Get headers
   */
  private head(): Record<string, string> {
    const cookies = [`access_token=${this.token}`];
    if (this.csrf) cookies.push(`csrf_token=${this.csrf}`);

    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Cookie: cookies.join("; "),
    };

    if (this.csrf) h["X-Csrf-Token"] = this.csrf;

    return h;
  }

  /**
   * Make request
   */
  private async req<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const url = `${this.base}${path}`;

    const res = await fetch(url, {
      ...opts,
      headers: { ...this.head(), ...opts.headers },
    });

    if (!res.ok) {
      const txt = await res.text();
      let msg: string;

      try {
        const json = JSON.parse(txt);
        msg = json.message || json.error || txt;
      } catch {
        msg = txt;
      }

      throw new Error(`API Error (${res.status}): ${msg}`);
    }

    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      return res.json();
    }
    return res.text() as unknown as T;
  }

  /**
   * Import app
   */
  async put(
    yaml: string,
    opts: { id?: string; name?: string; desc?: string } = {}
  ): Promise<ImportResponse> {
    const data: ImportRequest = {
      mode: "yaml-content",
      yaml_content: yaml,
      name: opts.name,
      description: opts.desc,
      ...(opts.id && { app_id: opts.id }),
    };

    return this.req<ImportResponse>("/console/api/apps/imports", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Confirm import
   */
  async ok(id: string): Promise<ImportResponse> {
    return this.req<ImportResponse>(`/console/api/apps/imports/${id}/confirm`, {
      method: "POST",
    });
  }

  /**
   * Export app
   */
  async get(id: string, opts: { secret?: boolean } = {}): Promise<string> {
    const p = new URLSearchParams();
    if (opts.secret) p.set("include_secret", "true");

    const q = p.toString();
    const path = `/console/api/apps/${id}/export${q ? `?${q}` : ""}`;

    const res = await this.req<{ data: string }>(path, { method: "GET" });
    return res.data;
  }

  /**
   * List apps
   */
  async ls(opts: { page?: number; limit?: number } = {}): Promise<{
    data: Array<{
      id: string;
      name: string;
      mode: string;
      description: string;
      created_at: string;
      updated_at: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const p = new URLSearchParams();
    p.set("page", String(opts.page || 1));
    p.set("limit", String(opts.limit || 20));

    return this.req(`/console/api/apps?${p.toString()}`, { method: "GET" });
  }

  /**
   * Get app info
   */
  async info(id: string): Promise<{
    id: string;
    name: string;
    mode: string;
    description: string;
    icon: string;
    icon_background: string;
    created_at: string;
    updated_at: string;
  }> {
    return this.req(`/console/api/apps/${id}`, { method: "GET" });
  }

  /**
   * Delete app
   */
  async rm(id: string): Promise<{ result: string }> {
    return this.req(`/console/api/apps/${id}`, { method: "DELETE" });
  }

  /**
   * Test connection
   */
  async test(): Promise<boolean> {
    try {
      await this.ls({ limit: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get import status message
 */
export function msg(status: ImportStatus): string {
  switch (status) {
    case "completed":
      return "✅ Import completed";
    case "completed-with-warnings":
      return "⚠️  Import completed with warnings";
    case "pending":
      return "⏳ Pending - confirmation required";
    case "failed":
      return "❌ Import failed";
    default:
      return `Unknown: ${status}`;
  }
}

/**
 * Validate YAML
 */
export function check(content: string): {
  ok: boolean;
  err?: string;
  data?: { app?: { name?: string; mode?: string }; name?: string; mode?: string };
} {
  try {
    const yaml = require("yaml");
    const data = yaml.parse(content);

    if (!data) {
      return { ok: false, err: "Empty YAML" };
    }

    if (!data.app && !data.workflow) {
      return { ok: false, err: "Missing 'app' or 'workflow'" };
    }

    if (data.app && !data.app.mode) {
      return { ok: false, err: "Missing app.mode" };
    }

    return { ok: true, data };
  } catch (e) {
    return { ok: false, err: `YAML error: ${e instanceof Error ? e.message : String(e)}` };
  }
}
