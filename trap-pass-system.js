(function () {
  const cfg = window.TRAP_HOUSE_CONFIG || {};
  const namespace = cfg.storageNamespace || "iho_trap_house_v1";
  const registryKey = `${namespace}:registry`;
  const currentPassKey = `${namespace}:current_pass_id`;
  const entryEmailCaptureKey = `${namespace}:entry_email_captures`;

  const missions = [
    {
      number: "001",
      title: "Spread The Signal",
      description: "Share the newest YouTube Short or IG Reel and post proof in Discord.",
      reward: "Trap Pass XP + website shoutout",
      status: "open"
    },
    {
      number: "002",
      title: "Clip Hunter",
      description: "Vote on the archive clip most ready to become the next reel.",
      reward: "Clip Hunter role upgrade",
      status: "open"
    },
    {
      number: "003",
      title: "Line Puller",
      description: "Pick the hardest sentence from a book excerpt for a promo graphic.",
      reward: "Line Puller credit",
      status: "open"
    },
    {
      number: "004",
      title: "Evidence Sorter",
      description: "Help label a batch of archive stills.",
      reward: "Hidden page access",
      status: "locked"
    },
    {
      number: "005",
      title: "Trap Architect",
      description: "Submit a name or concept for the next Trap Pass wave.",
      reward: "Member wall placement",
      status: "open"
    }
  ];

  const hiddenRooms = {
    room: {
      title: "First File",
      requirement: "Unlock Level 1",
      minUnlock: 1,
      wave: null,
      body: "The first locked file. This is where the author-profile figure lineup, bookshelf, music file, pass lore, and object stories become part of the pass-holder path."
    },
    "evidence-locker": {
      title: "Evidence File",
      requirement: "Unlock Level 2",
      minUnlock: 2,
      wave: null,
      body: "Photos, stills, objects, and proof fragments will live here once the archive content is approved."
    },
    "wave-1-ghost": {
      title: "Wave 1 Ghost",
      requirement: "Wave 1 or Unlock Level 3",
      minUnlock: 3,
      wave: 1,
      body: "Founder-wave material: early witness lore, first-door proof, and the pieces that mark who was here before the house got loud."
    },
    "deer-witness": {
      title: "Deer Witness",
      requirement: "Wave 2 or Unlock Level 3",
      minUnlock: 3,
      wave: 2,
      body: "Wave 2 witness file for deer-page lore, stills, and holder decisions."
    },
    "all-hands-on-deck": {
      title: "All Hands On Deck",
      requirement: "Wave 3",
      minUnlock: 1,
      wave: 3,
      body: "The current holder drop for roll calls and early archive decisions."
    },
    "og-scum-file": {
      title: "OG Scum File",
      requirement: "Unlock Level 4",
      minUnlock: 4,
      wave: null,
      body: "A high-access file for music demos, raw context, and collector-level drops."
    },
    "the-loop": {
      title: "The Loop",
      requirement: "Unlock Level 5",
      minUnlock: 5,
      wave: null,
      body: "The deepest loop: origin, repetition, collapse, and the pieces that keep circling back."
    }
  };

  const threadCatalog = [
    { id: "trap-pass-lore", title: "Trap Pass Lore", channel: "thread-trap-pass-lore", phase: 1 },
    { id: "public-project-witness", title: "Public Project / Witness", channel: "thread-public-witness", phase: 3 },
    { id: "addiction-machine", title: "Addiction Machine", channel: "thread-addiction-machine", phase: 2 },
    { id: "psychosis-loop", title: "Psychosis Loop", channel: "thread-psychosis-loop", phase: 5 },
    { id: "grief-loss", title: "Grief / Loss", channel: "thread-grief-loss", phase: 2 },
    { id: "cats-home-tenderness", title: "Cats / Home / Tenderness", channel: "thread-cats-home", phase: 2 },
    { id: "writing-inside-the-fire", title: "Writing Inside The Fire", channel: "thread-writing-fire", phase: 3 },
    { id: "money-desperation", title: "Money Desperation", channel: "thread-money-desperation", phase: 3 },
    { id: "system-mirror", title: "System Mirror", channel: "thread-crack-capitalism", phase: 4 },
    { id: "platform-war", title: "Platform War", channel: "thread-platform-war", phase: 4 },
    { id: "self-destruction-vs-creation", title: "Self-Destruction vs Creation", channel: "thread-self-destruction", phase: 4 },
    { id: "ending-convergence", title: "Ending Convergence", channel: "thread-ending-convergence", phase: 6 }
  ];

  const defaultThreadKeys = ["trap-pass-lore", "public-project-witness"];

  const passTemplates = {
    free_pull_up: {
      id: "free_pull_up",
      title: "Free Pull Up Pass",
      waveNumber: 0,
      waveName: "Pull Up Pass",
      tier: "Free Pull Up Pass",
      serialPrefix: "FREE",
      phrasePrefix: "PULL-UP",
      image: "/assets/trap-house/trap-pass-atm.png",
      badge: "Front Door",
      unlocks: ["first file", "updates", "Trap House CTA"]
    },
    wave_1_original_entry: {
      id: "wave_1_original_entry",
      title: "Wave 1 - Original Entry",
      waveNumber: 1,
      waveName: "Original Entry",
      tier: "Wave Pass",
      serialPrefix: "W1-OE",
      phrasePrefix: "ORIGINAL-ENTRY",
      image: "/assets/trap-house/og-crackpack-ticket.png",
      badge: "Closed Wave",
      unlocks: ["founder marker", "early witness lore", "day-one proof"]
    },
    wave_2_when_3_deer_appear: {
      id: "wave_2_when_3_deer_appear",
      title: "Wave 2 - When 3 Deer Appear",
      waveNumber: 2,
      waveName: "When 3 Deer Appear",
      tier: "Wave Pass",
      serialPrefix: "W2-3DA",
      phrasePrefix: "THREE-DEER",
      image: "/assets/trap-house/trap-wallet-open.png",
      badge: "Witness Wave",
      unlocks: ["deer witness file", "thread witness", "wave-specific story key"]
    },
    wave_3_all_hands_on_deck: {
      id: "wave_3_all_hands_on_deck",
      title: "Wave 3 - All Hands On Deck",
      waveNumber: 3,
      waveName: "All Hands On Deck",
      tier: "Wave Pass",
      serialPrefix: "W3-AHD",
      phrasePrefix: "BATTLE-STATIONS",
      image: "/assets/trap-house/trap-pass-wave3-blister.png",
      badge: "Archive Wave",
      unlocks: ["wave art", "holder drop", "thread-trap-pass-lore"]
    },
    gen_2_wave_1_no_brakes: {
      id: "gen_2_wave_1_no_brakes",
      title: "Gen 2 Wave 1 - No Brakes",
      waveNumber: 1,
      waveName: "No Brakes",
      tier: "Gen 2 Wave Pass",
      serialPrefix: "NB",
      phrasePrefix: "NO-BRAKES",
      image: "/assets/trap-house/trap-pass-gen2-wave1-no-brakes.png",
      badge: "Current Wave",
      unlocks: ["exclusive archive drops", "first access to new content", "Trap Pass holder events", "part of the story"]
    },
    artifact_pass: {
      id: "artifact_pass",
      title: "Artifact Pass",
      waveNumber: 3,
      waveName: "All Hands On Deck",
      tier: "Artifact Pass",
      serialPrefix: "ART-W3",
      phrasePrefix: "ARTIFACT",
      image: "/assets/trap-house/trap-wallet-open.png",
      badge: "Physical Twin",
      unlocks: ["physical fulfillment", "digital twin", "QR verification"]
    },
    crack_pack_holder: {
      id: "crack_pack_holder",
      title: "Gen 1 / Crack Pack Holder",
      waveNumber: 1,
      waveName: "Crack Pack",
      tier: "Gen 1 / Crack Pack Holder",
      serialPrefix: "GEN1",
      phrasePrefix: "CRACK-PACK",
      image: "/assets/trap-house/og-crackpack-ticket.png",
      badge: "Founder Status",
      unlocks: ["holder wall", "future stack bonuses", "documentary/preorder access"]
    }
  };

  function sanitize(value, maxLength) {
    return String(value || "")
      .replace(/[<>]/g, "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, maxLength || 160);
  }

  function normalizePassId(value) {
    return sanitize(value, 40).toUpperCase().replace(/\s+/g, "");
  }

  function normalizeEmail(value) {
    return sanitize(value, 220).toLowerCase();
  }

  function normalizeThreadKeys(value) {
    const known = new Set(threadCatalog.map((thread) => thread.id));
    const raw = Array.isArray(value) ? value : String(value || "").split(/[,|]/);
    const cleaned = raw
      .map((item) => sanitize(item, 80).toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-"))
      .filter((item) => known.has(item));
    return Array.from(new Set(cleaned)).slice(0, 5);
  }

  function getThreadDetails(passOrKeys) {
    const keys = Array.isArray(passOrKeys)
      ? normalizeThreadKeys(passOrKeys)
      : normalizeThreadKeys(passOrKeys?.thread_keys || defaultThreadKeys);
    const selected = keys.length ? keys : defaultThreadKeys;
    return selected
      .map((key) => threadCatalog.find((thread) => thread.id === key))
      .filter(Boolean);
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function makeId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("Trap Pass storage is not available.", error);
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Trap Pass storage could not be saved.", error);
      return false;
    }
  }

  function isLocalReviewHost() {
    return ["localhost", "127.0.0.1", "::1", ""].includes(window.location.hostname);
  }

  function hasSupabaseStorage() {
    return Boolean(cfg.supabaseEnabled && cfg.supabaseUrl && cfg.supabasePublishableKey);
  }

  async function supabaseRpc(functionName, payload) {
    if (!hasSupabaseStorage()) {
      throw new Error("Supabase is not configured yet.");
    }

    const response = await fetch(`${cfg.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        "apikey": cfg.supabasePublishableKey,
        "Authorization": `Bearer ${cfg.supabasePublishableKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload || {})
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Supabase ${functionName} failed: ${text || response.status}`);
    }

    return response.json();
  }

  function mergePassIntoRegistry(pass, privateFields = {}) {
    const shaped = ensurePassShape(pass);
    const safe = publicPass(shaped);
    if (!safe) return null;
    const registry = getRegistry();
    const existing = registry.find((item) => normalizePassId(item.trap_pass_id) === normalizePassId(safe.trap_pass_id));
    const record = {
      id: sanitize(privateFields.id || existing?.id, 120) || makeId(),
      trap_pass_id: safe.trap_pass_id,
      template_id: safe.template_id,
      tier: safe.tier,
      wave_number: Number(safe.wave_number || cfg.defaultWaveNumber || 3),
      wave_name: sanitize(safe.wave_name || cfg.defaultWaveName || "No Brakes", 80),
      serial_number: Number(safe.serial_number || 0),
      pass_phrase: safe.pass_phrase,
      codex_phrase: safe.pass_phrase,
      private_token: sanitize(privateFields.privateToken || shaped.private_token || existing?.private_token, 140) || generatePrivateToken(),
      qr_url: sanitize(privateFields.qrUrl || shaped.qr_url || existing?.qr_url, 240),
      pass_art_url: safe.pass_art_url,
      email: normalizeEmail(privateFields.email || existing?.email),
      display_name: sanitize(safe.display_name, 80) || "New Arrival",
      discord_username: sanitize(privateFields.discordUsername || existing?.discord_username, 80),
      wallet_address: sanitize(privateFields.walletAddress || existing?.wallet_address, 120),
      discord_role: sanitize(safe.discord_role || cfg.defaultDiscordRole || "No Brakes", 80),
      status: sanitize(safe.status || "active", 40),
      missions_completed: Number(safe.missions_completed || 0),
      unlock_level: Number(safe.unlock_level || 1),
      thread_keys: normalizeThreadKeys(safe.thread_keys).length ? normalizeThreadKeys(safe.thread_keys) : defaultThreadKeys,
      created_at: sanitize(safe.created_at || new Date().toISOString(), 40),
      claimed: safe.claimed !== false,
      claimed_at: sanitize(safe.claimed_at || safe.created_at || new Date().toISOString(), 50),
      perks: Array.isArray(shaped.perks) ? shaped.perks : [],
      stamps: Array.isArray(shaped.stamps) ? shaped.stamps : [],
      rooms_unlocked: Array.isArray(shaped.rooms_unlocked) ? shaped.rooms_unlocked : [],
      physical_required: Boolean(shaped.physical_required),
      physical_shipped: Boolean(shaped.physical_shipped),
      discount_code: sanitize(shaped.discount_code || existing?.discount_code, 80),
      updated_at: new Date().toISOString(),
      future_unlock_data: privateFields.futureUnlockData || shaped.future_unlock_data || existing?.future_unlock_data || {}
    };
    const nextRegistry = registry.some((item) => normalizePassId(item.trap_pass_id) === normalizePassId(record.trap_pass_id))
      ? registry.map((item) => normalizePassId(item.trap_pass_id) === normalizePassId(record.trap_pass_id) ? { ...item, ...record, id: item.id || record.id } : item)
      : [...registry, record];
    saveRegistry(nextRegistry);
    storageSet(currentPassKey, record.trap_pass_id);
    return record;
  }

  function captureEntryEmailLocal(input = {}) {
    const email = normalizeEmail(input.email);
    if (!email || !isEmail(email)) {
      throw new Error("Enter a valid email.");
    }
    const record = {
      email,
      source: sanitize(input.source || "entry_gate", 80),
      page_path: sanitize(input.pagePath || window.location.pathname, 260),
      captured_at: new Date().toISOString()
    };
    let captures = [];
    try {
      const parsed = JSON.parse(storageGet(entryEmailCaptureKey) || "[]");
      captures = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      captures = [];
    }
    captures = captures.filter((item) => normalizeEmail(item.email) !== email || sanitize(item.source, 80) !== record.source);
    captures.push(record);
    storageSet(entryEmailCaptureKey, JSON.stringify(captures, null, 2));
    return { ok: true, email, source: record.source, captured_at: record.captured_at, local_only: true };
  }

  async function captureEntryEmail(input = {}) {
    const email = normalizeEmail(input.email);
    if (!email || !isEmail(email)) {
      throw new Error("Enter a valid email.");
    }

    if (hasSupabaseStorage()) {
      try {
        return await supabaseRpc("capture_entry_email", {
          p_email: email,
          p_source: sanitize(input.source || "entry_gate", 80),
          p_page_path: sanitize(input.pagePath || window.location.pathname, 260),
          p_user_agent: sanitize(navigator.userAgent, 260),
          p_metadata: input.metadata || {}
        });
      } catch (error) {
        if (!isLocalReviewHost()) throw error;
        console.warn("Supabase email capture failed; using browser backup capture.", error);
      }
    }

    return captureEntryEmailLocal(input);
  }

  function getRegistry() {
    try {
      const raw = storageGet(registryKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Trap Pass registry could not be parsed.", error);
      return [];
    }
  }

  function saveRegistry(registry) {
    return storageSet(registryKey, JSON.stringify(registry, null, 2));
  }

  function maxSerialForWave(registry, waveNumber) {
    return registry.reduce((max, pass) => {
      if (Number(pass.wave_number) !== Number(waveNumber)) return max;
      return Math.max(max, Number(pass.serial_number) || 0);
    }, 0);
  }

  function generateTrapPassId(registry, waveNumber) {
    let serial = maxSerialForWave(registry, waveNumber) + 1;
    let passId = "";
    do {
      passId = `W${waveNumber}-${String(serial).padStart(5, "0")}`;
      serial += 1;
    } while (registry.some((pass) => pass.trap_pass_id === passId));
    return { trapPassId: passId, serialNumber: serial - 1 };
  }

  function normalizeTemplateId(value) {
    return sanitize(value, 80).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  }

  function getPassTemplates() {
    return Object.values(passTemplates);
  }

  function getTemplateById(templateId) {
    const id = normalizeTemplateId(templateId);
    return passTemplates[id] || passTemplates.free_pull_up;
  }

  function getTemplateForInput(input = {}) {
    const requested = normalizeTemplateId(input.templateId || input.template_id);
    if (requested && passTemplates[requested]) return passTemplates[requested];
    const cleanTier = sanitize(input.tier, 90).toLowerCase();
    if (cleanTier) {
      if (/free|pull\s*up/.test(cleanTier)) return passTemplates.free_pull_up;
      if (cleanTier === "wave pass") return passTemplates.gen_2_wave_1_no_brakes;
      if (/gen\s*2|no\s*brakes|wave\s*1/.test(cleanTier)) return passTemplates.gen_2_wave_1_no_brakes;
      const tierMatch = getPassTemplates().find((template) => template.tier.toLowerCase() === cleanTier);
      if (tierMatch) return tierMatch;
      if (/crack\s*pack|gen\s*1/.test(cleanTier)) return passTemplates.crack_pack_holder;
      if (/artifact|physical/.test(cleanTier)) return passTemplates.artifact_pass;
      if (/wave\s*3|all\s*hands/.test(cleanTier)) return passTemplates.wave_3_all_hands_on_deck;
    }
    return input.free ? passTemplates.free_pull_up : passTemplates.gen_2_wave_1_no_brakes;
  }

  function getTemplateForPass(pass = {}) {
    if (pass.template_id || pass.templateId) {
      return getTemplateById(pass.template_id || pass.templateId);
    }
    const passId = normalizePassId(pass.trap_pass_id || "");
    if (passId.startsWith("FREE-")) return passTemplates.free_pull_up;
    const legacyNoBrakesPrefix = "G2" + "W1-";
    if (passId.startsWith("NB-") || passId.startsWith(legacyNoBrakesPrefix)) return passTemplates.gen_2_wave_1_no_brakes;
    if (passId.startsWith("W3-AHD-")) return passTemplates.wave_3_all_hands_on_deck;
    if (passId.startsWith("W2-3DA-")) return passTemplates.wave_2_when_3_deer_appear;
    if (passId.startsWith("W1-OE-")) return passTemplates.wave_1_original_entry;
    if (passId.startsWith("ART-W3-")) return passTemplates.artifact_pass;
    if (passId.startsWith("GEN1-")) return passTemplates.crack_pack_holder;
    const wave = Number(pass.wave_number);
    if (wave === 1) return passTemplates.gen_2_wave_1_no_brakes;
    if (wave === 2) return passTemplates.wave_2_when_3_deer_appear;
    if (wave === 3) return passTemplates.wave_3_all_hands_on_deck;
    return passTemplates.free_pull_up;
  }

  function padSerial(template, serialNumber) {
    const digits = template.serialPrefix === "FREE" ? 6 : 4;
    return String(Math.max(1, Number(serialNumber) || 1)).padStart(digits, "0");
  }

  function generateSerialNumber(tierOrTemplate, waveNumber, serialNumber) {
    const template = typeof tierOrTemplate === "object"
      ? tierOrTemplate
      : getTemplateForInput({ tier: tierOrTemplate, waveNumber });
    return `${template.serialPrefix}-${padSerial(template, serialNumber)}`;
  }

  function generatePassPhrase(waveOrTemplate, serialNumber) {
    const template = typeof waveOrTemplate === "object"
      ? waveOrTemplate
      : getTemplateForInput({ waveNumber: waveOrTemplate });
    return `${template.phrasePrefix}-${padSerial(template, serialNumber)}`;
  }

  function generateCodexPhrase(waveOrTemplate, serialNumber) {
    return generatePassPhrase(waveOrTemplate, serialNumber);
  }

  function generatePrivateToken() {
    const bytes = new Uint8Array(18);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    return `tp_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }

  function getPublicPassUrl(passOrId) {
    const passId = typeof passOrId === "string" ? passOrId : passOrId?.trap_pass_id;
    return `/pass/?id=${encodeURIComponent(normalizePassId(passId))}`;
  }

  function getVerifyUrl(token) {
    const clean = sanitize(token, 120);
    return clean ? `/trap/verify?token=${encodeURIComponent(clean)}` : "";
  }

  function ensurePassShape(pass = {}) {
    const template = getTemplateForPass(pass);
    const serial = Number(pass.serial_number || 1);
    const trapPassId = normalizePassId(pass.trap_pass_id) || generateSerialNumber(template, template.waveNumber, serial);
    const passPhrase = normalizePassId(pass.pass_phrase || pass.codex_phrase || "") || generatePassPhrase(template, serial);
    const privateToken = sanitize(pass.private_token, 140) || generatePrivateToken();
    return {
      ...pass,
      trap_pass_id: trapPassId,
      template_id: template.id,
      tier: sanitize(pass.tier || template.tier, 90),
      wave_number: Number(pass.wave_number || template.waveNumber),
      wave_name: sanitize(pass.wave_name || template.waveName, 90),
      serial_number: serial,
      pass_phrase: passPhrase,
      codex_phrase: passPhrase,
      private_token: privateToken,
      qr_url: sanitize(pass.qr_url, 220) || getVerifyUrl(privateToken),
      pass_art_url: sanitize(pass.pass_art_url || template.image, 260),
      claimed: pass.claimed !== false,
      claimed_at: sanitize(pass.claimed_at || pass.created_at || new Date().toISOString(), 50),
      perks: Array.isArray(pass.perks) ? pass.perks : template.unlocks,
      stamps: Array.isArray(pass.stamps) ? pass.stamps : [],
      rooms_unlocked: Array.isArray(pass.rooms_unlocked) ? pass.rooms_unlocked : [],
      physical_required: Boolean(pass.physical_required),
      physical_shipped: Boolean(pass.physical_shipped)
    };
  }

  function findPassByToken(token) {
    const clean = sanitize(token, 140);
    if (!clean) return null;
    return getRegistry().find((pass) => sanitize(pass.private_token, 140) === clean) || null;
  }

  function getTrapPassPhase(pass) {
    if (!pass) {
      return { level: 0, id: "front-door", title: "Front Door" };
    }
    const unlock = Number(pass.unlock_level) || 0;
    const missions = Number(pass.missions_completed) || 0;
    const threads = getThreadDetails(pass);
    if (unlock >= 5) {
      return { level: 6, id: "metadata-ready", title: "Metadata Ready" };
    }
    if (unlock >= 4) {
      return { level: 5, id: "back-rooms", title: "Back Rooms" };
    }
    if (unlock >= 2) {
      return { level: 4, id: "archive-witness", title: "Archive Witness" };
    }
    if (missions >= 1) {
      return { level: 3, id: "mission-proof", title: "Mission Proof" };
    }
    if (threads.length) {
      return { level: 2, id: "thread-affinity", title: "Thread Witness" };
    }
    return { level: 1, id: "claim-pass", title: "Claim The Key" };
  }

  function publicPass(pass) {
    if (!pass) return null;
    const shaped = ensurePassShape(pass);
    const phase = getTrapPassPhase(shaped);
    const threadKeys = getThreadDetails(shaped).map((thread) => thread.id);
    return {
      trap_pass_id: shaped.trap_pass_id,
      template_id: shaped.template_id,
      tier: shaped.tier,
      wave_number: shaped.wave_number,
      wave_name: shaped.wave_name,
      serial_number: shaped.serial_number,
      pass_phrase: shaped.pass_phrase,
      display_name: shaped.display_name,
      discord_role: shaped.discord_role,
      status: shaped.status,
      missions_completed: shaped.missions_completed,
      unlock_level: shaped.unlock_level,
      thread_keys: threadKeys,
      phase_level: phase.level,
      phase_name: phase.title,
      claimed: shaped.claimed,
      claimed_at: shaped.claimed_at,
      created_at: shaped.created_at,
      pass_art_url: shaped.pass_art_url,
      public_url: getPublicPassUrl(shaped.trap_pass_id),
      qr_target: getPublicPassUrl(shaped.trap_pass_id),
      perks: Array.isArray(shaped.perks) ? shaped.perks.slice(0, 8).map((item) => sanitize(item, 80)) : [],
      stamps: Array.isArray(shaped.stamps) ? shaped.stamps.slice(0, 12).map((item) => sanitize(item, 80)) : [],
      rooms_unlocked: Array.isArray(shaped.rooms_unlocked) ? shaped.rooms_unlocked.slice(0, 12).map((item) => sanitize(item, 80)) : [],
      physical_required: Boolean(shaped.physical_required),
      physical_shipped: Boolean(shaped.physical_shipped)
    };
  }

  function createTrapPass(input) {
    if (!cfg.passClaimsEnabled) {
      throw new Error("Trap Pass claims open after live storage and role mapping are ready.");
    }
    const registry = getRegistry();
    const email = normalizeEmail(input.email);
    if (!email || !isEmail(email)) {
      throw new Error("Enter a valid email before claiming a Trap Pass.");
    }

    const template = getTemplateForInput(input);
    const existing = registry.find((pass) => normalizeEmail(pass.email) === email);
    if (existing) {
      const submittedThreadKeys = input.threadKeys !== undefined ? normalizeThreadKeys(input.threadKeys) : null;
      const shapedExisting = ensurePassShape({ ...existing, template_id: existing.template_id || template.id });
      const updatedExisting = {
        ...shapedExisting,
        display_name: sanitize(input.displayName || shapedExisting.display_name, 80),
        discord_username: sanitize(input.discordUsername || shapedExisting.discord_username, 80),
        wallet_address: sanitize(input.walletAddress || shapedExisting.wallet_address, 120),
        thread_keys: submittedThreadKeys && submittedThreadKeys.length ? submittedThreadKeys : getThreadDetails(shapedExisting).map((thread) => thread.id),
        updated_at: new Date().toISOString()
      };
      const nextRegistry = registry.map((pass) => pass.id === existing.id ? updatedExisting : pass);
      if (!saveRegistry(nextRegistry)) {
        throw new Error("This browser blocked saving, so the Trap Pass could not be saved.");
      }
      storageSet(currentPassKey, updatedExisting.trap_pass_id);
      return { pass: updatedExisting, existed: true };
    }

    const waveNumber = Number(template.waveNumber || cfg.defaultWaveNumber || 3);
    let serialNumber = maxSerialForWave(registry, waveNumber) + 1;
    let trapPassId = generateSerialNumber(template, waveNumber, serialNumber);
    while (registry.some((pass) => normalizePassId(pass.trap_pass_id) === normalizePassId(trapPassId))) {
      serialNumber += 1;
      trapPassId = generateSerialNumber(template, waveNumber, serialNumber);
    }
    const now = new Date().toISOString();
    const submittedThreadKeys = normalizeThreadKeys(input.threadKeys);
    const privateToken = generatePrivateToken();
    const pass = {
      id: makeId(),
      trap_pass_id: trapPassId,
      template_id: template.id,
      tier: sanitize(input.tier || template.tier, 90),
      wave_number: waveNumber,
      wave_name: sanitize(template.waveName || cfg.defaultWaveName || "No Brakes", 80),
      serial_number: serialNumber,
      pass_phrase: generatePassPhrase(template, serialNumber),
      codex_phrase: generatePassPhrase(template, serialNumber),
      private_token: privateToken,
      qr_url: getVerifyUrl(privateToken),
      pass_art_url: template.image,
      email,
      display_name: sanitize(input.displayName, 80) || "New Arrival",
      discord_username: sanitize(input.discordUsername, 80),
      wallet_address: sanitize(input.walletAddress, 120),
      discord_role: sanitize(input.discordRole || template.badge || cfg.defaultDiscordRole || "No Brakes", 80),
      status: "active",
      missions_completed: 0,
      unlock_level: 1,
      thread_keys: submittedThreadKeys.length ? submittedThreadKeys : defaultThreadKeys,
      claimed: true,
      claimed_at: now,
      perks: template.unlocks,
      stamps: [],
      rooms_unlocked: ["start-here", "project", "threads", "discord"],
      physical_required: template.id === "artifact_pass" || template.id === "crack_pack_holder",
      physical_shipped: false,
      discount_code: "",
      created_at: now,
      updated_at: now,
      future_unlock_data: {}
    };

    registry.push(pass);
    if (!saveRegistry(registry)) {
      throw new Error("This browser blocked saving, so the Trap Pass could not be saved.");
    }
    storageSet(currentPassKey, pass.trap_pass_id);
    return { pass, existed: false };
  }

  function findPass(query) {
    const clean = sanitize(query, 220);
    const registry = getRegistry();
    if (!clean) return null;
    if (clean.includes("@")) {
      const email = normalizeEmail(clean);
      const pass = registry.find((record) => normalizeEmail(record.email) === email) || null;
      return pass ? ensurePassShape(pass) : null;
    }
    const passId = normalizePassId(clean);
    const pass = registry.find((record) => (
      normalizePassId(record.trap_pass_id) === passId ||
      normalizePassId(record.pass_phrase || record.codex_phrase) === passId
    )) || null;
    return pass ? ensurePassShape(pass) : null;
  }

  async function createTrapPassAsync(input) {
    if (!cfg.passClaimsEnabled) {
      throw new Error("Trap Pass claims open after live storage and role mapping are ready.");
    }

    const email = normalizeEmail(input.email);
    if (!email || !isEmail(email)) {
      throw new Error("Enter a valid email before claiming a Trap Pass.");
    }

    if (hasSupabaseStorage()) {
      try {
        const threadKeys = normalizeThreadKeys(input.threadKeys);
        const template = getTemplateForInput(input);
        const payload = {
          p_email: email,
          p_display_name: sanitize(input.displayName, 80),
          p_discord_username: sanitize(input.discordUsername, 80),
          p_wallet_address: sanitize(input.walletAddress, 120),
          p_thread_keys: threadKeys.length ? threadKeys : null,
          p_tier: sanitize(input.tier || template.tier, 90),
          p_template_id: template.id
        };
        let result;
        try {
          result = await supabaseRpc("claim_trap_pass", payload);
        } catch (rpcError) {
          if (!/p_tier|p_template_id|function|schema cache|claim_trap_pass/i.test(String(rpcError?.message || ""))) {
            throw rpcError;
          }
          const { p_tier, p_template_id, ...legacyPayload } = payload;
          result = await supabaseRpc("claim_trap_pass", legacyPayload);
        }
        const record = mergePassIntoRegistry(result.pass, {
          email,
          discordUsername: input.discordUsername,
          walletAddress: input.walletAddress
        });
        return {
          pass: record || result.pass,
          existed: Boolean(result.existed),
          remote: true
        };
      } catch (error) {
        if (!isLocalReviewHost()) throw error;
        console.warn("Supabase Trap Pass claim failed; using browser backup storage.", error);
      }
    }

    return { ...createTrapPass(input), remote: false };
  }

  async function findPassAsync(query) {
    const local = findPass(query);
    if (local) return local;

    if (hasSupabaseStorage()) {
      try {
        const result = await supabaseRpc("lookup_trap_pass_public", {
          p_query: sanitize(query, 220)
        });
        if (result?.found && result.pass) {
          return mergePassIntoRegistry(result.pass, {
            email: String(query || "").includes("@") ? query : ""
          });
        }
      } catch (error) {
        if (!isLocalReviewHost()) throw error;
        console.warn("Supabase Trap Pass lookup failed; using browser backup storage.", error);
      }
    }

    return null;
  }

  async function verifyTrapPassTokenAsync(token) {
    const local = findPassByToken(token);
    if (local) {
      storageSet(currentPassKey, local.trap_pass_id);
      return {
        verified: true,
        public_summary: publicPass(local),
        checked_at: new Date().toISOString()
      };
    }

    if (hasSupabaseStorage()) {
      try {
        const result = await supabaseRpc("verify_trap_pass_token", {
          p_token: sanitize(token, 140)
        });
        if (result?.found && result.pass) {
          const record = mergePassIntoRegistry(result.pass);
          return {
            verified: true,
            public_summary: publicPass(record || result.pass),
            checked_at: new Date().toISOString()
          };
        }
        return {
          verified: false,
          public_summary: null,
          checked_at: new Date().toISOString()
        };
      } catch (error) {
        const message = String(error?.message || "");
        const missingRpc = /verify_trap_pass_token|function .* does not exist|schema cache/i.test(message);
        if (!missingRpc && !isLocalReviewHost()) throw error;
        if (missingRpc) {
          const fallback = await findPassAsync(token);
          if (fallback) {
            storageSet(currentPassKey, fallback.trap_pass_id);
            return {
              verified: true,
              public_summary: publicPass(fallback),
              checked_at: new Date().toISOString()
            };
          }
        }
        console.warn("Supabase Trap Pass token verification failed; using browser backup storage.", error);
      }
    }

    return {
      verified: false,
      public_summary: null,
      checked_at: new Date().toISOString()
    };
  }

  async function setCurrentPassAsync(query) {
    const pass = await findPassAsync(query);
    if (pass) {
      storageSet(currentPassKey, pass.trap_pass_id);
    }
    return pass;
  }

  function getCurrentPass() {
    const passId = storageGet(currentPassKey);
    return passId ? findPass(passId) : null;
  }

  function setCurrentPass(passId) {
    const pass = findPass(passId);
    if (pass) {
      storageSet(currentPassKey, pass.trap_pass_id);
    }
    return pass;
  }

  async function verifyTrapPassAsync(query) {
    const pass = await findPassAsync(query);
    if (!pass) {
      return {
        verified: false,
        applied_locally: false,
        error: "No Trap Pass found for that ID or email.",
        public_summary: null,
        roles: [],
        channels: [],
        rooms: [],
        checked_at: new Date().toISOString()
      };
    }
    storageSet(currentPassKey, pass.trap_pass_id);
    return getRoleAccessMapping(pass);
  }

  function canAccessRoom(roomKey, pass) {
    const room = hiddenRooms[roomKey];
    if (!room || !pass) return false;
    const unlock = Number(pass.unlock_level) || 0;
    const wave = Number(pass.wave_number) || 0;
    return unlock >= Number(room.minUnlock || 1) || (room.wave && wave === Number(room.wave));
  }

  function addUnique(list, value) {
    const clean = sanitize(value, 100);
    if (clean && !list.includes(clean)) {
      list.push(clean);
    }
  }

  function addChannel(list, name, access, reason) {
    const cleanName = sanitize(name, 100);
    if (!cleanName || list.some((channel) => channel.name === cleanName)) return;
    list.push({
      name: cleanName,
      access: sanitize(access, 40),
      reason: sanitize(reason, 220)
    });
  }

  function getRoleAccessMapping(pass) {
    if (!pass) return null;
    const safe = publicPass(pass);
    const roles = [];
    const channels = [];
    const unlock = Number(pass.unlock_level) || 0;
    const missions = Number(pass.missions_completed) || 0;
    const wave = Number(pass.wave_number) || 0;
    const phase = getTrapPassPhase(pass);
    const passThreads = getThreadDetails(pass);
    const template = getTemplateForPass(pass);
    const waveRoles = {
      1: "No Brakes",
      2: "When 3 Deer Appear",
      3: "All Hands On Deck"
    };
    const waveRole = template.id === "wave_1_original_entry" ? "Wave 1 Ghost" : waveRoles[wave];

    addUnique(roles, "New Arrival");
    addUnique(roles, "Trap Pass Holder");
    addUnique(roles, "Trashcan Fam");
    addUnique(roles, pass.discord_role);
    addUnique(roles, waveRole);
    if (missions >= 1) addUnique(roles, "Clip Hunter");
    if (missions >= 2) addUnique(roles, "Quote Miner");
    if (unlock >= 2) addUnique(roles, "Archivist");
    if (unlock >= 3) addUnique(roles, "Heavy Content OK");
    if (unlock >= 4) addUnique(roles, "Day One Dirt Witness");
    if (unlock >= 5) addUnique(roles, "Patreon Back Room");

    addChannel(channels, "knock-first", "read", "Front-door orientation.");
    addChannel(channels, "house-rules", "read", "Grimey house rules and safety spine.");
    addChannel(channels, "official-stash", "read", "Official links and project sources.");
    addChannel(channels, "announcements-from-the-couch", "read", "House-wide announcements.");
    addChannel(channels, "living-room", "post", "Main member room.");
    addChannel(channels, "new-faces-at-the-door", "post", "Arrival and intro room.");
    addChannel(channels, "tap-in", "post", "Daily signal and status posts.");
    addChannel(channels, "clip-reactions", "post", "React to archive clips and drops.");
    addChannel(channels, "quote-the-madness", "post", "Pull lines and writing fragments.");
    addChannel(channels, "trap-pass-counter", "post", "Pass check-in and role mapping.");
    addChannel(channels, "the-map-on-the-wall", "read", "The thread map and project wiring.");

    passThreads.forEach((thread) => {
      addChannel(channels, thread.channel, thread.id === "psychosis-loop" ? "post / slowmode" : "post", `${thread.title} thread room.`);
    });

    if (missions >= 1 || phase.level >= 3) {
      addChannel(channels, "thumbnail-court", "post", "Vote on thumbnails and frames.");
      addChannel(channels, "caption-lab", "post", "Shape captions and public copy.");
      addChannel(channels, "fan-art-and-edits", "post", "Member edits and artwork.");
      addChannel(channels, "music-lab", "post", "Soundtrack and demo direction.");
    }

    if (unlock >= 2 || phase.level >= 4) {
      addChannel(channels, "new-drops", "read", "Approved archive drops.");
      addChannel(channels, "archive-dives", "post", "Sort and discuss archive material.");
      addChannel(channels, "doc-war-room", "post", "Documentary build room.");
    }

    if (unlock >= 3) {
      addChannel(channels, "heavy-room", "post / nsfw / slowmode", "Heavy context room with basic safety boundaries.");
      addChannel(channels, "not-a-challenge", "post / nsfw / slowmode", "Unsafe footage context must stay documentary, not instructional.");
    }

    if (wave === 1 || unlock >= 4) addChannel(channels, "day-one-dirt-witnesses", "post", "Founder-wave and high-trust witness room.");
    if (wave === 2 || unlock >= 3) addChannel(channels, "thread-january-22", "post", "Origin and witness thread room.");
    if (wave === 1 || wave === 3) addChannel(channels, "thread-trap-pass-lore", "post", "Current Trap Pass lore room.");
    if (unlock >= 5) addChannel(channels, "patreon-back-room", "post", "Manual high-access back room.");

    const rooms = Object.entries(hiddenRooms).map(([key, room]) => ({
      key,
      title: room.title,
      route: `/${key}/`,
      unlocked: canAccessRoom(key, pass),
      requirement: room.requirement
    }));

    return {
      verified: true,
      applied_locally: true,
      public_summary: safe,
      roles,
      channels,
      rooms,
      checked_at: new Date().toISOString()
    };
  }

  function verifyTrapPass(query) {
    const pass = findPass(query);
    if (!pass) {
      return {
        verified: false,
        applied_locally: false,
        error: "No Trap Pass found for that ID or email.",
        public_summary: null,
        roles: [],
        channels: [],
        rooms: [],
        checked_at: new Date().toISOString()
      };
    }
    setCurrentPass(pass.trap_pass_id);
    return getRoleAccessMapping(pass);
  }

  const achievementBaggies = [
    {
      id: "front-door-key",
      title: "Front Door Key",
      condition: (pass) => Boolean(pass),
      description: "Claimed a Trap Pass and got a key to the map.",
      reward: "Base pass profile access"
    },
    {
      id: "no-brakes",
      title: "No Brakes",
      condition: (pass) => getTemplateForPass(pass).id === "gen_2_wave_1_no_brakes",
      description: "Entered during the Gen 2 Wave 1 push.",
      reward: "No Brakes role"
    },
    {
      id: "thread-witness",
      title: "Thread Witness",
      condition: (pass) => getThreadDetails(pass).length > 0,
      description: "Attached at least one story thread to the pass.",
      reward: "Thread access"
    },
    {
      id: "trap-pass-lore",
      title: "Trap Pass Lore",
      condition: (pass) => getThreadDetails(pass).some((thread) => thread.id === "trap-pass-lore"),
      description: "Carrying the key-and-pass wire.",
      reward: "#thread-trap-pass-lore"
    },
    {
      id: "archive-witness",
      title: "Archive Witness",
      condition: (pass) => Number(pass.unlock_level) >= 1,
      description: "Unlocked the first layer of archive visibility.",
      reward: "Archive drops"
    },
    {
      id: "clip-hunter",
      title: "Clip Hunter",
      condition: (pass) => Number(pass.missions_completed) >= 1,
      description: "Completed a mission or helped pick a clip.",
      reward: "Clip voting power"
    },
    {
      id: "line-puller",
      title: "Quote Miner",
      condition: (pass) => Number(pass.missions_completed) >= 2,
      description: "Pulled enough lines or mission work to affect public artifacts.",
      reward: "Quote credit"
    },
    {
      id: "thread-map-reader",
      title: "Map On The Wall",
      condition: (pass) => Number(getTrapPassPhase(pass).level) >= 2,
      description: "Reached the thread-map layer of the project.",
      reward: "Thread map visibility"
    },
    {
      id: "evidence-sorter",
      title: "Evidence Sorter",
      condition: (pass) => Number(pass.unlock_level) >= 2,
      description: "Earned access to proof fragments and object files.",
      reward: "Evidence File"
    },
    {
      id: "og-pack",
      title: "OG Pack",
      condition: (pass) => Number(pass.unlock_level) >= 4,
      description: "Deep-file collector status for rare drops and raw context.",
      reward: "OG Scum File"
    },
    {
      id: "inner-room",
      title: "Inner Circle",
      condition: (pass) => Number(pass.unlock_level) >= 5,
      description: "Deepest unlock currently mapped.",
      reward: "The Loop"
    }
  ];

  function getAchievementBaggies(pass) {
    if (!pass) return [];
    return achievementBaggies.map((baggie) => {
      const earned = Boolean(baggie.condition(pass));
      return {
        id: baggie.id,
        title: baggie.title,
        description: baggie.description,
        reward: baggie.reward,
        earned,
        status: earned ? "earned" : "locked"
      };
    });
  }

  function getWalletInventory() {
    const passes = getRegistry().map((pass) => {
      const mapping = getRoleAccessMapping(pass);
      const phase = getTrapPassPhase(pass);
      return {
        pass: publicPass(pass),
        phase,
        threads: getThreadDetails(pass),
        roles: mapping.roles,
      rooms: mapping.rooms,
        channels: mapping.channels,
        baggies: getAchievementBaggies(pass)
      };
    });
    return {
      passes,
      current_pass_id: getCurrentPass()?.trap_pass_id || "",
      total_passes: passes.length,
      total_baggies_earned: passes.reduce((total, item) => total + item.baggies.filter((baggie) => baggie.earned).length, 0)
    };
  }

  function getTrapPassMetadata(pass) {
    const safe = publicPass(pass);
    if (!safe) return null;
    const phase = getTrapPassPhase(pass);
    const mapping = getRoleAccessMapping(pass);
    const baggies = getAchievementBaggies(pass).filter((baggie) => baggie.earned);
    return {
      name: `Trap Pass ${safe.trap_pass_id}`,
      description: "Shareable Trap Pass summary for IHOCAIHAG / The Trap House. Private email, private unlock notes, and system IDs are intentionally excluded.",
      image: safe.pass_art_url,
      external_url: `/pass/?id=${encodeURIComponent(safe.trap_pass_id)}`,
      public_summary: safe,
      phase: {
        level: phase.level,
        id: phase.id,
        title: phase.title
      },
      threads: getThreadDetails(pass).map((thread) => ({
        id: thread.id,
        title: thread.title,
        community_channel: thread.channel,
        pass_history: thread.phase
      })),
      roles: mapping.roles,
      trap_house_channels: mapping.channels.map((channel) => ({
        name: channel.name,
        access: channel.access,
        reason: channel.reason
      })),
      unlocked_files: mapping.rooms.filter((room) => room.unlocked).map((room) => ({
        key: room.key,
        title: room.title,
        route: room.route
      })),
      achievement_baggies: baggies.map((baggie) => ({
        id: baggie.id,
        title: baggie.title,
        reward: baggie.reward
      })),
      attributes: [
        { trait_type: "Tier", value: safe.tier },
        { trait_type: "Template", value: safe.template_id },
        { trait_type: "Wave", value: `Wave ${safe.wave_number}` },
        { trait_type: "Wave Name", value: safe.wave_name },
        { trait_type: "Serial", value: safe.serial_number },
        { trait_type: "Pass Phrase", value: safe.pass_phrase },
        { trait_type: "Unlock Level", value: safe.unlock_level },
        { trait_type: "Missions Completed", value: safe.missions_completed },
        { trait_type: "Pass History", value: phase.title },
        { trait_type: "Thread Count", value: safe.thread_keys.length },
        { trait_type: "Proof Baggies", value: baggies.length }
      ]
    };
  }

  function absoluteUrl(pathOrUrl) {
    const value = String(pathOrUrl || "");
    if (/^https?:\/\//i.test(value)) return value;
    return `${window.location.origin}${value.startsWith("/") ? value : `/${value}`}`;
  }

  function qrImageUrl(target) {
    const clean = absoluteUrl(target || "/trap/verify/");
    return `https://api.qrserver.com/v1/create-qr-code/?size=164x164&margin=8&data=${encodeURIComponent(clean)}`;
  }

  function renderTrapPassVisual(pass, options = {}) {
    const safe = publicPass(pass);
    if (!safe) return "";
    const template = getTemplateById(safe.template_id);
    const date = safe.claimed_at || safe.created_at;
    const entered = date ? new Date(date).toLocaleDateString() : "Pending";
    const target = options.privateView && pass?.qr_url ? pass.qr_url : safe.qr_target;
    const perks = safe.perks.length ? safe.perks : template.unlocks;
    return `
      <div class="trap-pass-visual" data-template="${escapeHTML(template.id)}">
        <img class="trap-pass-base" src="${escapeHTML(safe.pass_art_url)}" alt="${escapeHTML(template.title)} Trap Pass artwork" loading="lazy" />
        <div class="trap-pass-overlay">
          <div class="trap-pass-chip">
            <span>Serial</span>
            <strong>${escapeHTML(safe.trap_pass_id)}</strong>
          </div>
          <div class="trap-pass-chip phrase">
            <span>Pass Phrase</span>
            <strong>${escapeHTML(safe.pass_phrase)}</strong>
          </div>
          <div class="trap-pass-qr" title="Verification target">
            <img src="${escapeHTML(qrImageUrl(target))}" alt="Verification QR for ${escapeHTML(safe.trap_pass_id)}" loading="lazy" />
            <span>VERIFY</span>
          </div>
          <div class="trap-pass-strip">
            <strong>${escapeHTML(safe.tier)}</strong>
            <span>${escapeHTML(template.badge)} / ${escapeHTML(entered)}</span>
          </div>
          <div class="trap-pass-perks" aria-label="Pass unlock summary">
            ${perks.slice(0, 3).map((perk) => `<span>${escapeHTML(perk)}</span>`).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function getTrapPassIntegrationBundle(pass) {
    const safe = publicPass(pass);
    if (!safe) return null;
    return {
      verified: true,
      public_summary: safe,
      key_status: getTrapPassPhase(pass),
      role_access_mapping: getRoleAccessMapping(pass),
      achievement_baggies: getAchievementBaggies(pass),
      metadata: getTrapPassMetadata(pass),
      private_fields_excluded: ["email", "wallet_address", "id", "private_notes", "private_system_data"],
      exported_at: new Date().toISOString()
    };
  }

  function renderPassCard(pass, options = {}) {
    const safe = publicPass(pass);
    if (!safe) {
      return `<div class="notice error active"><strong>No Trap Pass found.</strong><p>Claim one or check your ID again.</p></div>`;
    }
    const date = safe.created_at ? new Date(safe.created_at).toLocaleDateString() : "Unknown";
    const profileLink = `/pass/?id=${encodeURIComponent(safe.trap_pass_id)}`;
    const threads = getThreadDetails(pass).map((thread) => thread.title).join(", ");
    return `
      <article class="pass-card">
        ${renderTrapPassVisual(pass, options)}
        <span class="pass-stamp">Digital Trap Pass</span>
        <div class="pass-id">${escapeHTML(safe.trap_pass_id)}</div>
        <p class="lead">${escapeHTML(safe.tier)} / Wave ${escapeHTML(safe.wave_number)} - ${escapeHTML(safe.wave_name)}</p>
        <div class="meta-list">
          <div><span>Holder</span><strong>${escapeHTML(safe.display_name)}</strong></div>
          <div><span>Pass Phrase</span><strong>${escapeHTML(safe.pass_phrase)}</strong></div>
          <div><span>Status</span><strong>${escapeHTML(safe.status)}</strong></div>
          <div><span>Discord Role</span><strong>${escapeHTML(safe.discord_role)}</strong></div>
          <div><span>Missions</span><strong>${escapeHTML(safe.missions_completed)} complete</strong></div>
          <div><span>Access</span><strong>Level ${escapeHTML(safe.unlock_level)}</strong></div>
          <div><span>Key Status</span><strong>${escapeHTML(safe.phase_name)}</strong></div>
          <div><span>Threads</span><strong>${escapeHTML(threads)}</strong></div>
          <div><span>Date Entered</span><strong>${escapeHTML(date)}</strong></div>
        </div>
        ${options.hideLink ? "" : `<div class="cta-row"><a class="button primary" href="${profileLink}">Open Pass Profile</a><a class="button" href="/trap-house/">Join The Trap House</a></div>`}
      </article>
    `;
  }

  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importRegistry(records) {
    if (!Array.isArray(records)) {
      throw new Error("Import file must be a JSON array.");
    }
    const seenPassIds = new Set();
    const seenEmails = new Set();
    const cleaned = records.map((record) => ensurePassShape({
      id: sanitize(record.id, 120) || makeId(),
      trap_pass_id: normalizePassId(record.trap_pass_id),
      template_id: normalizeTemplateId(record.template_id),
      tier: sanitize(record.tier, 90),
      wave_number: Number(record.wave_number || cfg.defaultWaveNumber || 3),
      wave_name: sanitize(record.wave_name || cfg.defaultWaveName, 80),
      serial_number: Number(record.serial_number || 0),
      pass_phrase: normalizePassId(record.pass_phrase || record.codex_phrase),
      private_token: sanitize(record.private_token, 140),
      qr_url: sanitize(record.qr_url, 240),
      pass_art_url: sanitize(record.pass_art_url, 260),
      email: normalizeEmail(record.email),
      display_name: sanitize(record.display_name, 80),
      discord_username: sanitize(record.discord_username, 80),
      wallet_address: sanitize(record.wallet_address, 120),
      discord_role: sanitize(record.discord_role || cfg.defaultDiscordRole, 80),
      status: sanitize(record.status || "active", 40),
      missions_completed: Number(record.missions_completed || 0),
      unlock_level: Number(record.unlock_level || 1),
      thread_keys: normalizeThreadKeys(record.thread_keys).length ? normalizeThreadKeys(record.thread_keys) : defaultThreadKeys,
      claimed: record.claimed !== false,
      claimed_at: sanitize(record.claimed_at || record.created_at || new Date().toISOString(), 50),
      perks: Array.isArray(record.perks) ? record.perks : [],
      stamps: Array.isArray(record.stamps) ? record.stamps : [],
      rooms_unlocked: Array.isArray(record.rooms_unlocked) ? record.rooms_unlocked : [],
      physical_required: Boolean(record.physical_required),
      physical_shipped: Boolean(record.physical_shipped),
      discount_code: sanitize(record.discount_code, 80),
      created_at: sanitize(record.created_at || new Date().toISOString(), 40),
      updated_at: new Date().toISOString(),
      future_unlock_data: record.future_unlock_data || {}
    })).filter((record) => {
      if (!record.trap_pass_id || !record.email || seenPassIds.has(record.trap_pass_id) || seenEmails.has(record.email)) {
        return false;
      }
      seenPassIds.add(record.trap_pass_id);
      seenEmails.add(record.email);
      return true;
    });
    if (!saveRegistry(cleaned)) {
      throw new Error("This browser blocked saving, so the import could not be saved.");
    }
    return cleaned;
  }

  function wireDiscordLinks() {
    document.querySelectorAll("[data-discord-link]").forEach((link) => {
      if (cfg.discordInviteUrl) {
        link.setAttribute("href", cfg.discordInviteUrl);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.removeAttribute("aria-disabled");
        link.removeAttribute("data-needs-discord-invite");
        return;
      }
      link.setAttribute("href", cfg.discordFallbackPath || "/discord/");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("data-needs-discord-invite", "true");
      if (/join|enter/i.test(link.textContent || "")) {
        link.textContent = "Discord Invite Pending";
      }
    });
  }

  const officialLinks = {
    discord: cfg.discordInviteUrl || "",
    instagram: cfg.instagramUrl || "",
    tiktok: cfg.tiktokUrl || "",
    threads: cfg.threadsUrl || "",
    youtube: cfg.youtubeUrl || "",
    x: cfg.xUrl || "",
    patreon: cfg.patreonUrl || "",
    spotify: cfg.spotifyUrl || "",
    appleMusic: cfg.appleMusicUrl || ""
  };

  function wireOfficialLinks() {
    document.querySelectorAll("[data-official-link]").forEach((link) => {
      const key = sanitize(link.getAttribute("data-official-link"), 40);
      const href = officialLinks[key];
      if (!href) {
        link.setAttribute("aria-disabled", "true");
        return;
      }
      link.setAttribute("href", href);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.removeAttribute("aria-disabled");
    });
  }

  function wirePassClaimState() {
    if (cfg.passClaimsEnabled) return;
    ["quickPassForm", "trapPassForm"].forEach((id) => {
      const form = document.getElementById(id);
      if (!form) return;
      const notice = document.createElement("div");
      notice.className = "notice active";
      notice.innerHTML = "<strong>Trap Pass claims are paused.</strong><p>Claims cannot reach live storage right now. No email was saved here.</p>";
      form.parentNode.insertBefore(notice, form);
      form.querySelectorAll("input, button").forEach((control) => {
        control.disabled = true;
      });
      const button = form.querySelector("button[type='submit']");
      if (button) button.textContent = "Claims Opening Soon";
    });
  }

  window.TrapHouse = {
    cfg,
    missions,
    hiddenRooms,
    threadCatalog,
    passTemplates,
    sanitize,
    escapeHTML,
    normalizeThreadKeys,
    getThreadDetails,
    getPassTemplates,
    getTemplateById,
    getTemplateForInput,
    generateSerialNumber,
    generatePassPhrase,
    generateCodexPhrase,
    generatePrivateToken,
    getPublicPassUrl,
    getVerifyUrl,
    getRegistry,
    saveRegistry,
    captureEntryEmail,
    createTrapPass,
    createTrapPassAsync,
    findPass,
    findPassAsync,
    findPassByToken,
    publicPass,
    getCurrentPass,
    setCurrentPass,
    setCurrentPassAsync,
    canAccessRoom,
    getTrapPassPhase,
    getRoleAccessMapping,
    verifyTrapPass,
    verifyTrapPassAsync,
    getAchievementBaggies,
    getWalletInventory,
    getTrapPassMetadata,
    getTrapPassIntegrationBundle,
    renderTrapPassVisual,
    renderPassCard,
    verifyTrapPassTokenAsync,
    downloadJSON,
    importRegistry,
    wireDiscordLinks,
    wireOfficialLinks,
    officialLinks
  };

  document.addEventListener("DOMContentLoaded", () => {
    wireDiscordLinks();
    wireOfficialLinks();
    wirePassClaimState();
  });
})();
