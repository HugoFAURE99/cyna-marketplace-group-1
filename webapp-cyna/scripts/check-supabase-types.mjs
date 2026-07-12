import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const linked = process.argv.includes("--linked");
const executable = join(
  process.cwd(),
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const args = ["gen", "types", "typescript", linked ? "--linked" : "--local"];
const generated = execFileSync(process.execPath, [executable, ...args], {
  encoding: "utf8",
});
const committed = readFileSync("src/types/database.types.ts", "utf8");
const normalize = (value) => value.replace(/\r\n/g, "\n").trim();

if (normalize(generated) !== normalize(committed)) {
  console.error(
    `Supabase types are stale. Run npm run db:types:${linked ? "linked" : "local"}.`,
  );
  process.exitCode = 1;
} else {
  console.log("Supabase database types are current.");
}
