/**
 * Config - Configuration management
 * Priority: ./.difyrc > ~/.difyrc
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import type { EnvConfig, AuthTokens } from "./types.js";

const DEFAULT_URL = "https://cloud.dify.ai";
const FILENAME = ".difyrc";
const LOCAL = `./${FILENAME}`;
const GLOBAL = `${homedir()}/${FILENAME}`;

export interface StoredConfig {
  url: string;
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
}

/**
 * Config class - manages configuration
 */
export class Config {
  private static path: string | null = null;

  /**
   * Get config file path
   */
  static file(): string {
    if (this.path) return this.path;

    if (existsSync(LOCAL)) {
      this.path = LOCAL;
      return LOCAL;
    }

    if (existsSync(GLOBAL)) {
      this.path = GLOBAL;
      return GLOBAL;
    }

    this.path = LOCAL;
    return LOCAL;
  }

  /**
   * Load config
   */
  static load(): EnvConfig {
    const path = this.file();

    try {
      if (!existsSync(path)) {
        return { url: DEFAULT_URL };
      }

      const data: StoredConfig = JSON.parse(readFileSync(path, "utf-8"));

      return {
        url: data.url || DEFAULT_URL,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        csrfToken: data.csrfToken,
      };
    } catch {
      return { url: DEFAULT_URL };
    }
  }

  /**
   * Save config
   */
  static save(cfg: Partial<StoredConfig>): void {
    const path = this.file();

    let old: EnvConfig;
    try {
      if (existsSync(path)) {
        old = JSON.parse(readFileSync(path, "utf-8"));
      } else {
        old = { url: DEFAULT_URL };
      }
    } catch {
      old = { url: DEFAULT_URL };
    }

    const merged: StoredConfig = {
      url: cfg.url ?? old.url,
      accessToken: cfg.accessToken ?? old.accessToken,
      refreshToken: cfg.refreshToken ?? old.refreshToken,
      csrfToken: cfg.csrfToken ?? old.csrfToken,
    };

    const clean: Record<string, string> = { url: merged.url };
    if (merged.accessToken) clean.accessToken = merged.accessToken;
    if (merged.refreshToken) clean.refreshToken = merged.refreshToken;
    if (merged.csrfToken) clean.csrfToken = merged.csrfToken;

    writeFileSync(path, JSON.stringify(clean, null, 2));
  }

  /**
   * Save auth tokens
   */
  static auth(tokens: AuthTokens): void {
    this.save({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      csrfToken: tokens.csrfToken,
    });
  }

  /**
   * Set URL
   */
  static url(val: string): void {
    this.save({ url: val });
  }

  /**
   * Clear tokens (logout)
   */
  static clear(): void {
    const cfg = this.load();
    const path = this.file();
    writeFileSync(path, JSON.stringify({ url: cfg.url }, null, 2));
  }

  /**
   * Check if has valid tokens
   */
  static ok(cfg: EnvConfig): boolean {
    return !!(cfg.accessToken && cfg.refreshToken);
  }

  /**
   * Print config
   */
  static show(cfg: EnvConfig): void {
    console.log(`Config: ${this.file()}`);
    console.log(`URL:    ${cfg.url}`);
    console.log(`Auth:   ${cfg.accessToken ? "✅" : "❌"}`);
  }
}
