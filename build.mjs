import * as esbuild from "esbuild";
import { chmodSync } from "node:fs";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "dist/index.cjs",
  banner: {
    js: "#!/usr/bin/env node",
  },
});

chmodSync("dist/index.cjs", 0o755);
console.log("✅ dist/index.cjs");
