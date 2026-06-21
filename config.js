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
  const stripePublishableKey = "pk_test_51Tjrqy3PVB4MWwrzae7Fy03NAOWf2iMF04LO1FyxLope7l2cZTRIJkBVoyiar5dMRCbiG1jpvIGMx1turPCqn0rh00MvtZFW4U";
  const stripeMode = stripePublishableKey.startsWith("pk_live_") ? "live" : "test";
  const checkoutPreviewEnabled = getLocalValue("iho_preorder_checkout_enabled") === "1";

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
    passStorageMode: hasSupabase ? "supabase" : (isLocalReview ? "local_review" : "pending_backend"),
    emailCaptureEnabled: hasSupabase || isLocalReview,
    emailCaptureMode: hasSupabase ? "supabase" : (isLocalReview ? "local_review" : "pending_backend"),
    preorderCheckoutEnabled: checkoutPreviewEnabled,
    preorderCheckoutPreviewEnabled: checkoutPreviewEnabled,
    preorderCheckoutStatus: checkoutPreviewEnabled ? "direct_stripe_checkout_sessions" : "server_checkout_pending",
    stripePublishableKey,
    stripeMode,
    stripeCheckoutReady: checkoutPreviewEnabled,
    stripeCheckoutSessionEndpoint: "/api/stripe/create-checkout-session",
    instagramUrl: "https://www.instagram.com/ihocaihag/",
    tiktokUrl: "https://www.tiktok.com/@ihocaihagofficial",
    youtubeUrl: "https://www.youtube.com/@imhighoncrackandihaveagun",
    xUrl: "https://x.com/comradejizzy",
    patreonUrl: "https://www.patreon.com/c/IMHIGHONCRACKANDIHAVEAGUN",
    spotifyUrl: "https://open.spotify.com/artist/7GUAmAkkpLLESm0Fig1NWZ",
    archiveStatsPath: "/data/archive-stats.json",
    officialLinksPath: "/data/official-links.json"
  };
})();
