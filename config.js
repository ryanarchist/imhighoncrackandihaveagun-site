(function () {
  function getLocalValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return "";
    }
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", ""]);
  const isLocalReview = localHosts.has(window.location.hostname);
  const supabaseUrl = "https://xpmozqmqzrljvnubnnxs.supabase.co";
  const supabasePublishableKey = "sb_publishable_DgXeNsqvkt4NuFX6-97UuQ_QG3FDYZ7";
  const hasSupabase = Boolean(supabaseUrl && supabasePublishableKey);
  const checkoutUsesServerHealth = true;
  const stripeApiHost = "https://imhighoncrackandihaveagun-site.vercel.app";
  const isVercelDeployment = window.location.hostname.endsWith(".vercel.app");
  const stripeApiBaseUrl = getLocalValue("iho_stripe_api_base_url")
    || (isVercelDeployment ? "" : stripeApiHost);

  window.TRAP_HOUSE_CONFIG = {
    storageNamespace: "iho_trap_house_v1",
    supabaseUrl,
    supabasePublishableKey,
    supabaseEnabled: hasSupabase,
    defaultWaveNumber: 1,
    defaultWaveName: "No Brakes",
    defaultDiscordRole: "No Brakes",
    discordInviteUrl: getLocalValue("iho_discord_invite_url") || "https://discord.gg/64MKTrGGsD",
    discordFallbackPath: "/discord/",
    passClaimsEnabled: hasSupabase || isLocalReview || getLocalValue("iho_pass_claims_enabled") === "1",
    passStorageMode: hasSupabase ? "supabase" : (isLocalReview ? "local_review" : "pending_live_storage"),
    emailCaptureEnabled: hasSupabase || isLocalReview,
    emailCaptureMode: hasSupabase ? "supabase" : (isLocalReview ? "local_review" : "pending_live_storage"),
    preorderCheckoutEnabled: checkoutUsesServerHealth,
    preorderCheckoutPreviewEnabled: false,
    preorderCheckoutStatus: "server_health_gated_checkout_sessions",
    stripeCheckoutHealthEndpoint: `${stripeApiBaseUrl}/api/stripe/health`,
    stripeCheckoutSessionEndpoint: `${stripeApiBaseUrl}/api/stripe/create-checkout-session`,
    trapPassWalletEndpoint: `${stripeApiBaseUrl}/api/trap-pass/wallet`,
    instagramUrl: "https://www.instagram.com/ihocaihag/",
    tiktokUrl: "https://www.tiktok.com/@ihocaihagofficial",
    threadsUrl: "https://www.threads.net/@ihocaihag",
    youtubeUrl: "https://youtube.com/@imhighoncrackandihaveagun",
    xUrl: "https://x.com/comradejizzy",
    patreonUrl: "https://www.patreon.com/IMHIGHONCRACKANDIHAVEAGUN",
    spotifyUrl: "https://open.spotify.com/artist/7GUAmAkkpLLESm0Fig1NWZ",
    appleMusicUrl: "https://music.apple.com/search?term=IHOCAIHAG",
    archiveStatsPath: "/data/archive-stats.json",
    officialLinksPath: "/data/official-links.json"
  };
})();
