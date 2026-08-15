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

const siteRuntime = path.join(root, "src", "site.js");
const siteRuntimeSource = fs.readFileSync(siteRuntime, "utf8");
if (!siteRuntimeSource.includes("renderThreadSequenceNav")) {
  fail(siteRuntime, "thread detail pages must render direct previous/next navigation");
}
if (!siteRuntimeSource.includes('rel="prev"') || !siteRuntimeSource.includes('rel="next"')) {
  fail(siteRuntime, "thread detail navigation must identify previous and next routes");
}
if (!siteRuntimeSource.includes("renderSoundtrack")) {
  fail(siteRuntime, "soundtrack route must use the dedicated soundtrack renderer");
}
if (!siteRuntimeSource.includes("sold-out-stamp") || !siteRuntimeSource.includes("is-sold-out")) {
  fail(siteRuntime, "sold-out Store products must render a visible image stamp");
}

const siteStyles = path.join(root, "src", "site.css");
const siteStylesSource = fs.readFileSync(siteStyles, "utf8");
if (!siteStylesSource.includes(".thread-sequence-nav")) {
  fail(siteStyles, "thread detail previous/next navigation is missing responsive styles");
}
if (!siteStylesSource.includes(".soundtrack-origin-layout") || !siteStylesSource.includes(".soundtrack-promo-card")) {
  fail(siteStyles, "soundtrack page is missing its responsive editorial and Spotify card styles");
}
if (!siteStylesSource.includes(".sold-out-stamp")) {
  fail(siteStyles, "sold-out Store products are missing stamp styles");
}

const siteContent = path.join(root, "src", "content", "siteContent.js");
const siteContentSource = fs.readFileSync(siteContent, "utf8");
if (!siteContentSource.includes('{ label: "Soundtrack", href: "/soundtrack/", page: "soundtrack" }')) {
  fail(siteContent, "main navigation is missing the soundtrack tab");
}
if (!siteContentSource.includes("https://instagram.com/ihocaihag2")) {
  fail(siteContent, "public Instagram links must point to @ihocaihag2");
}
if (siteContentSource.includes('href: "https://instagram.com/ihocaihag"')) {
  fail(siteContent, "public footer still contains the retired Instagram profile");
}
for (const assetName of ["soundtrack-hero.png", "soundtrack-mixtape-cover.png", "soundtrack-spotify-promo.jpeg"]) {
  const assetPath = path.join(root, "assets", "trap-house", assetName);
  if (!fs.existsSync(assetPath)) fail(siteContent, `missing soundtrack asset ${assetName}`);
}

if (failures.length) {
  console.error(`Site verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Site verification passed: ${scriptFiles.length} scripts, ${jsonFiles.length} JSON files, and ${htmlFiles.length} route shells.`);
