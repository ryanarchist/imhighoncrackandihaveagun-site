import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AttachmentBuilder,
  ChannelType,
  Client,
  GatewayIntentBits,
  PermissionsBitField
} from "discord.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const applyServerBranding = process.env.APPLY_SERVER_BRANDING === "true";

if (!token || !guildId) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID. Copy .env.example to .env first.");
  process.exit(1);
}

const summary = {
  rolesCreated: 0,
  rolesSkipped: 0,
  categoriesCreated: 0,
  categoriesSkipped: 0,
  channelsCreated: 0,
  channelsSkipped: 0,
  messagesPosted: 0,
  messagesSkipped: 0,
  attachmentsQueued: 0,
  brandingApplied: false,
  bannerApplied: false
};

function readText(filePath) {
  return fs.readFile(path.join(__dirname, filePath), "utf8");
}

function cleanChannelName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function permissionOverwrite(target, allow = [], deny = []) {
  const id = typeof target === "string" ? target : target?.id;
  if (!id) return null;
  return {
    id,
    allow: allow.map((perm) => PermissionsBitField.Flags[perm]),
    deny: deny.map((perm) => PermissionsBitField.Flags[perm])
  };
}

async function ensureRole(guild, roleDef) {
  const existing = guild.roles.cache.find((role) => role.name === roleDef.name);
  if (existing) {
    summary.rolesSkipped += 1;
    return existing;
  }
  const role = await guild.roles.create({
    name: roleDef.name,
    reason: "The Trap House setup package"
  });
  summary.rolesCreated += 1;
  return role;
}

async function ensureCategory(guild, name) {
  const existing = guild.channels.cache.find((channel) => (
    channel.type === ChannelType.GuildCategory && channel.name === name
  ));
  if (existing) {
    summary.categoriesSkipped += 1;
    return existing;
  }
  const category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    reason: "The Trap House setup package"
  });
  summary.categoriesCreated += 1;
  return category;
}

function buildOverwrites(guild, channelDef, rolesByName) {
  const everyone = guild.roles.everyone;
  const mod = rolesByName.get("Mod");
  const heavy = rolesByName.get("Heavy Content OK");
  const trapPass = rolesByName.get("Trap Pass Holder");
  const dayOne = rolesByName.get("Day One Dirt Witness");
  const patreon = rolesByName.get("Patreon Back Room");
  const botId = guild.client.user?.id;
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
    overwrites.push(permissionOverwrite(everyone, [], ["ViewChannel"]));
    overwrites.push(permissionOverwrite(gatedRole, ["ViewChannel"], []));
    overwrites.push(permissionOverwrite(mod, ["ViewChannel", "SendMessages", "ManageMessages"], []));
  } else {
    overwrites.push(permissionOverwrite(everyone, ["ViewChannel"], []));
  }

  if (["staff", "bot-staff"].includes(channelDef.posting)) {
    overwrites.push(permissionOverwrite(everyone, [], ["SendMessages"]));
    overwrites.push(permissionOverwrite(mod, ["SendMessages", "ManageMessages"], []));
  }

  if (channelDef.posting === "mod") {
    overwrites.push(permissionOverwrite(everyone, [], ["ViewChannel", "SendMessages"]));
    overwrites.push(permissionOverwrite(mod, ["ViewChannel", "SendMessages", "ManageMessages"], []));
  }

  overwrites.push(permissionOverwrite(botId, botAllow, []));
  return overwrites.filter(Boolean);
}

async function ensureTextChannel(guild, category, channelDef, rolesByName) {
  const name = cleanChannelName(channelDef.name);
  const existing = guild.channels.cache.find((channel) => (
    channel.type === ChannelType.GuildText && channel.name === name
  ));
  const options = {
    name,
    type: ChannelType.GuildText,
    parent: category.id,
    nsfw: Boolean(channelDef.nsfw),
    rateLimitPerUser: Number(channelDef.slowmode_seconds || 0),
    topic: channelDef.purpose,
    permissionOverwrites: buildOverwrites(guild, channelDef, rolesByName),
    reason: "The Trap House setup package"
  };

  if (existing) {
    await existing.edit({
      parent: category.id,
      nsfw: options.nsfw,
      rateLimitPerUser: options.rateLimitPerUser,
      topic: options.topic,
      permissionOverwrites: options.permissionOverwrites
    });
    summary.channelsSkipped += 1;
    return existing;
  }

  const channel = await guild.channels.create(options);
  summary.channelsCreated += 1;
  return channel;
}

