/**
 * Dify CLI Tool
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Command } from "commander";
import { Config } from "./config.js";
import { Auth } from "./auth.js";
import { Dify, check } from "./api.js";
import type { EnvConfig } from "./types.js";

const cli = new Command();

cli
  .name("edify")
  .description("Import/export YAML configurations to Dify")
  .version("0.1.0");

// login
cli
  .command("login")
  .description("Login via email/password or browser extension")
  .option("--email <email>", "Email address (env: DIFY_EMAIL)")
  .option("--password <password>", "Password (env: DIFY_PASSWORD)")
  .action(async (opts: { email?: string; password?: string }) => {
    const cfg = Config.load();
    try {
      let tokens;
      const email = opts.email || process.env.DIFY_EMAIL;
      const pw = opts.password || process.env.DIFY_PASSWORD;

      if (email) {
        const password = pw || await prompt("Password: ");
        if (!password) {
          console.error("❌ Password cannot be empty");
          process.exit(1);
        }
        tokens = await Auth.password(cfg.url, email, password);
      } else {
        const auth = new Auth(cfg.url);
        tokens = await auth.run();
      }

      Config.auth(tokens);
      console.log("✅ Authenticated");
      process.exit(0);
    } catch (e) {
      console.error("❌ Auth failed:", e);
      process.exit(1);
    }
  });

// logout
cli
  .command("logout")
  .description("Clear credentials")
  .action(() => {
    Config.clear();
    console.log("✅ Logged out");
  });

// config
const configCmd = cli
  .command("config")
  .description("Show or modify config")
  .action(() => {
    Config.show(Config.load());
  });

configCmd
  .command("set <key> <value>")
  .description("Set config (url)")
  .action((key: string, val: string) => {
    if (key === "url") {
      Config.url(val);
      console.log(`✅ URL: ${val}`);
    } else {
      console.error(`❌ Unknown: ${key}`);
      process.exit(1);
    }
  });

// import
cli
  .command("import <file>")
  .description("Import YAML to Dify")
  .option("--app-id <id>", "Override app")
  .option("--name <name>", "Override name")
  .action(async (file: string, opts: { appId?: string; name?: string }) => {
    const cfg = Config.load();
    need(cfg);

    if (!existsSync(file)) {
      console.error(`❌ Not found: ${file}`);
      process.exit(1);
    }

    const yaml = readFileSync(file, "utf-8");
    const v = check(yaml);
    if (!v.ok) {
      console.error(`❌ Invalid: ${v.err}`);
      process.exit(1);
    }

    const api = new Dify(cfg);

    try {
      let res = await api.put(yaml, { id: opts.appId, name: opts.name });

      if (res.status === "pending") {
        res = await api.ok(res.id);
      }

      if (res.status === "failed") {
        console.error(`❌ ${res.error}`);
        process.exit(1);
      }

      if (res.app_id) {
        console.log(`✅ Imported: ${res.app_id}`);
      }
    } catch (e) {
      console.error("❌ Import failed:", e);
      process.exit(1);
    }
  });

// export
cli
  .command("export <appId> [output]")
  .description("Export app to YAML")
  .option("--secret", "Include secrets")
  .action(async (id: string, out: string | undefined, opts: { secret?: boolean }) => {
    const cfg = Config.load();
    need(cfg);

    const api = new Dify(cfg);

    try {
      const yaml = await api.get(id, { secret: opts.secret === true });
      const path = out || `${id}.yaml`;
      writeFileSync(path, yaml);
      console.log(`✅ ${path}`);
    } catch (e) {
      console.error("❌ Export failed:", e);
      process.exit(1);
    }
  });

// list
cli
  .command("list")
  .description("List apps")
  .action(async () => {
    const cfg = Config.load();
    need(cfg);

    const api = new Dify(cfg);

    try {
      const res = await api.ls({ limit: 100 });

      if (res.data.length === 0) {
        console.log("No apps");
      } else {
        for (const app of res.data) {
          console.log(`${app.id}  ${app.mode.padEnd(15)} ${app.name}`);
        }
      }
    } catch (e) {
      console.error("❌ List failed:", e);
      process.exit(1);
    }
  });

// update
cli
  .command("update <appId> <file>")
  .description("Update app from YAML")
  .action(async (id: string, file: string) => {
    const cfg = Config.load();
    need(cfg);

    if (!existsSync(file)) {
      console.error(`❌ Not found: ${file}`);
      process.exit(1);
    }

    const yaml = readFileSync(file, "utf-8");
    const v = check(yaml);
    if (!v.ok) {
      console.error(`❌ Invalid: ${v.err}`);
      process.exit(1);
    }

    const api = new Dify(cfg);

    try {
      let res = await api.put(yaml, { id });

      if (res.status === "pending") {
        res = await api.ok(res.id);
      }

      if (res.status === "failed") {
        console.error(`❌ ${res.error}`);
        process.exit(1);
      }

      if (res.app_id) {
        console.log(`✅ Updated: ${res.app_id}`);
      }
    } catch (e) {
      console.error("❌ Update failed:", e);
      process.exit(1);
    }
  });

// delete
cli
  .command("delete <appId>")
  .description("Delete app")
  .option("-y, --yes", "Skip confirm")
  .action(async (id: string, opts: { yes?: boolean }) => {
    const cfg = Config.load();
    need(cfg);

    const api = new Dify(cfg);

    try {
      const app = await api.info(id);

      if (!opts.yes) {
        const yes = await ask(`Delete "${app.name}" (${id})? (y/n): `);
        if (!yes) {
          console.log("❌ Cancelled");
          return;
        }
      }

      await api.rm(id);
      console.log(`✅ Deleted: ${app.name}`);
    } catch (e) {
      console.error("❌ Delete failed:", e);
      process.exit(1);
    }
  });
const need = (cfg: EnvConfig): void => {
  if (!Config.ok(cfg)) {
    console.error("❌ Not logged in. Run 'edify login' first.");
    process.exit(1);
  }
};

const ask = (msg: string): Promise<boolean> =>
  new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(msg, (ans) => {
      rl.close();
      const s = ans.trim().toLowerCase();
      resolve(s === "y" || s === "yes");
    });
  });

const prompt = (msg: string): Promise<string> => {
  const stdin = process.stdin;

  // Non-TTY (piped): read line directly
  if (!stdin.isTTY) {
    return new Promise((resolve) => {
      const rl = createInterface({ input: stdin });
      process.stdout.write(msg);
      rl.once("line", (line) => {
        rl.close();
        resolve(line);
      });
    });
  }

  // TTY: raw mode with masked input
  return new Promise((resolve) => {
    process.stdout.write(msg);
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);

    let input = "";
    const onData = (ch: Buffer) => {
      const c = ch.toString();
      if (c === "\n" || c === "\r") {
        stdin.setRawMode(wasRaw ?? false);
        stdin.removeListener("data", onData);
        stdin.pause();
        process.stdout.write("\n");
        resolve(input);
      } else if (c === "\x03") {
        stdin.setRawMode(wasRaw ?? false);
        process.exit(1);
      } else if (c === "\x7f" || c === "\b") {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        input += c;
        process.stdout.write("*");
      }
    };

    stdin.resume();
    stdin.on("data", onData);
  });
};

cli.parse();
