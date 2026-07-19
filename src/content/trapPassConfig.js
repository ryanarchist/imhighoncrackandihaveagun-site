(function () {
  const siteUrl = "https://imhighoncrackandihaveagun.com";
  const cardRatio = 2025 / 1275;

  const releases = [
    {
      id: "gen-1-wave-1-ride-or-dies",
      slug: "ride-or-dies",
      generation: 1,
      waveNumber: 1,
      name: "Ride Or Dies",
      prefix: "ROD",
      releaseDate: "",
      claimOpensAt: "",
      claimClosesAt: "",
      claimEnabled: false,
      legacyManualVerificationRequired: true,
      frontArtwork: "/assets/trap-house/trap-pass-wave1-ride-or-dies-approved.png",
      backArtwork: "",
      frontPlaceholder: "RIDE OR DIES",
      backPlaceholder: "IHOCAIHAG TRAP PASS / RIDE OR DIES",
      status: "legacy",
      displayOrder: 1
    },
    {
      id: "gen-1-wave-2-when-3-deer-appear",
      slug: "when-3-deer-appear",
      generation: 1,
      waveNumber: 2,
      name: "When 3 Deer Appear",
      prefix: "W3D",
      releaseDate: "",
      claimOpensAt: "",
      claimClosesAt: "",
      claimEnabled: false,
      legacyManualVerificationRequired: true,
      frontArtwork: "/assets/trap-house/trap-pass-wave2-when-3-deer-appear-approved.png",
      backArtwork: "",
      frontPlaceholder: "WHEN 3 DEER APPEAR",
      backPlaceholder: "IHOCAIHAG TRAP PASS / WHEN 3 DEER APPEAR",
      status: "legacy",
      displayOrder: 2
    },
    {
      id: "gen-1-wave-3-all-hands-on-deck",
      slug: "all-hands-on-deck",
      generation: 1,
      waveNumber: 3,
      name: "All Hands On Deck",
      prefix: "AHD",
      releaseDate: "",
      claimOpensAt: "",
      claimClosesAt: "",
      claimEnabled: false,
      legacyManualVerificationRequired: true,
      frontArtwork: "/assets/trap-house/trap-pass-wave3-all-hands-on-deck-approved.png",
      backArtwork: "",
      frontPlaceholder: "ALL HANDS ON DECK",
      backPlaceholder: "IHOCAIHAG TRAP PASS / ALL HANDS ON DECK",
      status: "legacy",
      displayOrder: 3
    },
    {
      id: "gen-1-wave-4-bring-the-storm",
      slug: "bring-the-storm",
      generation: 1,
      waveNumber: 4,
      name: "Bring The Storm",
      prefix: "BTS",
      releaseDate: "",
      claimOpensAt: "",
      claimClosesAt: "",
      claimEnabled: false,
      legacyManualVerificationRequired: true,
      frontArtwork: "/assets/trap-house/trap-pass-wave4-bring-the-storm-approved.png",
      backArtwork: "",
      frontPlaceholder: "BRING THE STORM",
      backPlaceholder: "IHOCAIHAG TRAP PASS / BRING THE STORM",
      status: "legacy",
      displayOrder: 4
    },
    {
      id: "gen-2-wave-1-no-brakes",
      slug: "no-brakes",
      generation: 2,
      waveNumber: 1,
      name: "No Brakes",
      prefix: "NB",
      releaseDate: "",
      claimOpensAt: "",
      claimClosesAt: "",
      claimEnabled: true,
      legacyManualVerificationRequired: false,
      frontArtwork: "/assets/trap-house/trap-pass-no-brakes-current-approved.png",
      backArtwork: "",
      frontPlaceholder: "NO BRAKES",
      backPlaceholder: "IHOCAIHAG TRAP PASS / NO BRAKES",
      status: "current",
      displayOrder: 5
    }
  ];

  const tiers = [
    {
      id: "free",
      slug: "free-pass",
      name: "Free Pass",
      publicLabel: "FREE PASS HOLDER",
      type: "free",
      displayOrder: 1,
      visualTreatment: "standard",
      priceMonthly: null,
      priceAnnual: null,
      priceOneTime: 0
    },
    {
      id: "cash-for-trash",
      slug: "cash-for-trash",
      name: "Cash For Trash Trap Pass",
      publicLabel: "CASH FOR TRASH HOLDER",
      type: "paid-digital",
      displayOrder: 2,
      visualTreatment: "green-copper",
      priceMonthly: 4.99,
      priceAnnual: 44.91,
      priceOneTime: null,
      monthlyProductKey: "cash_for_trash_monthly",
      annualProductKey: "cash_for_trash_annual",
      annualCheckoutEnabled: false,
      annualPriceEnvName: "STRIPE_PRICE_CASH_FOR_TRASH_ANNUAL"
    },
    {
      id: "handy-sass",
      slug: "handy-sass",
      name: "Handy Sass Trap Pass",
      publicLabel: "HANDY SASS HOLDER",
      type: "physical-lifetime",
      displayOrder: 3,
      visualTreatment: "premium-art-slot",
      priceMonthly: null,
      priceAnnual: null,
      priceOneTime: 39.99,
      productKey: "handy_sass_pass"
    }
  ];

  const publicFieldAllowlist = [
    "trapIdentity",
    "holderPublicId",
    "originalEntryWave",
    "currentTierLabel",
    "memberSince",
    "featuredPass",
    "selectedPublicThreads",
    "approvedContributions",
    "publicProfileEnabled"
  ];

  const privateFieldDenylist = [
    "email",
    "emailNormalized",
    "emailVerifiedAt",
    "authUserId",
    "sessionToken",
    "refreshToken",
    "internalId",
    "stripeCustomerId",
    "stripeSubscriptionId",
    "stripePaymentIntent",
    "stripeCheckoutSession",
    "shippingDetails",
    "phoneNumber",
    "discordUsername",
    "personalUnlockCode",
    "adminNotes",
    "manualVerificationNotes",
    "replacementHistory",
    "rawBillingStatus",
    "webhookData"
  ];

  window.IHOCAIHAGTrapPassConfig = {
    version: 2,
    siteUrl,
    storage: {
      namespace: "iho_trap_pass_v2",
      stateKey: "iho_trap_pass_v2:state",
      sessionHolderKey: "iho_trap_pass_v2:session_holder",
      authAccessTokenKey: "iho_trap_pass_v2:auth_access",
      publicWalletSessionKey: "iho_trap_pass_v2:public_wallet",
      legacyRegistryKey: "iho_trap_house_v1:registry",
      legacyCurrentPassKey: "iho_trap_house_v1:current_pass_id"
    },
    holderId: {
      prefix: "TP",
      padding: 4,
      firstNumber: 100,
      pattern: /^TP-\d{4,}$/
    },
    cardSerial: {
      padding: 4,
      pattern: /^(ROD|W3D|AHD|BTS|NB)-\d{4,}(?:-R[2-9]\d*)?$/,
      legacyPattern: /^W[1-4]-\d{4,}$/
    },
    currentReleaseId: "gen-2-wave-1-no-brakes",
    releases,
    tiers,
    publicFieldAllowlist,
    privateFieldDenylist,
    card: {
      width: 2025,
      height: 1275,
      ratio: cardRatio,
      maxTrapIdentityLength: 40
    },
    claims: {
      productionRequiresAuthenticatedSession: false,
      publicFreeClaimsEnabled: true,
      publicFreeClaimRpc: "claim_trap_pass",
      publicLookupRpc: "lookup_trap_pass_public",
      generationOneSelfServiceEnabled: false
    },
    recovery: {
      emailProviderConfigured: false,
      blockedMessage: "Trap Pass lookup is unavailable right now.",
      requiredConfiguration: "Configure Supabase Auth email delivery and a PKCE callback before enabling production recovery."
    },
    cashForTrash: {
      monthlyPrice: 4.99,
      annualPrice: 44.91,
      annualDiscountPercent: 25,
      personalUnlockEmail: "imhighoncrackandihaveagun@gmail.com"
    },
    handySass: {
      oneTimePrice: 39.99,
      temporaryCashForTrashDuration: null,
      durationLabel: "Duration to be announced."
    },
    routes: {
      claim: "/trap-pass/",
      wallet: "/my-pass/",
      validation: "/check-pass/",
      admin: "/admin/trap-pass/",
      publicProfile(holderPublicId) {
        return `/pass/?id=${encodeURIComponent(holderPublicId)}`;
      },
      legacyPublicProfile(holderPublicId) {
        return `/pass/?id=${encodeURIComponent(holderPublicId)}`;
      }
    },
    sample: {
      label: "SAMPLE WALLET",
      trapIdentity: "Example Holder",
      holderPublicId: "TP-0100",
      originalEntryWave: "No Brakes",
      currentTierLabel: "Free Pass",
      cardSerial: "NB-0100",
      status: "Live Free Claim"
    }
  };
})();