function resolveAssetPath(assetPath) {
  const relativePath = String(assetPath || "").replace(/^[/\\]+/, "");
  return path.join(siteRoot, relativePath);
}

async function buildAttachments(assetPaths = []) {
  const files = [];
  for (const assetPath of assetPaths) {
    const filePath = resolveAssetPath(assetPath);
    await fs.access(filePath);
    files.push(new AttachmentBuilder(filePath, { name: path.basename(filePath) }));
  }
  summary.attachmentsQueued += files.length;
  return files;
}

async function tryApplyBranding(guild, map) {
  if (!applyServerBranding) return;

  const logo = map.server?.identity_assets?.logo;
  const banner = map.server?.identity_assets?.banner;

  const updates = {
    name: map.server?.name || guild.name
  };

  if (logo) {
    updates.icon = await fs.readFile(resolveAssetPath(logo));
  }

  await guild.edit(updates, "The Trap House public release branding");
  summary.brandingApplied = true;

  if (banner) {
    try {
      await guild.edit({
        banner: await fs.readFile(resolveAssetPath(banner))
      }, "The Trap House public release banner");
      summary.bannerApplied = true;
    } catch (error) {
      console.warn(`Skipped server banner: ${error.message}`);
    }
  }
}

async function postStarter(channel, body, assetPaths = []) {
  if (!body && !assetPaths?.length) return;
  const content = String(body || "").trim();
  if (content.length > 2000) {
    throw new Error(`Starter message for #${channel.name} is ${content.length} characters; Discord limit is 2000.`);
  }
  const recent = await channel.messages.fetch({ limit: 25 }).catch(() => null);
  const existing = recent?.find((message) => message.author.bot && message.content.trim() === content);
  if (existing) {
    summary.messagesSkipped += 1;
    return;
  }
  const files = await buildAttachments(assetPaths);
  const message = await channel.send({ content, files });
  await message.pin().catch(() => {});
  summary.messagesPosted += 1;
}

async function main() {
  const map = JSON.parse(await readText("config/server-map.json"));
  const content = {};
  const contentFiles = map.starter_content_files || {};
  for (const [channelName, filePath] of Object.entries(contentFiles)) {
    content[channelName] = await readText(filePath);
  }
  const channelStarters = map.starter_channel_file
    ? JSON.parse(await readText(map.starter_channel_file))
    : {};

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  });

  client.once("ready", async () => {
    try {
      const guild = await client.guilds.fetch(guildId);
      await guild.roles.fetch();
      await guild.channels.fetch();
      await tryApplyBranding(guild, map);

      const rolesByName = new Map();
      for (const roleDef of map.roles) {
        const role = await ensureRole(guild, roleDef);
        rolesByName.set(roleDef.name, role);
      }

      for (const categoryDef of map.categories) {
        const category = await ensureCategory(guild, categoryDef.name);
        for (const channelDef of categoryDef.channels) {
          const channel = await ensureTextChannel(guild, category, channelDef, rolesByName);
          const body = content[channelDef.name]
            || channelStarters[channelDef.name]
            || map.starter_messages?.[channelDef.name]
            || "";
          const assets = map.starter_assets?.[channelDef.name] || [];
          await postStarter(channel, body, assets);
        }
      }

      console.log("The Trap House setup finished.");
      console.table(summary);
    } catch (error) {
      console.error("Setup failed:", error.message);
      process.exitCode = 1;
    } finally {
      client.destroy();
    }
  });

  await client.login(token);
}

main().catch((error) => {
  console.error("Setup failed:", error.message);
  process.exit(1);
});
