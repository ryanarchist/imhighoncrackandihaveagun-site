import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "archive", "node_modules"]);
const failures = [];

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function fail(file, message) {
  failures.push(`${relative(file)}: ${message}`);
}

function localTargetExists(value) {
  let clean = value.split("#")[0].split("?")[0];
  if (!clean) return true;
  try {
    clean = decodeURIComponent(clean);
  } catch (error) {
    return false;
  }
  const candidate = path.resolve(root, clean.replace(/^\/+/, ""));
  if (!candidate.startsWith(root)) return false;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return true;
  return fs.existsSync(path.join(candidate, "index.html"));
}

const files = walk(root);
const scriptFiles = files.filter((file) => /\.(?:c?js|mjs)$/i.test(file));
const jsonFiles = files.filter((file) => /\.json$/i.test(file));
const htmlFiles = files.filter((file) => /(?:^|[\\/])(?:index|404)\.html$/i.test(file));

for (const file of scriptFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) fail(file, result.stderr.trim() || "JavaScript syntax check failed");
}

for (const file of jsonFiles) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(file, `invalid JSON: ${error.message}`);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  if (html.includes("Ryan copy needed.")) fail(file, "contains unfinished placeholder copy");
  const configIndex = html.indexOf("/src/content/trapPassConfig.js");
  const runtimeIndex = html.indexOf("/trap-pass-system.js");
  if (configIndex < 0 || runtimeIndex < 0 || configIndex > runtimeIndex) {
    fail(file, "Trap Pass configuration must load before trap-pass-system.js");
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value)) continue;
    if (!localTargetExists(value)) fail(file, `missing local target ${value}`);
  }
}

const sitemap = path.join(root, "sitemap.xml");
const sitemapXml = fs.readFileSync(sitemap, "utf8");
for (const match of sitemapXml.matchAll(/<loc>https:\/\/imhighoncrackandihaveagun\.com([^<]*)<\/loc>/g)) {
  if (!localTargetExists(match[1] || "/")) fail(sitemap, `missing route shell for ${match[1] || "/"}`);
}

if (failures.length) {
  console.error(`Site verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Site verification passed: ${scriptFiles.length} scripts, ${jsonFiles.length} JSON files, and ${htmlFiles.length} route shells.`);
