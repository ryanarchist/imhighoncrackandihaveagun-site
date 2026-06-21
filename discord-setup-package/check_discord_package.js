import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(packageRoot, "..");
const errors = [];
const warnings = [];

function cleanChannelName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(siteRoot, relativePath), "utf8"));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

const map = await readJson("discord-setup-package/config/server-map.json");
const threads = await readJson("data/threads.json");
const channelStarters = map.starter_channel_file
  ? JSON.parse(await fs.readFile(path.join(packageRoot, map.starter_channel_file), "utf8"))
  : {};

if (!map.server?.name) addError("Server name is missing.");
if (!map.server?.motto) addError("Server motto is missing.");
if (!Array.isArray(map.roles) || !map.roles.length) addError("No roles defined.");
if (!Array.isArray(map.categories) || !map.categories.length) addError("No categories defined.");

const roleNames = new Set();
for (const role of map.roles || []) {
  if (!role.name) addError("A role is missing a name.");
  if (roleNames.has(role.name)) addError(`Duplicate role: ${role.name}`);
  roleNames.add(role.name);
}

const channelNames = new Set();
const channelsByName = new Map();
const validVisibilities = new Set(["everyone", "members", "trap-pass", "heavy", "day-one", "patreon", "mod"]);
const validPosting = new Set(["staff", "bot-staff", "members", "heavy", "role", "mod"]);

for (const category of map.categories || []) {
  if (!category.name) addError("A category is missing a name.");
  for (const channel of category.channels || []) {
    const cleanName = cleanChannelName(channel.name);
    if (!cleanName) addError(`Channel in ${category.name} has an invalid name.`);
    if (channelNames.has(cleanName)) addError(`Duplicate channel: ${cleanName}`);
    channelNames.add(cleanName);
    channelsByName.set(cleanName, channel);

    if (!validVisibilities.has(channel.visibility)) {
      addError(`#${cleanName} has invalid visibility: ${channel.visibility}`);
    }
    if (!validPosting.has(channel.posting)) {
      addError(`#${cleanName} has invalid posting mode: ${channel.posting}`);
    }
    if (channel.visibility === "heavy" && !channel.slowmode_seconds) {
      addWarning(`#${cleanName} is sensitive/private but has no slowmode.`);
    }
  }
}

const threadChannels = [
  threads.origin?.channel,
  ...(threads.threads || []).map((thread) => thread.channel)
].filter(Boolean).map(cleanChannelName);

for (const threadChannel of threadChannels) {
  if (!channelNames.has(threadChannel)) {
    addError(`Thread channel is missing from Discord map: #${threadChannel}`);
  }
}

for (const [channelName, relativePath] of Object.entries(map.starter_content_files || {})) {
  const cleanName = cleanChannelName(channelName);
  if (!channelNames.has(cleanName)) {
    addError(`Starter content references missing channel: #${cleanName}`);
  }
  const contentPath = path.join(packageRoot, relativePath);
  if (!(await exists(contentPath))) {
    addError(`Starter content file missing: ${relativePath}`);
    continue;
  }
  const body = (await fs.readFile(contentPath, "utf8")).trim();
  if (body.length > 2000) {
    addError(`${relativePath} is ${body.length} characters; Discord message limit is 2000.`);
  }
  if (/local review|placeholder|lorem ipsum|todo/i.test(body)) {
    addWarning(`${relativePath} contains possible draft wording.`);
  }
}

for (const [channelName, assetPaths] of Object.entries(map.starter_assets || {})) {
  const cleanName = cleanChannelName(channelName);
  if (!channelNames.has(cleanName)) {
    addError(`Starter asset references missing channel: #${cleanName}`);
  }
  for (const assetPath of assetPaths) {
    const filePath = path.join(siteRoot, String(assetPath).replace(/^[/\\]+/, ""));
    if (!(await exists(filePath))) {
      addError(`Starter asset missing: ${assetPath}`);
    }
  }
}

for (const [channelName, body] of Object.entries(channelStarters)) {
  const cleanName = cleanChannelName(channelName);
  if (!channelNames.has(cleanName)) {
    addError(`Channel starter references missing channel: #${cleanName}`);
  }
  if (String(body || "").trim().length > 2000) {
    addError(`Channel starter for #${cleanName} exceeds Discord message limit.`);
  }
  if (/local review|placeholder|lorem ipsum|todo/i.test(String(body || ""))) {
    addWarning(`Channel starter for #${cleanName} contains possible draft wording.`);
  }
}

for (const channelName of channelNames) {
  const hasPinnedContent = Boolean(map.starter_content_files?.[channelName]);
  const hasStarterMessage = Boolean(map.starter_messages?.[channelName]);
  const hasChannelStarter = Boolean(channelStarters[channelName]);
  if (!hasPinnedContent && !hasStarterMessage && !hasChannelStarter) {
    addError(`#${channelName} has no starter copy.`);
  }
}

const requiredReadOnly = [
  "knock-first",
  "house-rules",
  "official-stash",
  "announcements-from-the-couch",
  "new-drops",
  "the-map-on-the-wall",
  "resources-in-the-cabinet"
];

for (const channelName of requiredReadOnly) {
  const channel = channelsByName.get(channelName);
  if (!channel) {
    addError(`Required public channel missing: #${channelName}`);
  } else if (channel.posting !== "staff") {
    addError(`#${channelName} should be staff-posting for public release.`);
  }
}

console.log("Trap House Discord package preflight");
console.log(`Roles: ${roleNames.size}`);
console.log(`Categories: ${(map.categories || []).length}`);
console.log(`Channels: ${channelNames.size}`);
console.log(`Thread channels expected: ${threadChannels.length}`);
console.log(`Starter posts: ${Object.keys(map.starter_content_files || {}).length}`);
console.log(`Channel starters: ${Object.keys(channelStarters).length}`);
console.log(`Starter asset groups: ${Object.keys(map.starter_assets || {}).length}`);

if (warnings.length) {
  console.warn("\nWarnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error("\nErrors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nPreflight passed.");
