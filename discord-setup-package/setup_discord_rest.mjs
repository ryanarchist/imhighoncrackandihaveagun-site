import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(packageRoot, "..");
const apiBase = "https://discord.com/api/v10";

const summary = {
  rolesCreated: 0,
  rolesSkipped: 0,
  categoriesCreated: 0,
  categoriesSkipped: 0,
  channelsCreated: 0,
  channelsUpdated: 0,
  messagesPosted: 0,
  messagesSkipped: 0,
  attachmentsQueued: 0,
  brandingApplied: false,
  bannerApplied: false
};

const permissionBits = {
  ViewChannel: 1n << 10n,
  SendMessages: 1n << 11n,
  ManageMessages: 1n << 13n,
  EmbedLinks: 1n << 14n,
  AttachFiles: 1n << 15n,
  ReadMessageHistory: 1n << 16n
};

async function loadEnv() {
  const envPath = path.join(packageRoot, ".env");
  try {
    const body = await fs.readFile(envPath, "utf8");
    for (const line of body.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Missing .env is handled by the credential check below.
  }
}

function bits(names = []) {
  return names.reduce((total, name) => total | (permissionBits[name] || 0n), 0n).toString();
}

function cleanChannelName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveAssetPath(assetPath) {
  return path.join(siteRoot, String(assetPath || "").replace(/^[/\\]+/, ""));
}

async function readText(relativePath) {
  return fs.readFile(path.join(packageRoot, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(packageRoot, relativePath), "utf8"));
}

async function fileToDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  const data = await fs.readFile(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch(token, method, route, body, extraHeaders = {}, retry = true) {
  const headers = {
    Authorization: `Bot ${token}`,
    ...extraHeaders
  };

  const options = { method, headers };
  if (body instanceof FormData) {
    options.body = body;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${apiBase}${route}`, options);
  } catch (error) {
    if (retry) {
      await wait(1200);
      return apiFetch(token, method, route, body, extraHeaders, false);
    }
    throw error;
  }
  if (response.status === 429 && retry) {
    const rateLimit = await response.json().catch(() => ({}));
    const waitMs = Math.ceil(Number(rateLimit.retry_after || 1) * 1000);
    await wait(waitMs);
    return apiFetch(token, method, route, body, extraHeaders, false);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(`${method} ${route} failed ${response.status}: ${text}`);
    error.status = response.status;
    error.responseText = text;
    error.route = route;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

function overwrite(target, type, allow = [], deny = []) {
  if (!target?.id && typeof target !== "string") return null;
  return {
    id: typeof target === "string" ? target : target.id,
    type,
    allow: bits(allow),
    deny: bits(deny)
  };
}

function buildOverwrites(guildId, botUserId, channelDef, rolesByName) {
  const mod = rolesByName.get("Mod");
  const heavy = rolesByName.get("Heavy Content OK");
  const trapPass = rolesByName.get("Trap Pass Holder");
  const dayOne = rolesByName.get("Day One Dirt Witness");
  const patreon = rolesByName.get("Patreon Back Room");
  const overwrites = [];
  const botAllow = [
    "ViewChannel",
    "SendMessages",
    "ManageMessages",
    "ReadMessageHistory",
    "AttachFiles",
    "EmbedLinks"
  ];

  const gates = {
    "trap-pass": trapPass,
    heavy,
    "day-one": dayOne,
    patreon,
    mod
  };
  const gatedRole = gates[channelDef.visibility];

  if (gatedRole) {
    overwrites.push(overwrite(guildId, 0, [], ["ViewChannel"]));
    overwrites.push(overwrite(gatedRole, 0, ["ViewChannel"], []));
    overwrites.push(overwrite(mod, 0, ["ViewChannel", "SendMessages", "ManageMessages"], []));
  } else {
    overwrites.push(overwrite(guildId, 0, ["ViewChannel"], []));
  }

  if (["staff", "bot-staff"].includes(channelDef.posting)) {
    overwrites.push(overwrite(guildId, 0, [], ["SendMessages"]));
    overwrites.push(overwrite(mod, 0, ["SendMessages", "ManageMessages"], []));
  }

  if (channelDef.posting === "mod") {
    overwrites.push(overwrite(guildId, 0, [], ["ViewChannel", "SendMessages"]));
    overwrites.push(overwrite(mod, 0, ["ViewChannel", "SendMessages", "ManageMessages"], []));
  }

  overwrites.push(overwrite(botUserId, 1, botAllow, []));
  return overwrites.filter(Boolean);
}

async function ensureRole(token, guildId, rolesByName, roleDef) {
  const existing = rolesByName.get(roleDef.name);
  if (existing) {
    summary.rolesSkipped += 1;
    return existing;
  }

  const role = await apiFetch(token, "POST", `/guilds/${guildId}/roles`, {
    name: roleDef.name,
    color: roleDef.color || undefined
  });
  rolesByName.set(role.name, role);
  summary.rolesCreated += 1;
  return role;
}

async function ensureCategory(token, guildId, channelsByName, name) {
  const existing = channelsByName.get(name);
  if (existing?.type === 4) {
    summary.categoriesSkipped += 1;
    return existing;
  }

  const category = await apiFetch(token, "POST", `/guilds/${guildId}/channels`, {
    name,
    type: 4
  });
  channelsByName.set(name, category);
  summary.categoriesCreated += 1;
  return category;
}

async function ensureTextChannel(token, guildId, botUserId, channelsByName, category, channelDef, rolesByName) {
  const name = cleanChannelName(channelDef.name);
  const payload = {
    name,
    type: 0,
    parent_id: category.id,
    nsfw: Boolean(channelDef.nsfw),
    rate_limit_per_user: Number(channelDef.slowmode_seconds || 0),
    topic: channelDef.purpose,
    permission_overwrites: buildOverwrites(guildId, botUserId, channelDef, rolesByName)
  };

  const existing = channelsByName.get(name);
  if (existing?.type === 0) {
    const channel = await apiFetch(token, "PATCH", `/channels/${existing.id}`, payload);
    channelsByName.set(name, channel);
    summary.channelsUpdated += 1;
    return channel;
  }

  const channel = await apiFetch(token, "POST", `/guilds/${guildId}/channels`, payload);
  channelsByName.set(name, channel);
  summary.channelsCreated += 1;
  return channel;
}

async function buildFiles(assetPaths = []) {
  const files = [];
  for (const assetPath of assetPaths) {
    const filePath = resolveAssetPath(assetPath);
    const data = await fs.readFile(filePath);
    files.push({ name: path.basename(filePath), blob: new Blob([data]) });
  }
  summary.attachmentsQueued += files.length;
  return files;
}

async function sendMessage(token, channelId, content, assetPaths) {
  const files = await buildFiles(assetPaths);
  if (!files.length) {
    return apiFetch(token, "POST", `/channels/${channelId}/messages`, { content });
  }

  const form = new FormData();
  form.append("payload_json", JSON.stringify({ content }));
  files.forEach((file, index) => form.append(`files[${index}]`, file.blob, file.name));
  return apiFetch(token, "POST", `/channels/${channelId}/messages`, form);
}

async function postStarter(token, botUserId, channel, body, assetPaths = []) {
  const content = String(body || "").trim();
  if (!content && !assetPaths.length) return;
  if (content.length > 2000) {
    throw new Error(`Starter message for #${channel.name} is ${content.length} characters; Discord limit is 2000.`);
  }

  const recent = await apiFetch(token, "GET", `/channels/${channel.id}/messages?limit=25`);
  const existing = recent.find((message) => message.author?.id === botUserId && message.content.trim() === content);
  if (existing) {
    summary.messagesSkipped += 1;
    return;
  }

  const message = await sendMessage(token, channel.id, content, assetPaths);
  await apiFetch(token, "PUT", `/channels/${channel.id}/pins/${message.id}`, null).catch(() => {});
  summary.messagesPosted += 1;
}

async function tryApplyBranding(token, guildId, map) {
  if (process.env.APPLY_SERVER_BRANDING !== "true") return;
  const logo = map.server?.identity_assets?.logo;
  const banner = map.server?.identity_assets?.banner;

  const payload = { name: map.server?.name || "The Trap House" };
  if (logo) payload.icon = await fileToDataUri(resolveAssetPath(logo));

  await apiFetch(token, "PATCH", `/guilds/${guildId}`, payload);
  summary.brandingApplied = true;

  if (banner) {
    try {
      await apiFetch(token, "PATCH", `/guilds/${guildId}`, {
        banner: await fileToDataUri(resolveAssetPath(banner))
      });
      summary.bannerApplied = true;
    } catch (error) {
      console.warn(`Skipped server banner: ${error.message}`);
    }
  }
}

async function assertGuildAccess(token, guildId, botUser) {
  try {
    return await apiFetch(token, "GET", `/guilds/${guildId}`);
  } catch (error) {
    if (error.status === 404 || /Unknown Guild|10004/.test(error.responseText || error.message)) {
      const permissions = "268561456";
      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${botUser.id}&permissions=${permissions}&integration_type=0&scope=bot+applications.commands`;
      throw new Error([
        `Discord can read the bot token for ${botUser.username}, but that bot is not in the server ${guildId}.`,
        "Invite the bot to The Trap House, then run this setup again.",
        `Bot invite URL: ${inviteUrl}`,
        "If the bot is already invited, copy the server ID again by right-clicking the server icon with Developer Mode enabled."
      ].join("\n"));
    }
    throw error;
  }
}

await loadEnv();

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !guildId) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID. Copy .env.example to .env first.");
  process.exit(1);
}

const map = await readJson("config/server-map.json");
const content = {};
for (const [channelName, filePath] of Object.entries(map.starter_content_files || {})) {
  content[channelName] = await readText(filePath);
}
const channelStarters = map.starter_channel_file
  ? JSON.parse(await readText(map.starter_channel_file))
  : {};

const me = await apiFetch(token, "GET", "/users/@me");
const guild = await assertGuildAccess(token, guildId, me);
console.log(`Connected bot: ${me.username} (${me.id})`);
console.log(`Target server: ${guild.name} (${guild.id})`);
await tryApplyBranding(token, guildId, map);

const roles = await apiFetch(token, "GET", `/guilds/${guildId}/roles`);
const rolesByName = new Map(roles.map((role) => [role.name, role]));
for (const roleDef of map.roles) {
  await ensureRole(token, guildId, rolesByName, roleDef);
}

const channels = await apiFetch(token, "GET", `/guilds/${guildId}/channels`);
const channelsByName = new Map(channels.map((channel) => [channel.name, channel]));

for (const categoryDef of map.categories) {
  const category = await ensureCategory(token, guildId, channelsByName, categoryDef.name);
  for (const channelDef of categoryDef.channels) {
    const channel = await ensureTextChannel(token, guildId, me.id, channelsByName, category, channelDef, rolesByName);
    const body = content[channelDef.name]
      || channelStarters[channelDef.name]
      || map.starter_messages?.[channelDef.name]
      || "";
    const assets = map.starter_assets?.[channelDef.name] || [];
    await postStarter(token, me.id, channel, body, assets);
  }
}

console.log("The Trap House REST setup finished.");
console.table(summary);
