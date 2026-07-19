(function () {
  const siteConfig = window.TRAP_HOUSE_CONFIG || {};
  const passConfig = window.IHOCAIHAGTrapPassConfig || {};
  const storageConfig = passConfig.storage || {};
  const releases = Array.isArray(passConfig.releases) ? passConfig.releases : [];
  const tiers = Array.isArray(passConfig.tiers) ? passConfig.tiers : [];
  const stateKey = storageConfig.stateKey || "iho_trap_pass_v2:state";
  const sessionHolderKey = storageConfig.sessionHolderKey || "iho_trap_pass_v2:session_holder";
  const authAccessTokenKey = storageConfig.authAccessTokenKey || "iho_trap_pass_v2:auth_access";
  const publicWalletSessionKey = storageConfig.publicWalletSessionKey || "iho_trap_pass_v2:public_wallet:serial-v2";
  const legacyRegistryKey = storageConfig.legacyRegistryKey || "iho_trap_house_v1:registry";
  const legacyCurrentPassKey = storageConfig.legacyCurrentPassKey || "iho_trap_house_v1:current_pass_id";
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", ""]);
  const threadSlugs = [
    "roaring-rivers-silent-seas",
    "craving-the-chase-for-comfort",
    "the-ticking-of-time",
    "infinite-interactions",
    "how-a-home-can-hurt-or-heal",
    "the-shape-we-see-ourself",
    "love-lost",
    "love-found",
    "systems-of-rigid-design"
  ];

  function sanitize(value, maxLength = 160) {
    return String(value ?? "")
      .replace(/[<>\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, Math.max(0, maxLength));
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeEmail(value) {
    return sanitize(value, 220).toLowerCase();
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
  }

  function normalizeSerial(value) {
    return sanitize(value, 40).toUpperCase().replace(/\s+/g, "");
  }

  function normalizeThreadSlugs(value) {
    const raw = Array.isArray(value) ? value : String(value || "").split(/[,|]/);
    return Array.from(new Set(raw
      .map((item) => sanitize(item, 90).toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-"))
      .filter((item) => threadSlugs.includes(item))))
      .slice(0, threadSlugs.length);
  }

  function isLocalReviewHost() {
    return localHosts.has(window.location.hostname);
  }

  function localGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function localSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function sessionGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function sessionSet(key, value) {
    try {
      if (value) window.sessionStorage.setItem(key, value);
      else window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeInternalId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function getRelease(releaseId) {
    return releases.find((release) => release.id === releaseId || release.slug === releaseId || release.prefix === normalizeSerial(releaseId)) || null;
  }

  function getCurrentRelease() {
    return getRelease(passConfig.currentReleaseId) || releases.find((release) => release.status === "current") || null;
  }

  function legacyLiveSerialToHolderNumber(serialNumber) {
    const firstNumber = Number(passConfig.holderId?.firstNumber) || 100;
    return firstNumber + Math.max(0, (Number(serialNumber) || 1) - 1);
  }

  function holderNumberToLegacyLivePassId(holderNumber) {
    const firstNumber = Number(passConfig.holderId?.firstNumber) || 100;
    const legacySerial = Number(holderNumber) - firstNumber + 1;
    if (!Number.isFinite(legacySerial) || legacySerial < 1) return "";
    return `W3-${String(legacySerial).padStart(5, "0")}`;
  }

  function legacyLiveLookupQuery(value) {
    const clean = normalizeSerial(value);
    const holderMatch = clean.match(/^TP-(\d{4,})$/);
    if (holderMatch) return holderNumberToLegacyLivePassId(Number(holderMatch[1]));
    const currentRelease = getCurrentRelease();
    const currentPrefix = currentRelease?.prefix || "NB";
    const cardMatch = clean.match(new RegExp(`^${currentPrefix}-(\\d{4,})(?:-R[2-9]\\d*)?$`));
    if (cardMatch) return holderNumberToLegacyLivePassId(Number(cardMatch[1]));
    return clean;
  }

  function positiveInteger(value) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : 0;
  }

  function legacySerialFromPass(pass = {}) {
    const directSerial = [
      pass.serial_number,
      pass.serialNumber,
      pass.serial,
      pass.pass_serial,
      pass.passSerial
    ].map(positiveInteger).find(Boolean);
    if (directSerial) return directSerial;

    const passId = normalizeSerial(pass.trap_pass_id || pass.trapPassId || pass.pass_id || pass.passId);
    const idMatch = passId.match(/(?:^|[-_])0*(\d+)$/);
    return positiveInteger(idMatch?.[1]);
  }

  function holderNumberFromPublicPass(pass = {}) {
    const holderId = normalizeSerial(pass.holderPublicId || pass.holder_public_id || pass.holder_id || pass.holderId);
    const holderMatch = holderId.match(/^TP-(\d{4,})$/);
    if (holderMatch) return positiveInteger(holderMatch[1]);
    const sourceSerial = legacySerialFromPass(pass);
    return sourceSerial ? legacyLiveSerialToHolderNumber(sourceSerial) : 0;
  }

  function publicClaimWalletFromLegacyPass(pass = {}) {
    const currentRelease = getCurrentRelease();
    const sourceSerial = legacySerialFromPass(pass);
    const holderNumber = holderNumberFromPublicPass(pass);
    if (!holderNumber) throw new Error("Trap Pass serial is unavailable. Reopen My Pass to refresh it from the live registry.");
    const holderPublicId = formatHolderId(holderNumber);
    const cardSerial = formatCardSerial(currentRelease, holderNumber);
    const timestamp = pass.created_at || nowIso();
    const trapIdentity = sanitize(pass.display_name || pass.displayName, passConfig.card?.maxTrapIdentityLength || 40);
    const featuredPass = {
      cardSerial,
      waveId: currentRelease?.id || "gen-2-wave-1-no-brakes",
      waveName: currentRelease?.name || "No Brakes",
      generation: currentRelease?.generation || 2,
      waveNumber: currentRelease?.waveNumber || 1,
      status: pass.status || "active",
      frontArtwork: currentRelease?.frontArtwork || "",
      backArtwork: currentRelease?.backArtwork || "",
      frontPlaceholder: currentRelease?.frontPlaceholder || "NO BRAKES",
      backPlaceholder: currentRelease?.backPlaceholder || "IHOCAIHAG TRAP PASS / NO BRAKES"
    };
    return {
      holderPublicId,
      sourcePassId: normalizeSerial(pass.trap_pass_id),
      sourceSerialNumber: sourceSerial,
      trapIdentity,
      displayIdentity: trapIdentity || holderPublicId,
      originalEntryWave: currentRelease?.name || "No Brakes",
      originalEntryWaveLabel: currentRelease?.name || "No Brakes",
      currentTierId: "free",
      currentTierLabel: "Free Pass",
      memberSince: timestamp,
      publicProfileEnabled: false,
      publicProfileUrl: "",
      selectedPublicThreadSlugs: [],
      cards: [featuredPass],
      featuredPass,
      fullWalletAvailable: false,
      publicClaimOnly: true
    };
  }

  function getTier(tierId) {
    const clean = sanitize(tierId, 90).toLowerCase();
    return tiers.find((tier) => tier.id === clean || tier.slug === clean || tier.name.toLowerCase() === clean)
      || tiers.find((tier) => tier.id === "free")
      || null;
  }

  function formatHolderId(holderNumber) {
    const prefix = passConfig.holderId?.prefix || "TP";
    const padding = Number(passConfig.holderId?.padding) || 4;
    return `${prefix}-${String(Number(holderNumber) || 0).padStart(padding, "0")}`;
  }

  function formatCardSerial(release, holderNumber, reissueNumber = 1) {
    if (!release) return "";
    const padding = Number(passConfig.cardSerial?.padding) || 4;
    const base = `${release.prefix}-${String(Number(holderNumber) || 0).padStart(padding, "0")}`;
    return reissueNumber > 1 ? `${base}-R${reissueNumber}` : base;
  }

  function emptyState() {
    return {
      version: Number(passConfig.version) || 2,
      nextHolderNumber: Number(passConfig.holderId?.firstNumber) || 100,
      holders: [],
      walletPasses: [],
      entitlements: [],
      contributions: [],
      releaseOverrides: {},
      migratedLegacyAt: ""
    };
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function canonicalTierId(value) {
    const clean = sanitize(value, 120).toLowerCase();
    if (clean.includes("handy sass")) return "handy-sass";
    if (clean.includes("cash for trash")) return "cash-for-trash";
    return "free";
  }

  function releaseFromLegacy(pass) {
    const waveName = sanitize(pass.wave_name, 100).toLowerCase();
    const templateId = sanitize(pass.template_id, 100).toLowerCase();
    const passId = normalizeSerial(pass.trap_pass_id);
    if (waveName.includes("ride or dies") || templateId.includes("original-entry") || /^W1-/.test(passId)) return getRelease("ride-or-dies");
    if (waveName.includes("3 deer") || /^W2-/.test(passId)) return getRelease("when-3-deer-appear");
    if (waveName.includes("all hands") || /^W3-/.test(passId)) return getRelease("all-hands-on-deck");
    if (waveName.includes("bring the storm") || /^W4-/.test(passId)) return getRelease("bring-the-storm");
    return getCurrentRelease();
  }

  function migrateLegacyState(state) {
    if (state.migratedLegacyAt || !isLocalReviewHost()) return state;
    const records = safeParse(localGet(legacyRegistryKey) || "[]", []);
    const usedNumbers = new Set(state.holders.map((holder) => Number(holder.holderNumber)));

    (Array.isArray(records) ? records : []).forEach((record) => {
      const emailNormalized = normalizeEmail(record.email);
      if (!emailNormalized || state.holders.some((holder) => holder.emailNormalized === emailNormalized)) return;
      const numeric = Number((normalizeSerial(record.trap_pass_id).match(/(\d{3,})/) || [])[1]);
      let holderNumber = Number.isFinite(numeric) && numeric > 0 ? numeric : state.nextHolderNumber;
      while (usedNumbers.has(holderNumber)) holderNumber += 1;
      usedNumbers.add(holderNumber);
      state.nextHolderNumber = Math.max(state.nextHolderNumber, holderNumber + 1);
      const release = releaseFromLegacy(record) || getCurrentRelease();
      const legacyGenerationOne = Number(release?.generation) === 1;
      const createdAt = sanitize(record.created_at || record.claimed_at, 50) || nowIso();
      const holder = {
        internalId: makeInternalId("holder"),
        holderNumber,
        holderPublicId: formatHolderId(holderNumber),
        email: emailNormalized,
        emailNormalized,
        emailVerifiedAt: "",
        authUserId: "",
        trapIdentity: ["new arrival", "example holder"].includes(sanitize(record.display_name, 40).toLowerCase()) ? "" : sanitize(record.display_name, passConfig.card?.maxTrapIdentityLength || 40),
        discordUsername: sanitize(record.discord_username, 80),
        originalEntryWaveId: release?.id || passConfig.currentReleaseId,
        memberSince: createdAt,
        currentTierId: canonicalTierId(record.tier),
        status: sanitize(record.status, 30) || "active",
        publicProfileEnabled: false,
        selectedPublicThreadSlugs: [],
        featuredPassSerial: "",
        legacyVerificationComplete: false,
        adminNotes: "",
        manualVerificationNotes: "",
        createdAt,
        updatedAt: nowIso()
      };
      const card = {
        internalId: makeInternalId("card"),
        holderInternalId: holder.internalId,
        waveId: release?.id || passConfig.currentReleaseId,
        cardSerial: formatCardSerial(release, holderNumber),
        claimedAt: createdAt,
        status: legacyGenerationOne ? "pending_verification" : "active",
        reissueNumber: 1,
        replacesCardId: "",
        replacedByCardId: "",
        legacyVerified: false,
        createdAt,
        updatedAt: nowIso()
      };
      holder.featuredPassSerial = card.cardSerial;
      state.holders.push(holder);
      state.walletPasses.push(card);
    });

    state.migratedLegacyAt = nowIso();
    return state;
  }

  function normalizeState(raw) {
    const state = raw && typeof raw === "object" ? raw : emptyState();
    state.version = Number(passConfig.version) || 2;
    state.nextHolderNumber = Math.max(Number(state.nextHolderNumber) || 0, Number(passConfig.holderId?.firstNumber) || 100);
    state.holders = Array.isArray(state.holders) ? state.holders : [];
    state.walletPasses = Array.isArray(state.walletPasses) ? state.walletPasses : [];
    state.entitlements = Array.isArray(state.entitlements) ? state.entitlements : [];
    state.contributions = Array.isArray(state.contributions) ? state.contributions : [];
    state.releaseOverrides = state.releaseOverrides && typeof state.releaseOverrides === "object" ? state.releaseOverrides : {};
    return migrateLegacyState(state);
  }

  function loadState() {
    return normalizeState(safeParse(localGet(stateKey) || "", null));
  }

  function saveState(state) {
    if (!isLocalReviewHost()) return false;
    return localSet(stateKey, JSON.stringify(normalizeState(state)));
  }

  function releaseWithOverride(state, release) {
    if (!release) return null;
    return { ...release, ...(state.releaseOverrides?.[release.id] || {}) };
  }

  function holderCards(state, holder) {
    return state.walletPasses
      .filter((card) => card.holderInternalId === holder.internalId)
      .sort((a, b) => {
        const releaseA = getRelease(a.waveId);
        const releaseB = getRelease(b.waveId);
        return (releaseA?.displayOrder || 0) - (releaseB?.displayOrder || 0) || String(a.claimedAt).localeCompare(String(b.claimedAt));
      });
  }

  function holderEntitlements(state, holder) {
    return state.entitlements.filter((entitlement) => entitlement.holderInternalId === holder.internalId);
  }

  function activeCashEntitlement(state, holder) {
    return holderEntitlements(state, holder).find((item) =>
      item.entitlementType === "cash-for-trash"
      && ["active", "complimentary", "temporary"].includes(item.status)
      && (!item.endsAt || new Date(item.endsAt).getTime() > Date.now()));
  }

  function hasHandySass(state, holder) {
    return holder.currentTierId === "handy-sass"
      || holderEntitlements(state, holder).some((item) => item.entitlementType === "handy-sass-lifetime" && item.status === "active");
  }

  function effectiveTier(state, holder) {
    if (hasHandySass(state, holder)) return getTier("handy-sass");
    if (activeCashEntitlement(state, holder)) return getTier("cash-for-trash");
    return getTier(holder.currentTierId) || getTier("free");
  }

  function safeCard(state, card, tier) {
    const release = releaseWithOverride(state, getRelease(card.waveId));
    return {
      cardSerial: card.cardSerial,
      waveId: release?.id || "",
      waveName: release?.name || "",
      generation: Number(release?.generation) || 0,
      waveNumber: Number(release?.waveNumber) || 0,
      releaseLabel: release ? `Gen ${release.generation} Wave ${release.waveNumber}` : "",
      claimedAt: card.claimedAt,
      status: card.status,
      reissueNumber: Number(card.reissueNumber) || 1,
      frontArtwork: release?.frontArtwork || "",
      backArtwork: release?.backArtwork || "",
      frontPlaceholder: release?.frontPlaceholder || "FRONT ART NEEDED",
      backPlaceholder: release?.backPlaceholder || "BACK ART NEEDED",
      tierId: tier?.id || "free",
      tierLabel: tier?.name || "Free Pass",
      tierTreatment: tier?.visualTreatment || "standard"
    };
  }

  function walletBundle(state, holder) {
    if (!holder || holder.status !== "active") return null;
    const tier = effectiveTier(state, holder);
    const originalRelease = releaseWithOverride(state, getRelease(holder.originalEntryWaveId));
    const cards = holderCards(state, holder).filter((card) => card.status !== "deleted").map((card) => safeCard(state, card, tier));
    const featuredPass = cards.find((card) => card.cardSerial === holder.featuredPassSerial)
      || cards.find((card) => card.waveId === holder.originalEntryWaveId && card.status === "active")
      || cards.find((card) => card.status === "active")
      || cards[0]
      || null;
    const availableReleases = releases
      .map((release) => releaseWithOverride(state, release))
      .filter((release) => release.claimEnabled && !release.legacyManualVerificationRequired)
      .filter((release) => !cards.some((card) => card.waveId === release.id && card.status === "active"))
      .map((release) => ({
        id: release.id,
        name: release.name,
        label: `Gen ${release.generation} Wave ${release.waveNumber}`,
        prefix: release.prefix
      }));
    const cash = activeCashEntitlement(state, holder);
    return {
      holderPublicId: holder.holderPublicId,
      trapIdentity: holder.trapIdentity || "",
      displayIdentity: holder.trapIdentity || holder.holderPublicId,
      originalEntryWaveId: originalRelease?.id || "",
      originalEntryWave: originalRelease?.name || "",
      originalEntryWaveLabel: originalRelease ? `Gen ${originalRelease.generation} Wave ${originalRelease.waveNumber}` : "",
      currentTierId: tier?.id || "free",
      currentTierLabel: tier?.name || "Free Pass",
      currentTierPublicLabel: tier?.publicLabel || "FREE PASS HOLDER",
      tierTreatment: tier?.visualTreatment || "standard",
      memberSince: holder.memberSince,
      publicProfileEnabled: Boolean(holder.publicProfileEnabled),
      selectedPublicThreadSlugs: normalizeThreadSlugs(holder.selectedPublicThreadSlugs),
      featuredPassSerial: featuredPass?.cardSerial || "",
      featuredPass,
      cards,
      availableReleases,
      personalUnlockCode: cash?.privateUnlockCode || "",
      cashForTrashActive: Boolean(cash),
      handySassLifetime: hasHandySass(state, holder),
      publicProfileUrl: passConfig.routes?.publicProfile
        ? passConfig.routes.publicProfile(holder.holderPublicId)
        : `/pass/${encodeURIComponent(holder.holderPublicId)}`
    };
  }

  function publicProfileFromHolder(state, holder) {
    if (!holder || holder.status !== "active") return { valid: false };
    if (!holder.publicProfileEnabled) {
      return {
        valid: true,
        publicProfileEnabled: false,
        private: true
      };
    }
    const wallet = walletBundle(state, holder);
    const contributions = state.contributions
      .filter((item) => item.holderInternalId === holder.internalId && item.status === "approved" && item.public === true)
      .map((item) => ({
        title: sanitize(item.title, 120),
        description: sanitize(item.description, 260),
        url: sanitize(item.url, 260)
      }));
    return {
      valid: true,
      publicProfileEnabled: true,
      private: false,
      trapIdentity: wallet.trapIdentity,
      holderPublicId: wallet.holderPublicId,
      originalEntryWave: wallet.originalEntryWave,
      originalEntryWaveLabel: wallet.originalEntryWaveLabel,
      currentTierLabel: wallet.currentTierLabel,
      memberSince: wallet.memberSince,
      featuredPass: wallet.featuredPass,
      selectedPublicThreads: wallet.selectedPublicThreadSlugs,
      approvedContributions: contributions,
      publicProfileUrl: wallet.publicProfileUrl
    };
  }

  function findHolderByPublicId(state, value) {
    const clean = normalizeSerial(value);
    return state.holders.find((holder) => holder.holderPublicId === clean) || null;
  }

  function findCardBySerial(state, value) {
    const clean = normalizeSerial(value);
    return state.walletPasses.find((card) => card.cardSerial === clean) || null;
  }

  function getSessionHolder(state) {
    const holderPublicId = normalizeSerial(sessionGet(sessionHolderKey));
    return holderPublicId ? findHolderByPublicId(state, holderPublicId) : null;
  }

  function setSessionHolder(holderPublicId) {
    return sessionSet(sessionHolderKey, normalizeSerial(holderPublicId));
  }

  function savePublicWalletSession(wallet) {
    try {
      if (wallet) {
        window.sessionStorage.setItem(publicWalletSessionKey, JSON.stringify(wallet));
      } else {
        window.sessionStorage.removeItem(publicWalletSessionKey);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadPublicWalletSession() {
    try {
      const raw = window.sessionStorage.getItem(publicWalletSessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function signOut() {
    sessionSet(sessionHolderKey, "");
    sessionSet(authAccessTokenKey, "");
    savePublicWalletSession(null);
  }

  function setAuthenticatedSession(accessToken) {
    const token = sanitize(accessToken, 4096);
    if (!token) return false;
    return sessionSet(authAccessTokenKey, token);
  }

  function getAuthAccessToken() {
    return sessionGet(authAccessTokenKey) || "";
  }

  function nextHolderNumber(state) {
    let candidate = Math.max(Number(state.nextHolderNumber) || 0, Number(passConfig.holderId?.firstNumber) || 100);
    const used = new Set(state.holders.map((holder) => Number(holder.holderNumber)));
    while (used.has(candidate)) candidate += 1;
    state.nextHolderNumber = candidate + 1;
    return candidate;
  }

  function createWalletCard(state, holder, release, options = {}) {
    if (!holder || !release) throw new Error("This Trap Pass release is unavailable.");
    const existing = holderCards(state, holder).find((card) => card.waveId === release.id && card.status === "active");
    if (existing) return { card: existing, existed: true };
    const reissueNumber = Math.max(1, Number(options.reissueNumber) || 1);
    const card = {
      internalId: makeInternalId("card"),
      holderInternalId: holder.internalId,
      waveId: release.id,
      cardSerial: formatCardSerial(release, holder.holderNumber, reissueNumber),
      claimedAt: options.claimedAt || nowIso(),
      status: options.status || "active",
      reissueNumber,
      replacesCardId: options.replacesCardId || "",
      replacedByCardId: "",
      legacyVerified: Boolean(options.legacyVerified),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    state.walletPasses.push(card);
    if (!holder.featuredPassSerial) holder.featuredPassSerial = card.cardSerial;
    holder.updatedAt = nowIso();
    return { card, existed: false };
  }

  function claimHolderLocal(input = {}) {
    const emailNormalized = normalizeEmail(input.email);
    if (!isEmail(emailNormalized)) throw new Error("Enter a valid email.");
    const state = loadState();
    const currentRelease = releaseWithOverride(state, getCurrentRelease());
    if (!currentRelease?.claimEnabled) throw new Error("This Trap Pass release is not open for claims.");
    let holder = state.holders.find((item) => item.emailNormalized === emailNormalized) || null;
    const existed = Boolean(holder);

    if (!holder) {
      const holderNumber = nextHolderNumber(state);
      const timestamp = nowIso();
      holder = {
        internalId: makeInternalId("holder"),
        holderNumber,
        holderPublicId: formatHolderId(holderNumber),
        email: emailNormalized,
        emailNormalized,
        emailVerifiedAt: timestamp,
        authUserId: "",
        trapIdentity: sanitize(input.trapIdentity || input.displayName, passConfig.card?.maxTrapIdentityLength || 40),
        discordUsername: sanitize(input.discordUsername, 80),
        originalEntryWaveId: currentRelease.id,
        memberSince: timestamp,
        currentTierId: "free",
        status: "active",
        publicProfileEnabled: Boolean(input.publicProfileEnabled),
        selectedPublicThreadSlugs: normalizeThreadSlugs(input.selectedPublicThreadSlugs),
        featuredPassSerial: "",
        legacyVerificationComplete: false,
        adminNotes: "",
        manualVerificationNotes: "",
        createdAt: timestamp,
        updatedAt: timestamp
      };
      state.holders.push(holder);
    } else {
      holder.trapIdentity = sanitize(input.trapIdentity || input.displayName || holder.trapIdentity, passConfig.card?.maxTrapIdentityLength || 40);
      holder.discordUsername = sanitize(input.discordUsername || holder.discordUsername, 80);
      if (input.publicProfileEnabled !== undefined) holder.publicProfileEnabled = Boolean(input.publicProfileEnabled);
      holder.updatedAt = nowIso();
    }

    const cardResult = createWalletCard(state, holder, currentRelease);
    if (!saveState(state)) throw new Error("This browser could not save the local review wallet.");
    setSessionHolder(holder.holderPublicId);
    return {
      ok: true,
      existed,
      duplicatePrevented: cardResult.existed,
      wallet: walletBundle(state, holder)
    };
  }

  async function supabaseRpc(functionName, payload, options = {}) {
    if (!siteConfig.supabaseUrl || !siteConfig.supabasePublishableKey) {
      throw new Error("Secure Trap Pass service is unavailable.");
    }
    const token = options.accessToken || getAuthAccessToken() || siteConfig.supabasePublishableKey;
    const response = await fetch(`${siteConfig.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        apikey: siteConfig.supabasePublishableKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload || {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error("We could not load your pass. Try again.");
      error.code = data.code || "trap_pass_request_failed";
      throw error;
    }
    return data;
  }

  async function captureEntryEmail(input = {}) {
    const email = normalizeEmail(input.email);
    if (!isEmail(email)) throw new Error("Enter a valid email.");
    if (isLocalReviewHost()) return { ok: true, localOnly: true };
    return supabaseRpc("capture_entry_email", {
      p_email: email,
      p_source: sanitize(input.source || "trap_pass", 80),
      p_page_path: window.location.pathname,
      p_user_agent: sanitize(window.navigator?.userAgent, 260),
      p_metadata: {}
    });
  }

  function walletEndpoint() {
    return sanitize(siteConfig.trapPassWalletEndpoint, 260);
  }

  async function lookupServerWalletAsync(query, options = {}) {
    const endpoint = walletEndpoint();
    if (!endpoint) return null;
    const raw = sanitize(query, 220);
    if (!raw) return null;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: raw })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "wallet_lookup_failed");

    const wallet = data?.wallet || null;
    if (wallet?.holderPublicId && options.save !== false) savePublicWalletSession(wallet);
    if (!wallet && options.save !== false) savePublicWalletSession(null);
    return wallet;
  }

  async function lookupPublicWalletAsync(query) {
    const raw = sanitize(query, 220);
    if (!raw) throw new Error("Enter your claim email or pass ID.");
    try {
      const serverWallet = await lookupServerWalletAsync(raw);
      if (serverWallet) return serverWallet;
    } catch (error) {
      console.warn("Server Trap Pass wallet lookup failed:", error.message);
    }
    if (!passConfig.claims?.publicLookupRpc) return null;
    const lookupQuery = raw.includes("@") ? normalizeEmail(raw) : legacyLiveLookupQuery(raw);
    const lookup = await supabaseRpc(passConfig.claims.publicLookupRpc, { p_query: lookupQuery });
    const pass = lookup?.pass || lookup?.[0]?.pass || null;
    if (!pass) {
      savePublicWalletSession(null);
      return null;
    }
    const wallet = publicClaimWalletFromLegacyPass(pass);
    savePublicWalletSession(wallet);
    return wallet;
  }

  async function requestAccessAsync(email) {
    const clean = normalizeEmail(email);
    if (!isEmail(clean)) throw new Error("Enter a valid email.");
    if (isLocalReviewHost()) {
      const state = loadState();
      const holder = state.holders.find((item) => item.emailNormalized === clean);
      if (holder) setSessionHolder(holder.holderPublicId);
      return {
        ok: true,
        localReview: true,
        message: holder
          ? "Local review wallet opened."
          : "No local review wallet exists for that email."
      };
    }
    if (passConfig.claims?.publicLookupRpc) {
      const wallet = await lookupPublicWalletAsync(clean);
      return {
        ok: true,
        wallet,
        publicClaimOnly: Boolean(wallet),
        message: wallet
          ? "My Pass opened."
          : "No Trap Pass was found for that email yet. Claim your free pass first."
      };
    }
    await captureEntryEmail({ email: clean, source: "trap_pass_recovery" });
    return {
      ok: true,
      verificationRequired: true,
      blocked: !passConfig.recovery?.emailProviderConfigured,
      message: passConfig.recovery?.blockedMessage || "Check your email for a secure access link."
    };
  }

  async function claimHolderAsync(input = {}) {
    if (isLocalReviewHost()) return claimHolderLocal(input);
    const accessToken = getAuthAccessToken();
    if (!accessToken) {
      if (passConfig.claims?.publicFreeClaimsEnabled && passConfig.claims?.publicFreeClaimRpc) {
        const result = await supabaseRpc(passConfig.claims.publicFreeClaimRpc, {
          p_email: input.email,
          p_display_name: sanitize(input.trapIdentity || input.displayName, passConfig.card?.maxTrapIdentityLength || 40),
          p_discord_username: sanitize(input.discordUsername, 80),
          p_wallet_address: "",
          p_thread_keys: ["trap-pass-lore", "public-project-witness"]
        });
        const pass = result?.pass || result?.[0]?.pass || null;
        if (!pass) throw new Error("Trap Pass claim did not return a pass.");
        const wallet = publicClaimWalletFromLegacyPass(pass);
        savePublicWalletSession(wallet);
        return {
          ok: true,
          existed: Boolean(result.existed),
          publicClaimOnly: true,
          wallet
        };
      }
      await captureEntryEmail({ email: input.email, source: "trap_pass_claim" });
      return {
        ok: true,
        verificationRequired: true,
        blocked: !passConfig.recovery?.emailProviderConfigured,
        message: passConfig.recovery?.blockedMessage || "Check your email for a secure access link."
      };
    }
    const wallet = await supabaseRpc("trap_pass_claim_current_release", {
      p_trap_identity: sanitize(input.trapIdentity || input.displayName, passConfig.card?.maxTrapIdentityLength || 40),
      p_discord_username: sanitize(input.discordUsername, 80),
      p_public_profile_enabled: Boolean(input.publicProfileEnabled)
    }, { accessToken });
    if (wallet?.holderPublicId) setSessionHolder(wallet.holderPublicId);
    return { ok: true, existed: Boolean(wallet?.existed), wallet };
  }

  async function getMyWalletAsync() {
    if (isLocalReviewHost()) {
      const state = loadState();
      return walletBundle(state, getSessionHolder(state));
    }
    const accessToken = getAuthAccessToken();
    if (!accessToken) return loadPublicWalletSession();
    return supabaseRpc("trap_pass_get_my_wallet", {}, { accessToken });
  }

  async function updateMyProfileAsync(input = {}) {
    if (isLocalReviewHost()) {
      const state = loadState();
      const holder = getSessionHolder(state);
      if (!holder) throw new Error("Open your wallet before changing your profile.");
      if (input.trapIdentity !== undefined) {
        holder.trapIdentity = sanitize(input.trapIdentity, passConfig.card?.maxTrapIdentityLength || 40);
      }
      if (input.publicProfileEnabled !== undefined) holder.publicProfileEnabled = Boolean(input.publicProfileEnabled);
      if (input.selectedPublicThreadSlugs !== undefined) holder.selectedPublicThreadSlugs = normalizeThreadSlugs(input.selectedPublicThreadSlugs);
      if (input.featuredPassSerial !== undefined) {
        const card = holderCards(state, holder).find((item) => item.cardSerial === normalizeSerial(input.featuredPassSerial) && item.status === "active");
        if (card) holder.featuredPassSerial = card.cardSerial;
      }
      holder.updatedAt = nowIso();
      saveState(state);
      return walletBundle(state, holder);
    }
    const accessToken = getAuthAccessToken();
    if (!accessToken) throw new Error("Use your secure email link to open My Pass.");
    return supabaseRpc("trap_pass_update_my_profile", {
      p_trap_identity: input.trapIdentity === undefined ? null : sanitize(input.trapIdentity, passConfig.card?.maxTrapIdentityLength || 40),
      p_public_profile_enabled: input.publicProfileEnabled === undefined ? null : Boolean(input.publicProfileEnabled),
      p_selected_public_thread_slugs: input.selectedPublicThreadSlugs === undefined ? null : normalizeThreadSlugs(input.selectedPublicThreadSlugs),
      p_featured_card_serial: input.featuredPassSerial === undefined ? null : normalizeSerial(input.featuredPassSerial)
    }, { accessToken });
  }

  async function claimNewReleaseAsync(releaseId) {
    const release = getRelease(releaseId);
    if (!release || !release.claimEnabled || release.legacyManualVerificationRequired) {
      throw new Error("That Trap Pass release is not available for self-service claims.");
    }
    if (isLocalReviewHost()) {
      const state = loadState();
      const holder = getSessionHolder(state);
      if (!holder) throw new Error("Open your wallet before claiming a new pass.");
      const result = createWalletCard(state, holder, release);
      if (result.existed) throw new Error("This release is already in your wallet.");
      saveState(state);
      return walletBundle(state, holder);
    }
    const accessToken = getAuthAccessToken();
    if (!accessToken) throw new Error("Use your secure email link to open My Pass.");
    return supabaseRpc("trap_pass_claim_release", { p_release_id: release.id }, { accessToken });
  }

  function isAcceptedSerialFormat(value) {
    const clean = normalizeSerial(value);
    return Boolean(passConfig.holderId?.pattern?.test(clean)
      || passConfig.cardSerial?.pattern?.test(clean)
      || passConfig.cardSerial?.legacyPattern?.test(clean));
  }

  function validateSerialLocal(value) {
    const clean = normalizeSerial(value);
    if (!isAcceptedSerialFormat(clean)) return { valid: false, status: "INVALID TRAP PASS" };
    const state = loadState();
    const holder = findHolderByPublicId(state, clean);
    if (holder) {
      if (holder.status !== "active") return { valid: false, status: "INVALID TRAP PASS" };
      return {
        valid: true,
        status: "VALID TRAP PASS",
        profileAvailable: Boolean(holder.publicProfileEnabled),
        profileUrl: holder.publicProfileEnabled
          ? (passConfig.routes?.publicProfile ? passConfig.routes.publicProfile(holder.holderPublicId) : `/pass/${holder.holderPublicId}`)
          : ""
      };
    }
    const card = findCardBySerial(state, clean);
    if (!card || card.status !== "active") return { valid: false, status: "INVALID TRAP PASS" };
    const release = getRelease(card.waveId);
    if (release?.legacyManualVerificationRequired && !card.legacyVerified) {
      return { valid: false, status: "INVALID TRAP PASS" };
    }
    const cardHolder = state.holders.find((item) => item.internalId === card.holderInternalId);
    if (!cardHolder || cardHolder.status !== "active") return { valid: false, status: "INVALID TRAP PASS" };
    return {
      valid: true,
      status: "VALID TRAP PASS",
      profileAvailable: Boolean(cardHolder.publicProfileEnabled),
      profileUrl: cardHolder.publicProfileEnabled
        ? (passConfig.routes?.publicProfile ? passConfig.routes.publicProfile(cardHolder.holderPublicId) : `/pass/${cardHolder.holderPublicId}`)
        : ""
    };
  }

  async function validateSerialAsync(value) {
    const clean = normalizeSerial(value);
    if (!isAcceptedSerialFormat(clean)) return { valid: false, status: "INVALID TRAP PASS" };
    if (isLocalReviewHost()) return validateSerialLocal(clean);
    try {
      const wallet = await lookupServerWalletAsync(clean, { save: false });
      if (wallet?.featuredPass || wallet?.cards?.length) {
        return { valid: true, status: "VALID TRAP PASS", profileAvailable: false, profileUrl: "" };
      }
    } catch (error) {
      console.warn("Server Trap Pass serial validation failed:", error.message);
    }
    if (passConfig.claims?.publicLookupRpc) {
      const lookup = await supabaseRpc(passConfig.claims.publicLookupRpc, { p_query: legacyLiveLookupQuery(clean) });
      const pass = lookup?.pass || lookup?.[0]?.pass || null;
      return pass
        ? { valid: true, status: "VALID TRAP PASS", profileAvailable: false, profileUrl: "" }
        : { valid: false, status: "INVALID TRAP PASS" };
    }
    const result = await supabaseRpc("trap_pass_validate_serial", { p_serial: clean });
    return result?.valid
      ? {
          valid: true,
          status: "VALID TRAP PASS",
          profileAvailable: Boolean(result.profileAvailable),
          profileUrl: result.profileAvailable ? sanitize(result.profileUrl, 260) : ""
        }
      : { valid: false, status: "INVALID TRAP PASS" };
  }

  async function getPublicProfileAsync(holderPublicId) {
    const clean = normalizeSerial(holderPublicId);
    if (!passConfig.holderId?.pattern?.test(clean) && !passConfig.cardSerial?.pattern?.test(clean) && !passConfig.cardSerial?.legacyPattern?.test(clean)) return { valid: false };
    if (isLocalReviewHost()) return publicProfileFromHolder(loadState(), findHolderByPublicId(loadState(), clean));
    try {
      const wallet = await lookupServerWalletAsync(clean, { save: false });
      if (wallet?.holderPublicId) {
        return {
          valid: true,
          private: true,
          publicProfileEnabled: false,
          holderPublicId: wallet.holderPublicId,
          trapIdentity: wallet.trapIdentity,
          originalEntryWaveLabel: wallet.originalEntryWaveLabel,
          currentTierLabel: wallet.currentTierLabel,
          memberSince: wallet.memberSince,
          featuredPass: wallet.featuredPass
        };
      }
    } catch (error) {
      console.warn("Server Trap Pass profile lookup failed:", error.message);
    }
    if (passConfig.claims?.publicLookupRpc) {
      const lookup = await supabaseRpc(passConfig.claims.publicLookupRpc, { p_query: legacyLiveLookupQuery(clean) });
      const pass = lookup?.pass || lookup?.[0]?.pass || null;
      if (!pass) return { valid: false };
      const wallet = publicClaimWalletFromLegacyPass(pass);
      return {
        valid: true,
        private: true,
        publicProfileEnabled: false,
        holderPublicId: wallet.holderPublicId,
        trapIdentity: wallet.trapIdentity,
        originalEntryWaveLabel: wallet.originalEntryWaveLabel,
        currentTierLabel: wallet.currentTierLabel,
        memberSince: wallet.memberSince,
        featuredPass: wallet.featuredPass
      };
    }
    const result = await supabaseRpc("trap_pass_public_profile", { p_holder_public_id: clean });
    if (!result?.valid) return { valid: false };
    return result;
  }

  function getCurrentHolderSummary() {
    if (!isLocalReviewHost() && !getAuthAccessToken()) {
      const publicWallet = loadPublicWalletSession();
      return publicWallet?.holderPublicId ? {
        holderPublicId: publicWallet.holderPublicId,
        trapIdentity: publicWallet.trapIdentity || "",
        publicProfileUrl: passConfig.routes?.publicProfile
          ? passConfig.routes.publicProfile(publicWallet.holderPublicId)
          : `/pass/${publicWallet.holderPublicId}`
      } : null;
    }
    const state = loadState();
    const holder = getSessionHolder(state);
    if (!holder) return null;
    return {
      holderPublicId: holder.holderPublicId,
      trapIdentity: holder.trapIdentity || "",
      publicProfileUrl: passConfig.routes?.publicProfile
        ? passConfig.routes.publicProfile(holder.holderPublicId)
        : `/pass/${holder.holderPublicId}`
    };
  }

  function generateUnlockCode(holderPublicId) {
    const random = new Uint8Array(4);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(random);
    else random.set([1, 2, 3, 4]);
    const suffix = Array.from(random).map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase();
    return `CFT-${normalizeSerial(holderPublicId).replace("-", "")}-${suffix}`;
  }

  function reissueCardLocal(state, holder, card) {
    if (!holder || !card || card.holderInternalId !== holder.internalId) throw new Error("Card not found.");
    const release = getRelease(card.waveId);
    const siblings = holderCards(state, holder).filter((item) => item.waveId === card.waveId);
    const nextReissue = Math.max(1, ...siblings.map((item) => Number(item.reissueNumber) || 1)) + 1;
    const replacement = createWalletCard(state, holder, release, {
      reissueNumber: nextReissue,
      replacesCardId: card.internalId,
      legacyVerified: card.legacyVerified
    }).card;
    card.status = "replaced";
    card.replacedByCardId = replacement.internalId;
    card.updatedAt = nowIso();
    if (holder.featuredPassSerial === card.cardSerial) holder.featuredPassSerial = replacement.cardSerial;
    return replacement;
  }

  function adminSearchLocal(query) {
    if (!isLocalReviewHost()) return [];
    const clean = sanitize(query, 220).toLowerCase();
    if (!clean) return [];
    const state = loadState();
    return state.holders
      .filter((holder) => {
        const cards = holderCards(state, holder);
        return holder.emailNormalized.includes(clean)
          || holder.holderPublicId.toLowerCase().includes(clean)
          || holder.trapIdentity.toLowerCase().includes(clean)
          || cards.some((card) => card.cardSerial.toLowerCase().includes(clean));
      })
      .slice(0, 20)
      .map((holder) => ({
        internalId: holder.internalId,
        email: holder.email,
        emailVerified: Boolean(holder.emailVerifiedAt),
        holderPublicId: holder.holderPublicId,
        trapIdentity: holder.trapIdentity,
        originalEntryWaveId: holder.originalEntryWaveId,
        currentTierId: holder.currentTierId,
        status: holder.status,
        publicProfileEnabled: holder.publicProfileEnabled,
        selectedPublicThreadSlugs: holder.selectedPublicThreadSlugs,
        legacyVerificationComplete: holder.legacyVerificationComplete,
        cards: holderCards(state, holder).map((card) => ({
          cardSerial: card.cardSerial,
          waveId: card.waveId,
          status: card.status,
          legacyVerified: card.legacyVerified
        }))
      }));
  }

  function adminActionLocal(action, payload = {}) {
    if (!isLocalReviewHost()) throw new Error("Protected admin service required.");
    const state = loadState();
    let holder = payload.holderPublicId ? findHolderByPublicId(state, payload.holderPublicId) : null;

    if (action === "create_holder") {
      if (!isEmail(payload.email)) throw new Error("A valid email is required.");
      const existing = state.holders.find((item) => item.emailNormalized === normalizeEmail(payload.email));
      if (existing) holder = existing;
      else {
        const holderNumber = payload.holderNumber ? Number(payload.holderNumber) : nextHolderNumber(state);
        if (state.holders.some((item) => Number(item.holderNumber) === holderNumber)) throw new Error("Holder number already exists.");
        holder = {
          internalId: makeInternalId("holder"),
          holderNumber,
          holderPublicId: formatHolderId(holderNumber),
          email: normalizeEmail(payload.email),
          emailNormalized: normalizeEmail(payload.email),
          emailVerifiedAt: payload.emailVerified ? nowIso() : "",
          authUserId: "",
          trapIdentity: sanitize(payload.trapIdentity, passConfig.card?.maxTrapIdentityLength || 40),
          discordUsername: "",
          originalEntryWaveId: payload.originalEntryWaveId || passConfig.currentReleaseId,
          memberSince: nowIso(),
          currentTierId: canonicalTierId(payload.currentTierId),
          status: "active",
          publicProfileEnabled: false,
          selectedPublicThreadSlugs: [],
          featuredPassSerial: "",
          legacyVerificationComplete: false,
          adminNotes: "",
          manualVerificationNotes: "",
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
        state.holders.push(holder);
      }
    }

    if (!holder) throw new Error("Holder not found.");

    if (action === "edit_identity") holder.trapIdentity = sanitize(payload.trapIdentity, passConfig.card?.maxTrapIdentityLength || 40);
    if (action === "correct_original_wave") holder.originalEntryWaveId = getRelease(payload.waveId)?.id || holder.originalEntryWaveId;
    if (action === "change_tier") holder.currentTierId = getTier(payload.tierId)?.id || holder.currentTierId;
    if (action === "set_public_profile") holder.publicProfileEnabled = Boolean(payload.enabled);
    if (action === "select_threads") holder.selectedPublicThreadSlugs = normalizeThreadSlugs(payload.threadSlugs);
    if (action === "deactivate_holder") holder.status = "deactivated";
    if (action === "reactivate_holder") holder.status = "active";
    if (action === "mark_legacy_verified") {
      holder.legacyVerificationComplete = true;
      holderCards(state, holder).filter((card) => getRelease(card.waveId)?.legacyManualVerificationRequired).forEach((card) => {
        card.legacyVerified = true;
        if (card.status === "pending_verification") card.status = "active";
      });
    }
    if (action === "add_card") {
      const release = getRelease(payload.waveId);
      createWalletCard(state, holder, release, {
        legacyVerified: Boolean(payload.legacyVerified),
        status: release?.legacyManualVerificationRequired && !payload.legacyVerified ? "pending_verification" : "active"
      });
    }
    if (action === "deactivate_card") {
      const card = findCardBySerial(state, payload.cardSerial);
      if (card?.holderInternalId === holder.internalId) card.status = "inactive";
    }
    if (action === "reissue_card") {
      const card = findCardBySerial(state, payload.cardSerial);
      reissueCardLocal(state, holder, card);
    }
    if (action === "complimentary_free") holder.currentTierId = "free";
    if (action === "complimentary_cash") {
      holder.currentTierId = holder.currentTierId === "handy-sass" ? "handy-sass" : "cash-for-trash";
      state.entitlements.push({
        internalId: makeInternalId("entitlement"),
        holderInternalId: holder.internalId,
        entitlementType: "cash-for-trash",
        status: "complimentary",
        startsAt: nowIso(),
        endsAt: "",
        privateUnlockCode: generateUnlockCode(holder.holderPublicId),
        source: "admin",
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    }
    if (action === "complimentary_handy") {
      holder.currentTierId = "handy-sass";
      state.entitlements.push({
        internalId: makeInternalId("entitlement"),
        holderInternalId: holder.internalId,
        entitlementType: "handy-sass-lifetime",
        status: "active",
        startsAt: nowIso(),
        endsAt: "",
        privateUnlockCode: "",
        source: "admin",
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    }
    if (action === "cancel_cash") {
      holderEntitlements(state, holder).filter((item) => item.entitlementType === "cash-for-trash").forEach((item) => {
        item.status = "canceled";
        item.privateUnlockCode = "";
        item.updatedAt = nowIso();
      });
      if (holder.currentTierId === "cash-for-trash") holder.currentTierId = "free";
    }
    if (action === "set_release") {
      const release = getRelease(payload.waveId);
      if (!release) throw new Error("Release not found.");
      state.releaseOverrides[release.id] = {
        ...(state.releaseOverrides[release.id] || {}),
        ...(payload.claimEnabled === undefined ? {} : { claimEnabled: Boolean(payload.claimEnabled) }),
        ...(payload.claimOpensAt === undefined ? {} : { claimOpensAt: sanitize(payload.claimOpensAt, 50) }),
        ...(payload.claimClosesAt === undefined ? {} : { claimClosesAt: sanitize(payload.claimClosesAt, 50) }),
        ...(payload.frontArtwork === undefined ? {} : { frontArtwork: sanitize(payload.frontArtwork, 260) }),
        ...(payload.backArtwork === undefined ? {} : { backArtwork: sanitize(payload.backArtwork, 260) })
      };
    }
    holder.updatedAt = nowIso();
    saveState(state);
    return {
      ok: true,
      holder: adminSearchLocal(holder.holderPublicId)[0] || null,
      wallet: walletBundle(state, holder)
    };
  }

  function drawContainedImage(context, image, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function loadArtwork(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function fitCanvasText(context, text, maxWidth, initialSize, minimumSize) {
    let size = initialSize;
    while (size > minimumSize) {
      context.font = `900 ${size}px Arial, sans-serif`;
      if (context.measureText(text).width <= maxWidth) break;
      size -= 4;
    }
    return size;
  }

  async function downloadPassPng(wallet, cardSerial, side = "front") {
    if (!wallet || !Array.isArray(wallet.cards)) throw new Error("Open your wallet before downloading a pass.");
    const card = wallet.cards.find((item) => item.cardSerial === normalizeSerial(cardSerial)) || wallet.featuredPass;
    if (!card) throw new Error("Select a pass before downloading.");
    const safeSide = side === "back" ? "back" : "front";
    const width = Number(passConfig.card?.width) || 2025;
    const height = Number(passConfig.card?.height) || 1275;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const artwork = await loadArtwork(safeSide === "front" ? card.frontArtwork : card.backArtwork);
    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);
    if (artwork) drawContainedImage(context, artwork, width, height);
    else {
      context.strokeStyle = "#a81318";
      context.lineWidth = 18;
      context.strokeRect(32, 32, width - 64, height - 64);
      context.fillStyle = "#d8d0c0";
      context.textAlign = "center";
      context.font = "900 76px Arial, sans-serif";
      context.fillText(safeSide === "front" ? card.frontPlaceholder : card.backPlaceholder, width / 2, height / 2);
    }

    if (wallet.tierTreatment === "green-copper") {
      context.strokeStyle = "#a56a43";
      context.lineWidth = 28;
      context.strokeRect(18, 18, width - 36, height - 36);
      context.strokeStyle = "#477b56";
      context.lineWidth = 10;
      context.strokeRect(48, 48, width - 96, height - 96);
    }

    const bannerHeight = 250;
    context.fillStyle = "rgba(3, 3, 3, 0.94)";
    context.fillRect(0, height - bannerHeight, width, bannerHeight);
    context.fillStyle = "#a81318";
    context.fillRect(0, height - bannerHeight, width, 12);
    context.textAlign = "left";
    context.fillStyle = "#f1eadc";
    const identity = sanitize(wallet.trapIdentity || wallet.holderPublicId, passConfig.card?.maxTrapIdentityLength || 40);
    const identitySize = fitCanvasText(context, identity, width * 0.56, 76, 42);
    context.font = `900 ${identitySize}px Arial, sans-serif`;
    context.fillText(identity, 72, height - 130);
    context.font = "700 38px Arial, sans-serif";
    context.fillStyle = "#d8d0c0";
    context.fillText(`${wallet.holderPublicId}  /  ${card.cardSerial}`, 72, height - 70);
    context.textAlign = "right";
    context.fillStyle = "#f1eadc";
    context.font = "900 48px Arial, sans-serif";
    context.fillText(card.waveName.toUpperCase(), width - 72, height - 140);
    context.font = "700 32px Arial, sans-serif";
    context.fillStyle = "#d8d0c0";
    context.fillText(wallet.currentTierLabel, width - 72, height - 82);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("The PNG could not be created.");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${card.cardSerial.toLowerCase()}-${safeSide}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  function getPublicPassUrl(passOrId) {
    const value = typeof passOrId === "string"
      ? passOrId
      : passOrId?.holderPublicId || passOrId?.holder_public_id || passOrId?.trap_pass_id;
    const holderId = normalizeSerial(value);
    return passConfig.routes?.publicProfile
      ? passConfig.routes.publicProfile(holderId)
      : `/pass/${encodeURIComponent(holderId)}`;
  }

  function publicPass(value) {
    if (!value) return null;
    if (value.publicProfileEnabled !== undefined && value.holderPublicId) {
      const allowed = {};
      (passConfig.publicFieldAllowlist || []).forEach((key) => {
        if (value[key] !== undefined) allowed[key] = value[key];
      });
      return allowed;
    }
    return null;
  }

  async function findPassAsync(query) {
    const clean = normalizeSerial(query);
    if (!clean || String(query || "").includes("@")) return null;
    if (passConfig.holderId?.pattern?.test(clean)) return getPublicProfileAsync(clean);
    const validation = await validateSerialAsync(clean);
    return validation.valid ? validation : null;
  }

  function findPass(query) {
    if (!isLocalReviewHost() || String(query || "").includes("@")) return null;
    const state = loadState();
    const holder = findHolderByPublicId(state, query);
    return holder ? publicProfileFromHolder(state, holder) : validateSerialLocal(query);
  }

  function getCurrentPass() {
    const wallet = isLocalReviewHost() ? walletBundle(loadState(), getSessionHolder(loadState())) : loadPublicWalletSession();
    return wallet?.featuredPass || null;
  }

  function setCurrentPass(value) {
    if (!isLocalReviewHost()) return false;
    const state = loadState();
    const holder = findHolderByPublicId(state, value)
      || state.holders.find((item) => holderCards(state, item).some((card) => card.cardSerial === normalizeSerial(value)));
    return holder ? setSessionHolder(holder.holderPublicId) : false;
  }

  function getWalletInventory() {
    return isLocalReviewHost() ? walletBundle(loadState(), getSessionHolder(loadState())) : null;
  }

  function getTrapPassMetadata(value) {
    const profile = publicPass(value);
    return profile ? {
      name: profile.trapIdentity || profile.holderPublicId,
      description: "Public Trap Pass holder profile.",
      external_url: getPublicPassUrl(profile.holderPublicId),
      public_summary: profile
    } : null;
  }

  function wireDiscordLinks() {
    document.querySelectorAll("[data-discord-link]").forEach((node) => {
      node.href = siteConfig.discordInviteUrl || "/trap-house/";
    });
  }

  function wireOfficialLinks() {
    const links = {
      instagram: siteConfig.instagramUrl,
      tiktok: siteConfig.tiktokUrl,
      threads: siteConfig.threadsUrl,
      youtube: siteConfig.youtubeUrl,
      x: siteConfig.xUrl,
      patreon: siteConfig.patreonUrl,
      spotify: siteConfig.spotifyUrl,
      "apple-music": siteConfig.appleMusicUrl
    };
    Object.entries(links).forEach(([key, href]) => {
      if (!href) return;
      document.querySelectorAll(`[data-official-link="${key}"]`).forEach((node) => {
        node.href = href;
      });
    });
  }

  const api = {
    cfg: siteConfig,
    config: passConfig,
    releases,
    tiers,
    sanitize,
    escapeHTML,
    normalizeEmail,
    normalizeSerial,
    normalizeThreadSlugs,
    formatHolderId,
    formatCardSerial,
    getRelease,
    getCurrentRelease,
    getTier,
    getPublicPassUrl,
    getCurrentHolderSummary,
    getMyWalletAsync,
    claimHolderAsync,
    createTrapPassAsync: claimHolderAsync,
    requestAccessAsync,
    lookupPublicWalletAsync,
    lookupServerWalletAsync,
    claimNewReleaseAsync,
    updateMyProfileAsync,
    validateSerialAsync,
    verifyTrapPassAsync: validateSerialAsync,
    getPublicProfileAsync,
    publicPass,
    findPass,
    findPassAsync,
    getCurrentPass,
    setCurrentPass,
    getWalletInventory,
    getTrapPassMetadata,
    captureEntryEmail,
    downloadPassPng,
    signOut,
    setAuthenticatedSession,
    wireDiscordLinks,
    wireOfficialLinks,
    wirePublicFooter() {},
    verifyTrapPassTokenAsync: async () => ({ valid: false, status: "INVALID TRAP PASS" }),
    getTrapPassHistory: () => null,
    getTrapPassPhase: () => null,
    getRoleAccessMapping: () => null,
    getAchievementBaggies: () => [],
    canAccessRoom: () => false,
    admin: {
      localReview: isLocalReviewHost(),
      searchLocal: adminSearchLocal,
      actionLocal: adminActionLocal
    }
  };

  if (isLocalReviewHost()) {
    api._localReview = {
      loadState,
      saveState,
      reset() {
        window.localStorage.removeItem(stateKey);
        signOut();
      },
      claimHolderLocal,
      validateSerialLocal,
      publicProfileFromHolder,
      reissueCardLocal
    };
  }

  window.TrapHouse = api;
  document.addEventListener("DOMContentLoaded", () => {
    wireDiscordLinks();
    wireOfficialLinks();
  });
})();
