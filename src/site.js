(function () {
  const content = window.IHOCAIHAGSiteContent || {};
  const draftText = content.draft || "Content is being prepared for publication.";
  const comingText = content.coming || "More archive material will be added here.";
  const ui = content.uiContent || {};
  const labels = ui.passLabels || {};
  const actions = ui.actions || {};
  const forms = ui.forms || {};
  const states = ui.states || {};
  const placeholders = ui.placeholders || {};

  function esc(value) {
    if (window.TrapHouse?.escapeHTML) return window.TrapHouse.escapeHTML(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function attr(value) {
    return esc(value).replace(/`/g, "&#096;");
  }

  const headingFillerWords = new Set([
    "a", "an", "are", "check", "claim", "connects", "connection", "enter", "explore",
    "get", "here", "how", "is", "join", "my", "open", "preorder", "read", "shop",
    "that", "the", "this", "view", "watch", "what", "when", "where", "why", "your"
  ]);

  function headingWords(value, removeFiller = false) {
    const words = String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return removeFiller ? words.filter((word) => !headingFillerWords.has(word)) : words;
  }

  function isRedundantEyebrow(eyebrow, headline) {
    const eyebrowWords = headingWords(eyebrow);
    const headlineWords = headingWords(headline);
    if (!eyebrowWords.length || !headlineWords.length) return false;
    if (eyebrowWords.join(" ") === headlineWords.join(" ")) return true;

    const meaningfulEyebrow = headingWords(eyebrow, true);
    const meaningfulHeadline = headingWords(headline, true);
    if (
      meaningfulEyebrow.length
      && meaningfulEyebrow.join(" ") === meaningfulHeadline.join(" ")
    ) return true;

    const repeatedShortLabel = eyebrowWords.every((word) => headlineWords.includes(word))
      && headlineWords.length - eyebrowWords.length <= 2;
    return repeatedShortLabel;
  }

  function eyebrowMarkup(eyebrow, headline = "") {
    if (!eyebrow || isRedundantEyebrow(eyebrow, headline)) return "";
    return `<span class="eyebrow">${esc(eyebrow)}</span>`;
  }

  function isExternal(href = "") {
    return /^https?:\/\//i.test(href);
  }

  function placeholder(text = draftText, variant = "") {
    const value = text || draftText;
    return `<span class="draft-placeholder${variant ? ` ${attr(variant)}` : ""}">${esc(value)}</span>`;
  }

  function copyBlock(text, className = "body-copy") {
    const values = Array.isArray(text) ? text : [text || draftText];
    return values.filter((value) => value !== undefined && value !== null && value !== "").map((value) => {
      const body = value === draftText || value === comingText ? placeholder(value) : esc(value);
      return `<p class="${className}">${body}</p>`;
    }).join("");
  }

  function statusBadge(text) {
    return `<span class="status">${esc(text || states.comingSoon || "Coming soon.")}</span>`;
  }

  function loadingState(text) {
    return `<div class="state-message loading-state">${esc(text || states.loading || "Loading...")}</div>`;
  }

  function errorState(text) {
    return `<div class="state-message error-state">${esc(text || states.error || "Something went wrong.")}</div>`;
  }

  function emptyState(text) {
    return `<div class="state-message empty-state">${esc(text || states.empty || "Nothing here yet.")}</div>`;
  }

  function button(label, href, primary = false, extraAttrs = "") {
    const target = isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a class="button${primary ? " primary" : ""}" href="${attr(href || "#")}"${target}${extraAttrs}>${esc(label || actions.open || "Open")}</a>`;
  }

  function socialButtons(links = [], className = "social-links") {
    if (!Array.isArray(links) || !links.length) return "";
    return `
      <div class="${attr(className)}" aria-label="Official social links">
        ${links.map((link) => `<a href="${attr(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`).join("")}
      </div>
    `;
  }

  function imagePanel(item = {}, options = {}) {
    const classes = ["image-panel", options.contain || item.imageFit === "contain" ? "contain" : ""].filter(Boolean).join(" ");
    const styles = [
      item.objectPosition ? `--image-position: ${attr(item.objectPosition)}` : "",
      item.mobileObjectPosition ? `--image-mobile-position: ${attr(item.mobileObjectPosition)}` : ""
    ].filter(Boolean).join("; ");
    if (!item.imageSrc) {
      return `<figure class="${classes}"${styles ? ` style="${styles}"` : ""}><div class="image-slot">${esc(placeholders.imageSlot || "IMAGE SLOT")}</div></figure>`;
    }
    return `
      <figure class="${classes}"${styles ? ` style="${styles}"` : ""}>
        <img src="${attr(item.imageSrc)}" alt="${attr(item.imageAlt || placeholders.imageSlot || "IMAGE SLOT")}" loading="lazy" onerror="this.closest('.image-panel').innerHTML='<div class=&quot;image-slot&quot;>${attr(placeholders.imageSlot || "IMAGE SLOT")}</div>'" />
        ${item.imageCaption ? `<figcaption>${esc(item.imageCaption)}</figcaption>` : ""}
      </figure>
    `;
  }

  function sectionHeader(item = {}) {
    return `
      <header class="section-header">
        ${eyebrowMarkup(item.eyebrow, item.headline)}
        ${item.headline ? `<h2>${esc(item.headline)}</h2>` : ""}
        ${item.body ? copyBlock(item.body, "section-copy") : ""}
      </header>
    `;
  }

  function renderHero(hero = {}) {
    const styles = [
      hero.imageSrc ? `--hero-image: url('${attr(hero.imageSrc)}')` : "",
      hero.objectPosition || hero.backgroundPosition ? `--hero-position: ${attr(hero.objectPosition || hero.backgroundPosition)}` : "",
      hero.mobileObjectPosition || hero.mobileBackgroundPosition ? `--hero-mobile-position: ${attr(hero.mobileObjectPosition || hero.mobileBackgroundPosition)}` : ""
    ].filter(Boolean).join("; ");

    return `
      <section class="hero${hero.editorial ? " editorial-hero" : ""}${hero.imageFit === "contain" ? " hero-contain" : ""}" style="${styles}">
        <div class="hero-inner">
          <div class="hero-copy">
            ${eyebrowMarkup(hero.eyebrow, hero.headline || "IHOCAIHAG")}
            <h1>${esc(hero.headline || "IHOCAIHAG")}</h1>
            ${hero.body ? copyBlock(hero.body, "lead") : ""}
            ${hero.smallNote ? `<p class="small-note">${hero.smallNote === draftText || hero.smallNote === comingText ? placeholder(hero.smallNote) : esc(hero.smallNote)}</p>` : ""}
            ${Array.isArray(hero.actions) && hero.actions.length ? `
              <div class="cta-row">
                ${hero.actions.map((item, index) => button(item.label, item.href, item.primary ?? index === 0)).join("")}
              </div>
            ` : (hero.ctaPrimaryLabel || hero.ctaSecondaryLabel) ? `
              <div class="cta-row">
                ${hero.ctaPrimaryLabel ? button(hero.ctaPrimaryLabel, hero.ctaPrimaryHref, true) : ""}
                ${hero.ctaSecondaryLabel ? button(hero.ctaSecondaryLabel, hero.ctaSecondaryHref, false) : ""}
              </div>
            ` : ""}
            ${socialButtons(hero.socialLinks, "hero-social-links")}
          </div>
        </div>
      </section>
    `;
  }

  function pageKey(page) {
    if (page === "preorders" || page === "shop") return "store";
    if (page === "check-pass") return "my-pass";
    if (page === "trap-verify") return "trap-verify";
    return page || "home";
  }

  function absoluteUrl(pathOrUrl) {
    const value = String(pathOrUrl || "");
    if (/^https?:\/\//i.test(value)) return value;
    const base = content.seoContent?.siteUrl || window.location.origin;
    return `${base.replace(/\/$/, "")}${value.startsWith("/") ? value : `/${value}`}`;
  }

  function setMeta(selector, attrs) {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement(attrs.tag || "meta");
      Object.entries(attrs.match || {}).forEach(([name, value]) => node.setAttribute(name, value));
      document.head.appendChild(node);
    }
    Object.entries(attrs.values || {}).forEach(([name, value]) => {
      if (value) node.setAttribute(name, value);
    });
  }

  function applySeo(page) {
    const seo = content.seoContent || {};
    const dynamicThread = page === "thread-detail" ? findThread(threadSlugFromLocation()) : null;
    const data = {
      ...(seo.defaults || {}),
      ...(seo.routes?.[pageKey(page)] || {}),
      ...(dynamicThread ? {
        title: `${dynamicThread.title} | IHOCAIHAG`,
        description: dynamicThread.description || "A foundational thread inside the IHOCAIHAG map.",
        canonicalUrl: `${(seo.siteUrl || window.location.origin).replace(/\/$/, "")}/threads/${dynamicThread.slug}/`,
        ogImage: dynamicThread.heroImage?.imageSrc,
        twitterImage: dynamicThread.heroImage?.imageSrc
      } : {})
    };
    const title = data.title || "IHOCAIHAG";
    const description = data.description || comingText;
    const ogTitle = data.ogTitle || title;
    const ogDescription = data.ogDescription || description;
    const ogImage = absoluteUrl(data.ogImage || data.twitterImage || seo.defaults?.ogImage || "");
    const canonical = absoluteUrl(data.canonicalUrl || window.location.pathname || "/");
    document.title = title;
    setMeta('meta[name="description"]', { match: { name: "description" }, values: { content: description } });
    setMeta('meta[property="og:type"]', { match: { property: "og:type" }, values: { content: "website" } });
    setMeta('meta[property="og:title"]', { match: { property: "og:title" }, values: { content: ogTitle } });
    setMeta('meta[property="og:description"]', { match: { property: "og:description" }, values: { content: ogDescription } });
    setMeta('meta[property="og:url"]', { match: { property: "og:url" }, values: { content: canonical } });
    setMeta('meta[property="og:image"]', { match: { property: "og:image" }, values: { content: ogImage } });
    setMeta('meta[name="twitter:card"]', { match: { name: "twitter:card" }, values: { content: "summary_large_image" } });
    setMeta('meta[name="twitter:title"]', { match: { name: "twitter:title" }, values: { content: data.twitterTitle || ogTitle } });
    setMeta('meta[name="twitter:description"]', { match: { name: "twitter:description" }, values: { content: data.twitterDescription || ogDescription } });
    setMeta('meta[name="twitter:image"]', { match: { name: "twitter:image" }, values: { content: absoluteUrl(data.twitterImage || ogImage) } });
    setMeta('link[rel="canonical"]', { tag: "link", match: { rel: "canonical" }, values: { href: canonical } });
    setMeta('link[rel="icon"]', { tag: "link", match: { rel: "icon" }, values: { href: absoluteUrl(seo.favicon || "/assets/trap-house/ihocaihag-rectangle-logo.png") } });
  }

  function renderNav(page) {
    const currentPage = page === "january-22" ? "map" : pageKey(page);
    const currentPass = window.TrapHouse?.getCurrentPass?.();
    const passNav = content.navigation?.pass || {};
    const utility = currentPass
      ? { label: passNav.signedInLabel || "My Pass", href: passNav.signedInHref || "/my-pass/" }
      : { label: passNav.signedOutLabel || "Get Trap Pass", href: passNav.signedOutHref || "/trap-pass/" };
    const links = content.navigation?.main || [];
    const brand = ui.brand || {};
    const utilityCurrent = (currentPage === "my-pass" && utility.href.includes("/my-pass/")) || (currentPage === "trap-pass" && utility.href.includes("/trap-pass/"));

    return `
      <a class="skip-link" href="#main">Skip to content</a>
      <nav class="site-nav" aria-label="Primary">
        <a class="brand" href="/">
          <strong>${esc(brand.label || "IHOCAIHAG")}</strong>
          <span>${esc(brand.domain || "imhighoncrackandihaveagun.com")}</span>
        </a>
        <div class="nav-links">
          ${links.map((link) => `<a href="${attr(link.href)}"${link.page === currentPage ? ' aria-current="page"' : ""}>${esc(link.label)}</a>`).join("")}
        </div>
        <a class="utility-link" href="${attr(utility.href)}"${utilityCurrent ? ' aria-current="page"' : ""}>${esc(utility.label)}</a>
      </nav>
    `;
  }

  function renderMobileNav(page) {
    const currentPage = page === "january-22" ? "map" : pageKey(page);
    const links = content.navigation?.main || [];
    return `<nav class="mobile-bottom-nav" aria-label="Mobile">${links.map((link) => `<a href="${attr(link.href)}"${link.page === currentPage ? ' aria-current="page"' : ""}>${esc(link.label)}</a>`).join("")}</nav>`;
  }

  function renderFooter() {
    const footer = content.footerContent || {};
    const social = footer.socialLinks || [];
    return `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div>
            ${footer.eyebrow ? `<span class="eyebrow">${esc(footer.eyebrow)}</span>` : ""}
            ${footer.headline ? `<h2>${esc(footer.headline)}</h2>` : ""}
            ${footer.body ? copyBlock(footer.body, "section-copy") : ""}
            ${footer.safetyText ? `<div class="disclaimer">${esc(footer.safetyText)}</div>` : ""}
            ${footer.triggerWarningText ? `<div class="disclaimer warning">${esc(footer.triggerWarningText)}</div>` : ""}
            ${footer.supportLabel ? `<p class="small-note">${esc(footer.supportLabel)}</p>` : ""}
          </div>
          <div class="footer-actions">
            ${(footer.utilityLinks || []).map((link) => `<a href="${attr(link.href)}">${esc(link.label)}</a>`).join("")}
            ${socialButtons(social)}
          </div>
        </div>
      </footer>
    `;
  }

  function renderMediaEmbed(media = {}) {
    const title = media.title || "Embedded media";
    if (media.type === "youtube") {
      if (!media.src) return "";
      return `
        <div class="media-embed media-embed-youtube">
          <iframe
            src="${attr(media.src)}"
            title="${attr(title)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      `;
    }
    if (media.type === "instagram") {
      const permalink = media.permalink || media.src;
      if (!permalink) return "";
      let embedSrc = "";
      try {
        const url = new URL(permalink, window.location.href);
        const cleanPath = url.pathname.replace(/\/embed\/?$/i, "").replace(/\/+$/, "");
        embedSrc = `https://www.instagram.com${cleanPath}/embed/`;
      } catch (error) {
        return "";
      }
      return `
        <div class="media-embed media-embed-instagram">
          <iframe
            src="${attr(embedSrc)}"
            title="${attr(title)}"
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      `;
    }
    return "";
  }

  function evidenceCard(card = {}, index = 0) {
    return `
      <article class="evidence-card entry-card${card.featured ? " featured-card" : ""}">
        ${card.imageSrc ? `<div class="community-card-media"><img src="${attr(card.imageSrc)}" alt="${attr(card.imageAlt || card.label || "Community channel")}" loading="lazy" /></div>` : ""}
        ${renderMediaEmbed(card.embed)}
        <div>
          <span class="card-label">${esc(card.label || card.title || `Item ${index + 1}`)}</span>
          ${card.headline ? `<h3>${esc(card.headline)}</h3>` : ""}
          ${card.question ? `<p class="question-copy">${esc(card.question)}</p>` : ""}
          ${card.body || card.description ? copyBlock(card.body || card.description) : ""}
        </div>
        ${card.href || card.buttonHref ? `<div class="cta-row">${button(card.buttonLabel || "Open", card.href || card.buttonHref)}</div>` : ""}
      </article>
    `;
  }

  function renderPreview(preview = {}, index = 0) {
    const flipped = index % 2 === 1 ? " flip" : "";
    const text = `
      <div class="panel">
        ${eyebrowMarkup(preview.eyebrow, preview.headline || preview.eyebrow || "IHOCAIHAG")}
        <h2>${esc(preview.headline || preview.eyebrow || "IHOCAIHAG")}</h2>
        ${copyBlock(preview.body)}
        <div class="cta-row">${button(preview.buttonLabel || "Open", preview.buttonHref || "#", true)}</div>
      </div>
    `;
    const image = imagePanel(preview);
    return `
      <section class="section compact">
        <div class="container two-column preview-section${flipped}">
          ${index % 2 === 1 ? `${text}${image}` : `${image}${text}`}
        </div>
      </section>
    `;
  }

  function renderHome() {
    const page = content.homeContent || {};
    return `
      ${renderHero(page.hero)}
      <section class="section">
        <div class="container">
          ${sectionHeader(page.fiveWays)}
          <div class="grid five-grid">${(page.fiveWays?.cards || []).map(evidenceCard).join("")}</div>
        </div>
      </section>
      ${(page.previews || []).map(renderPreview).join("")}
    `;
  }

  function renderDrops() {
    const page = content.dropsContent || {};
    const featured = page.featuredDrop || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container featured-drop">
          ${featured.embed ? renderMediaEmbed(featured.embed) : imagePanel({ imageSrc: featured.thumbnail, imageAlt: featured.imageAlt })}
          <article class="panel">
            <span class="status">${esc(featured.status || "Coming Soon")}</span>
            <h2>${esc(featured.title || "Featured Drop")}</h2>
            ${copyBlock(featured.description)}
            <div class="tag-row">${(featured.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
            <div class="cta-row">${button("Watch Official Drops", featured.youtubeUrl || content.links?.youtube || "#", true)}</div>
          </article>
        </div>
      </section>
      <section class="section">
        <div class="container">
          ${sectionHeader(page.whatDropsHere)}
          <div class="grid card-grid">${(page.cards || []).map(evidenceCard).join("")}</div>
        </div>
      </section>
    `;
  }

  function renderDropCard(drop = {}) {
    const relatedThreads = Array.isArray(drop.relatedThreadSlugs) ? drop.relatedThreadSlugs : [];
    const tags = Array.isArray(drop.tags) ? drop.tags : [];
    return `
      <article class="evidence-card">
        ${drop.thumbnail ? `<div class="product-media"><img src="${attr(drop.thumbnail)}" alt="${attr(drop.imageAlt || drop.title || "Drop thumbnail")}" loading="lazy" /></div>` : ""}
        ${statusBadge(drop.status || states.comingSoon || "Coming soon.")}
        <h3>${esc(drop.title || draftText)}</h3>
        ${copyBlock(drop.description)}
        ${drop.publishedAt ? `<p class="small-note">${esc(formatDate(drop.publishedAt))}</p>` : ""}
        <div class="tag-row">
          ${tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}
          ${relatedThreads.map((slug) => `<a class="tag" href="/threads/${attr(slug)}/">${esc(findThread(slug)?.title || slug)}</a>`).join("")}
        </div>
        ${drop.youtubeUrl ? `<div class="cta-row">${button("Watch Drop", drop.youtubeUrl, true)}</div>` : ""}
      </article>
    `;
  }

  function renderThreadCard(thread = {}) {
    return `
      <article class="thread-card">
        <span class="card-number">${esc(thread.number || "")}</span>
        <h3>${esc(thread.title || "Thread")}</h3>
        ${copyBlock(thread.description || thread.definition)}
        <div class="tag-row">
          <span class="tag">${esc(thread.status || "Foundational Thread")}</span>
          ${(thread.relatedTags || thread.tags || []).slice(0, 4).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}
        </div>
        <div class="cta-row">${button(thread.buttonLabel || "Open Thread", thread.buttonHref || `/threads/${thread.slug || ""}/`)}</div>
      </article>
    `;
  }

  function renderThreadMap(board = {}) {
    const hotspots = Array.isArray(board.hotspots) ? board.hotspots : [];
    const percentage = (value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    };
    return `
      <div class="thread-map-frame">
        ${board.imageSrc
          ? `<img src="${attr(board.imageSrc)}" alt="${attr(board.imageAlt || "IHOCAIHAG Thread Map")}" loading="eager" />`
          : `<div class="image-slot">${esc(placeholders.imageSlot || "IMAGE SLOT")}</div>`}
        <div class="thread-map-photo-overlays" aria-hidden="true">
          ${hotspots.filter((hotspot) => hotspot.photoImageSrc).map((hotspot) => `
            <img
              class="thread-map-photo"
              src="${attr(hotspot.photoImageSrc)}"
              alt=""
              loading="eager"
              decoding="async"
              style="--photo-left:${percentage(hotspot.photoLeft)}%;--photo-top:${percentage(hotspot.photoTop)}%;--photo-width:${percentage(hotspot.photoWidth)}%;--photo-height:${percentage(hotspot.photoHeight)}%;--photo-position:${attr(hotspot.photoPosition || "center center")};"
            />
          `).join("")}
        </div>
        <nav class="thread-map-hotspots" aria-label="Open a thread definition">
          ${hotspots.map((hotspot) => {
            const label = `Open Thread ${hotspot.number || ""}: ${hotspot.title || "Thread"}`;
            return `<a class="thread-map-hotspot" href="${attr(hotspot.href || `/threads/${hotspot.slug || ""}/`)}" aria-label="${attr(label)}" title="${attr(label)}" style="--hotspot-left:${percentage(hotspot.left)}%;--hotspot-top:${percentage(hotspot.top)}%;--hotspot-width:${percentage(hotspot.width)}%;--hotspot-height:${percentage(hotspot.height)}%;"><span class="sr-only">${esc(label)}</span></a>`;
          }).join("")}
        </nav>
      </div>
    `;
  }

  function renderManifestationCard(item = {}) {
    return `
      <article class="evidence-card">
        <span class="card-number">${esc(item.number || "")}</span>
        <h3>${esc(item.title || "Thread")}</h3>
        ${copyBlock(item.body)}
        <div class="cta-row">${button("Open Thread", `/threads/${item.slug || ""}/`)}</div>
      </article>
    `;
  }

  function renderMap() {
    const page = content.mapContent || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container">
          ${sectionHeader(page.whatAreThreads)}
        </div>
      </section>
      <section class="section compact" id="thread-board">
        <div class="container">
          ${sectionHeader(page.boardIntro)}
          ${renderThreadMap(page.boardIntro)}
        </div>
      </section>
      <section class="section" id="primary-threads">
        <div class="container">
          ${sectionHeader(ui.sections?.threadGrid)}
          <div class="grid thread-grid">
            ${(page.threads || []).map(renderThreadCard).join("")}
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="container two-column">
          <article class="panel">
            ${sectionHeader(page.originPanel)}
            <div class="cta-row">${button(page.originPanel?.buttonLabel || "Open January 22", page.originPanel?.buttonHref || "/map/january-22/", true)}</div>
          </article>
          ${imagePanel(page.originPanel)}
        </div>
      </section>
      <section class="section compact">
        <div class="container grid thread-grid">
          ${(page.originPanel?.manifestations || []).map(renderManifestationCard).join("")}
        </div>
      </section>
      <section class="section compact">
        <div class="container panel">
          ${sectionHeader(page.evidenceConnection)}
          <div class="tag-row">${(page.evidenceConnection?.types || []).map((type) => `<span class="tag">${esc(type)}</span>`).join("")}</div>
        </div>
      </section>
    `;
  }

  function renderJanuary22() {
    const page = content.january22Content || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container grid thread-grid">
          ${(page.manifestations || []).map(renderManifestationCard).join("")}
        </div>
      </section>
      ${(page.missingSections || []).length ? `
        <section class="section compact">
          <div class="container grid card-grid">
            ${page.missingSections.map(evidenceCard).join("")}
          </div>
        </section>
      ` : ""}
    `;
  }

  function threadSlugFromLocation() {
    const direct = document.body.dataset.threadSlug;
    if (direct) return direct;
    const query = new URLSearchParams(window.location.search).get("thread");
    if (query) return query;
    const match = window.location.pathname.match(/\/threads\/([^/]+)\/?/i);
    return match?.[1] || "";
  }

  function findThread(slug) {
    const threads = content.threadContent?.threads || content.mapContent?.threads || [];
    return threads.find((thread) => thread.slug === slug) || null;
  }

  function renderThreadDetail() {
    const page = content.threadContent || {};
    const slug = threadSlugFromLocation();
    const thread = findThread(slug);
    if (!thread) {
      return `
        ${renderHero({ ...(page.hero || {}), headline: "Thread Not Found", body: "That thread could not be found." })}
        <section class="section compact">
          <div class="container panel">
            ${copyBlock("Return to the Thread Map and choose one of the nine foundational threads.")}
            <div class="cta-row">${button("Back To Map", "/map/", true)}</div>
          </div>
        </section>
      `;
    }
    const labels = page.sectionLabels || {};
    const hero = {
      ...(page.hero || {}),
      eyebrow: `Thread ${thread.number || ""}`,
      headline: thread.title,
      body: thread.shortExcerpt || thread.description,
      imageSrc: thread.heroImage?.imageSrc || "",
      imageAlt: thread.heroImage?.imageAlt || `${thread.title} hero image slot`,
      backgroundPosition: thread.heroImage?.heroPosition || thread.heroImage?.objectPosition || "center center",
      mobileBackgroundPosition: thread.heroImage?.mobileHeroPosition || thread.heroImage?.mobileObjectPosition || "center top",
      ctaPrimaryLabel: "Back To Map",
      ctaPrimaryHref: "/map/",
      ctaSecondaryLabel: "Watch Official Drops",
      ctaSecondaryHref: "/drops/"
    };
    return `
      ${renderHero(hero)}
      <section class="section compact">
        <div class="container two-column">
          ${imagePanel(thread.heroImage || { imageAlt: `${thread.title} hero image slot` })}
          <article class="panel">
            ${eyebrowMarkup(labels.principle || "The Principle", thread.title)}
            <h2>${esc(thread.title)}</h2>
            ${copyBlock(thread.definition || thread.description, "section-copy")}
          </article>
        </div>
      </section>
      <section class="section compact">
        <div class="container two-column">
          <article class="panel">
            ${eyebrowMarkup(labels.january22 || "January 22", "January 22")}
            <h2>January 22</h2>
            ${copyBlock(thread.january22, "section-copy")}
          </article>
          <article class="panel">
            ${eyebrowMarkup(labels.sixYearLayer || "Six-Year Layer", "Six-Year Layer")}
            <h2>Six-Year Layer</h2>
            ${copyBlock(thread.sixYearLayer, "section-copy")}
          </article>
        </div>
      </section>
      ${(thread.evidenceItems || []).length || (thread.relatedThreadSlugs || []).length ? `
        <section class="section compact">
          <div class="container two-column">
            ${(thread.evidenceItems || []).length ? `<article class="panel">${eyebrowMarkup(labels.evidence || "Evidence", "Evidence")}<h2>Evidence</h2><div class="grid card-grid">${thread.evidenceItems.map(evidenceCard).join("")}</div></article>` : ""}
            ${(thread.relatedThreadSlugs || []).length ? `<article class="panel">${eyebrowMarkup(labels.crosses || "Threads It Crosses", "Threads It Crosses")}<h2>Threads It Crosses</h2><div class="tag-row">${thread.relatedThreadSlugs.map((slug) => `<a class="tag" href="/threads/${attr(slug)}/">${esc(findThread(slug)?.title || slug)}</a>`).join("")}</div></article>` : ""}
          </div>
        </section>
      ` : ""}
      ${(thread.relatedDrops || []).length ? `
        <section class="section compact">
          <div class="container panel">
            ${eyebrowMarkup(labels.relatedDrops || "Related Drops", "Related Drops")}
            <h2>Related Drops</h2>
            <div class="grid card-grid">${thread.relatedDrops.map(evidenceCard).join("")}</div>
          </div>
        </section>
      ` : ""}
    `;
  }

  function renderTrapPass() {
    const page = content.trapPassContent || {};
    const localReview = Boolean(window.TrapHouse?.admin?.localReview);
    const claimsOpen = localReview
      || Boolean(window.TrapHouse?.config?.claims?.publicFreeClaimsEnabled)
      || Boolean(window.TrapHouse?.config?.recovery?.emailProviderConfigured);
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container panel">
          ${sectionHeader(page.whatIs)}
        </div>
      </section>
      <section class="section compact">
        <div class="container two-column">
          <article class="panel release-panel">
            <span class="eyebrow">${esc(page.currentRelease?.eyebrow || "Current Release")}</span>
            <h2>${esc(page.currentRelease?.displayTitle || "NO BRAKES")}</h2>
            <p class="release-secondary">${esc(page.currentRelease?.smallNote || "Gen 2 Wave 1")}</p>
            ${copyBlock(page.currentRelease?.body)}
            <div class="tag-row"><span class="tag">Prefix: NB</span><span class="tag">${esc(claimsOpen ? "Claim window open" : "Secure claims opening soon")}</span></div>
          </article>
          <div class="pass-artwork-slot">
            ${page.currentRelease?.imageSrc
              ? `<img src="${attr(page.currentRelease.imageSrc)}" alt="${attr(page.currentRelease.imageAlt || "No Brakes Gen 2 Wave 1 Trap Pass")}" loading="lazy" />`
              : `<div class="image-slot" role="img" aria-label="${attr(page.currentRelease?.placeholder || "Trap Pass artwork")}"><span>GEN 2 / WAVE 1</span><strong>${esc(page.currentRelease?.placeholder || "TRAP PASS ARTWORK")}</strong></div>`}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          ${sectionHeader(ui.sections?.trapPassTiers)}
          <div class="grid tier-grid">
            ${(page.tiers || []).map((tier) => `
              <article class="tier-card" id="${attr(tier.id)}">
                ${tier.imageSrc ? `<div class="tier-media"><img src="${attr(tier.imageSrc)}" alt="${attr(tier.imageAlt || tier.label || "Trap Pass")}" loading="lazy" /></div>` : ""}
                <span class="card-label">${esc(tier.label)}</span>
                <strong class="price">${esc(tier.price || "")}</strong>
                ${tier.annualPrice ? `<span class="tier-annual-price">${esc(tier.annualPrice)}</span>` : ""}
                ${copyBlock(tier.description)}
                ${(tier.benefits || []).length ? `<ul class="benefit-list">${tier.benefits.map((benefit) => `<li>${esc(benefit)}</li>`).join("")}</ul>` : ""}
                ${tier.annualStatus ? `<p class="small-note">${esc(tier.annualStatus)}</p>` : ""}
                <div class="cta-row">${button(tier.buttonLabel || "Open", tier.buttonHref || "#", true)}</div>
              </article>
            `).join("")}
          </div>
        </div>
      </section>
      <section class="section compact" id="claim">
        <div class="container two-column">
          <article class="panel">
            ${sectionHeader(page.claimForm)}
            ${claimsOpen ? `<form class="pass-form" data-trap-pass-claim>
              <div class="form-grid">
                <label class="field"><span>${esc(forms.email || "Email")}</span><input type="email" name="email" autocomplete="email" required /></label>
                <label class="field"><span>${esc(forms.trapIdentity || "Trap identity (optional)")}</span><input type="text" name="trapIdentity" maxlength="40" autocomplete="nickname" /></label>
                <label class="field"><span>${esc(forms.discordUsername || "Discord username (optional and private)")}</span><input type="text" name="discordUsername" maxlength="80" autocomplete="off" /></label>
              </div>
              ${window.TrapHouse?.config?.recovery?.emailProviderConfigured ? `<label class="choice-row">
                <input type="checkbox" name="publicProfileEnabled" value="1" />
                <span><strong>Enable my public holder profile</strong><small>Shows only your Trap identity, holder ID, entry wave, tier, member-since date, featured pass, and selected public Threads.</small></span>
              </label>` : ""}
              <button class="button primary" type="submit">${esc(forms.claimFreePass || "Claim Free Pass")}</button>
              <p class="small-note">${esc(page.claimForm?.privacyNote || "")}</p>
            </form>` : `<div class="notice active">Free Trap Pass claims are opening soon.</div>`}
            <div class="notice" data-claim-output></div>
          </article>
          ${renderSampleWallet(page.sampleWallet)}
        </div>
      </section>
      <section class="section" id="pass-history">
        <div class="container">
          ${sectionHeader(ui.sections?.passHistory)}
          <div class="grid card-grid pass-history-grid">
            ${(page.history || []).map((item) => `
              <article class="evidence-card pass-history-card">
                ${item.imageSrc ? `<div class="pass-history-media"><img src="${attr(item.imageSrc)}" alt="${attr(item.imageAlt || item.title || "Prior Trap Pass release")}" loading="lazy" /></div>` : ""}
                <span class="card-label">${esc(item.generation)}</span>
                <h3>${esc(item.title)}</h3>
                <div class="tag-row"><span class="tag">Prefix: ${esc(item.prefix)}</span><span class="tag">${esc(item.claimStatus)}</span></div>
              </article>
            `).join("")}
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="container two-column">
          <article class="panel">
            ${sectionHeader(page.validation)}
            <form class="lookup-form pass-form" data-pass-validation-form>
              <label class="field"><span>${esc(forms.passId || "Holder ID or card serial")}</span><input name="serial" autocomplete="off" required /></label>
              <button class="button primary" type="submit">${esc(forms.verifyPass || "Check Your Pass")}</button>
            </form>
            <div class="notice" data-pass-validation-notice aria-live="polite"></div>
          </article>
          <article class="panel">${sectionHeader(page.privacy)}</article>
        </div>
      </section>
    `;
  }

  function renderSampleWallet(sample = {}) {
    return `
      <article class="sample-wallet panel" aria-label="Sample wallet preview">
        <span class="card-label">${esc(sample.label || labels.sample || "SAMPLE WALLET")}</span>
        <div class="sample-card">
          ${sample.imageSrc
            ? `<img class="sample-card-art" src="${attr(sample.imageSrc)}" alt="${attr(sample.imageAlt || "No Brakes Trap Pass")}" loading="lazy" />`
            : `<div class="sample-card-art">TRAP PASS ARTWORK</div>`}
          <div class="identity-strip">
            <strong>${esc(sample.trapIdentity || "Example Holder")}</strong>
            <span>${esc(sample.holderId || "TP-0100")} / ${esc(sample.cardSerial || "NB-0100")}</span>
          </div>
        </div>
        <div class="meta-list">
          ${metaRow(labels.publicPassId || "Permanent Holder ID", sample.holderId)}
          ${metaRow(labels.wave || "Original Entry Wave", sample.originalEntryWave)}
          ${metaRow(labels.tier || "Tier", sample.tier)}
          ${metaRow(labels.status || "Status", sample.status)}
        </div>
      </article>
    `;
  }

  function metaRow(label, value) {
    return `<div><span>${esc(label)}</span><strong>${esc(value || labels.previewOnly || "Preview Only")}</strong></div>`;
  }

  function renderTrapHouse() {
    const page = content.trapHouseContent || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container two-column">
          ${imagePanel({ imageSrc: page.hero?.imageSrc, imageAlt: page.hero?.imageAlt })}
          <article class="panel">
            ${sectionHeader(ui.sections?.discordCta)}
            <div class="cta-row">${button(page.hero?.ctaPrimaryLabel || "Enter Trap House", page.discordInviteUrl || content.links?.discord || "#", true)}</div>
          </article>
        </div>
      </section>
      <section class="section compact">
        <div class="container grid community-grid">
          ${(page.communityCards || []).map(evidenceCard).join("")}
        </div>
      </section>
      <section class="section compact">
        <div class="container grid card-grid">
          <article class="evidence-card">${sectionHeader(page.passRoleNote)}</article>
          <article class="evidence-card">${sectionHeader(page.rulesNote)}</article>
        </div>
      </section>
    `;
  }

  function renderStore() {
    const page = content.storeContent || {};
    const visibleProducts = (page.products || []).filter((product) => product.checkoutEnabled !== false);
    return `
      ${renderHero(page.hero)}
      <section class="section compact" id="drop-table">
        <div class="container">
          ${sectionHeader(ui.sections?.dropTable)}
          <div class="grid product-grid">
            ${visibleProducts.map(renderProductCard).join("")}
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="container panel">${sectionHeader(page.disclaimer)}</div>
      </section>
    `;
  }

  function renderProductCard(product = {}) {
    const title = product.displayTitle || product.name;
    const benefits = Array.isArray(product.benefits) ? product.benefits.filter(Boolean) : [];
    return `
      <article class="product-card" id="${attr(product.id)}">
        <div class="product-media${product.imageFit === "contain" ? " is-contain" : ""}">
          ${product.imageSrc ? `<img src="${attr(product.imageSrc)}" alt="${attr(product.imageAlt || product.name || placeholders.imageSlot || "IMAGE SLOT")}" loading="lazy" onerror="this.closest('.product-media').innerHTML='<div class=&quot;image-slot&quot;>${attr(placeholders.imageSlot || "IMAGE SLOT")}</div>'" />` : `<div class="image-slot">${esc(placeholders.imageSlot || "IMAGE SLOT")}</div>`}
        </div>
        <div>
          <div class="product-meta">
            ${statusBadge(product.status || states.comingSoon || "Available Soon")}
            <strong class="price">${esc(product.price || "")}</strong>
          </div>
          <div class="tag-row product-tags">
            ${product.category ? `<span class="tag">${esc(product.category)}</span>` : ""}
            ${product.billingInterval ? `<span class="tag">${esc(product.billingInterval)}</span>` : ""}
          </div>
          <div class="product-title">${esc(title)}</div>
        </div>
        ${copyBlock(product.description)}
        ${benefits.length ? `<ul class="benefit-list">${benefits.map((benefit) => `<li>${esc(benefit)}</li>`).join("")}</ul>` : ""}
        <button class="button primary" type="button" data-checkout-product="${attr(product.key)}" data-checkout-enabled="${product.checkoutEnabled === false ? "false" : "true"}" data-checkout-quantity="1" aria-disabled="true" disabled>${esc(product.buttonLabel || actions.preorder || "Preorder")}</button>
      </article>
    `;
  }

  function renderAbout() {
    const page = content.aboutContent || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container">
          ${sectionHeader(page.whatIs)}
          <div class="grid card-grid">${(page.whatIs?.cards || []).map(evidenceCard).join("")}</div>
        </div>
      </section>
      <section class="section compact">
        <div class="container two-column">
          ${imagePanel(page.creator)}
          <article class="panel">
            ${eyebrowMarkup(page.creator?.eyebrow || "Creator", page.creator?.headline || "Ryan Homanics")}
            <h2>${esc(page.creator?.headline || "Ryan Homanics")}</h2>
            ${copyBlock(page.creator?.bio)}
            <div class="cta-row">${(page.creator?.buttons || []).map((item, index) => button(item.label, item.href, index === 0)).join("")}</div>
          </article>
        </div>
      </section>
      <section class="section compact">
        <div class="container panel">
          ${sectionHeader(page.whyMakingThis)}
        </div>
      </section>
      <section class="section compact">
        <div class="container two-column">
          <article class="panel">${sectionHeader(page.whyDocumentedIt)}</article>
          <article class="panel">${sectionHeader(page.firstBookTransition)}</article>
        </div>
      </section>
      <section class="section compact">
        <div class="container two-column">
          ${imagePanel(page.priorWork)}
          <article class="panel">${sectionHeader(page.priorWork)}</article>
        </div>
      </section>
      <section class="section compact">
        <div class="container panel">
          ${sectionHeader(page.disclaimer)}
        </div>
      </section>
    `;
  }

  function renderBook() {
    const page = content.bookContent || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container two-column book-overview-layout">
          ${imagePanel(page.imagePanel)}
          <article class="panel book-long-copy">
            ${eyebrowMarkup(page.overview?.eyebrow || "Overview", page.overview?.headline || "Overview")}
            <h2>${esc(page.overview?.headline || "Overview")}</h2>
            <p class="section-copy"><strong><em>${esc(page.overview?.introTitle || "")}</em></strong> ${esc(page.overview?.introText || "")}</p>
            ${copyBlock(page.overview?.body, "section-copy")}
            ${page.overview?.closingStatement ? `<p class="section-copy book-closing-statement"><strong>${esc(page.overview.closingStatement)}</strong></p>` : ""}
          </article>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="grid book-connection-grid">
            ${(page.connectCards || []).map((card) => `
              <article class="panel book-connection-copy${card.imageSrc ? " with-media" : ""}">
                <div class="book-connection-text">
                  <h3>${esc(card.label)}</h3>
                  ${copyBlock(card.body)}
                  ${card.closingStatement ? `<p class="body-copy book-closing-statement"><strong>${esc(card.closingStatement)}</strong></p>` : ""}
                </div>
                ${card.imageSrc ? `<figure class="book-connection-media"><img src="${attr(card.imageSrc)}" alt="${attr(card.imageAlt || card.label || "Book archive image")}" loading="lazy" /></figure>` : ""}
              </article>
            `).join("")}
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="container panel">
          ${sectionHeader(page.cta)}
          <div class="cta-row">${button(page.cta?.ctaPrimaryLabel || "Preorder", page.cta?.ctaPrimaryHref || "/store/#hardcover", true)}</div>
        </div>
      </section>
    `;
  }

  function renderDocumentary() {
    const page = content.documentaryContent || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container two-column documentary-overview-layout">
          ${imagePanel(page.imagePanel)}
          <article class="panel documentary-long-copy">
            ${eyebrowMarkup(page.synopsis?.eyebrow || "Documentary", page.synopsis?.headline || "Synopsis")}
            <h2>${esc(page.synopsis?.headline || "Synopsis")}</h2>
            <p class="section-copy"><strong><em>${esc(page.synopsis?.introTitle || "")}</em></strong> ${esc(page.synopsis?.introText || "")}</p>
            ${copyBlock(page.synopsis?.body, "section-copy")}
            ${page.synopsis?.closingStatement ? `<p class="section-copy documentary-closing-statement"><strong>${esc(page.synopsis.closingStatement)}</strong></p>` : ""}
          </article>
        </div>
      </section>
    `;
  }

  function renderMyPass() {
    const page = content.passContent || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container" data-my-pass-output>${loadingState()}</div>
      </section>
    `;
  }

  function renderPublicPass() {
    const page = content.passContent || {};
    return `
      ${renderHero(page.publicHero)}
      <section class="section compact">
        <div class="container two-column">
          <article class="panel">
            <form class="lookup-form pass-form" data-public-pass-lookup>
              <label class="field"><span>${esc(forms.passId || "Permanent holder ID")}</span><input name="query" autocomplete="off" autocapitalize="characters" spellcheck="false" required /></label>
              <button class="button primary" type="submit">${esc(forms.viewPublicPass || "Open Holder Profile")}</button>
            </form>
            <div class="notice" data-public-pass-notice></div>
          </article>
          <div data-public-pass-output>${emptyState("Enter an exact permanent holder ID.")}</div>
        </div>
      </section>
    `;
  }

  function renderTrapVerify() {
    const page = content.passContent || {};
    return `
      ${renderHero(page.verifyHero || page.publicHero)}
      <section class="section compact">
        <div class="container two-column">
          <article class="panel">
            <form class="lookup-form pass-form" data-pass-validation-form>
              <label class="field"><span>${esc(forms.verificationToken || "Holder ID or card serial")}</span><input name="serial" autocomplete="off" autocapitalize="characters" spellcheck="false" required /></label>
              <button class="button primary" type="submit">${esc(forms.verifyPass || "Verify Pass")}</button>
            </form>
          </article>
          <article class="validation-result panel" data-pass-validation-output>${emptyState("Enter an exact holder ID or card serial.")}</article>
        </div>
      </section>
    `;
  }

  function renderTrapPassAdmin() {
    const page = content.trapPassAdminContent || {};
    const localReview = Boolean(window.TrapHouse?.admin?.localReview);
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container admin-workspace">
          <article class="panel">
            <span class="status">${esc(localReview ? "Local review data only" : "Server authorization required")}</span>
            <form class="pass-form" data-trap-pass-admin-search>
              ${localReview ? "" : `<label class="field"><span>Admin access token</span><input name="token" type="password" autocomplete="off" required /></label>`}
              <label class="field"><span>Email, holder ID, identity, or exact serial</span><input name="query" autocomplete="off" required /></label>
              <button class="button primary" type="submit">Search</button>
            </form>
            <div class="notice" data-trap-pass-admin-notice></div>
          </article>
          <div data-trap-pass-admin-output>${emptyState("Search for a holder to review the wallet.")}</div>
        </div>
      </section>
    `;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function passArtwork(card = {}, side = "front") {
    const src = side === "back" ? card.backArtwork : card.frontArtwork;
    const placeholderText = side === "back" ? card.backPlaceholder : card.frontPlaceholder;
    if (src) return `<img src="${attr(src)}" alt="${attr(`${card.waveName || "Trap Pass"} ${side}`)}" />`;
    return `<div class="pass-art-needed"><span>${esc(placeholderText || `${side.toUpperCase()} ART NEEDED`)}</span></div>`;
  }

  function renderCardFace(wallet = {}, card = {}, side = "front") {
    return `
      <div class="pass-card-face pass-card-${attr(side)}">
        <div class="pass-card-art">${passArtwork(card, side)}</div>
        <div class="pass-identity-banner">
          <strong>${esc(wallet.displayIdentity || wallet.trapIdentity || wallet.holderPublicId)}</strong>
          <span>${esc(wallet.holderPublicId)} / ${esc(card.cardSerial)}</span>
          <small>${esc(card.waveName || "Trap Pass")} / ${esc(wallet.currentTierLabel || "Free Pass")}</small>
        </div>
      </div>
    `;
  }

  function renderSelectedPass(wallet, card, flipped = false) {
    if (!card) return emptyState("No collectible pass is in this wallet yet.");
    return `
      <section class="selected-pass tier-${attr(wallet.currentTierId || "free")}">
        <div class="pass-card-stage${flipped ? " is-flipped" : ""}" data-selected-pass-stage>
          <div class="pass-card-inner">
            ${renderCardFace(wallet, card, "front")}
            ${renderCardFace(wallet, card, "back")}
          </div>
        </div>
        <div class="selected-pass-controls" aria-label="Selected pass controls">
          <button class="button primary" type="button" data-pass-flip>${esc(actions.flipCard || "Flip Card")}</button>
          <button class="button" type="button" data-pass-download="front" data-card-serial="${attr(card.cardSerial)}">${esc(actions.downloadFront || "Download Front PNG")}</button>
          <button class="button" type="button" data-pass-download="back" data-card-serial="${attr(card.cardSerial)}">${esc(actions.downloadBack || "Download Back PNG")}</button>
        </div>
      </section>
    `;
  }

  function renderWalletCollection(wallet, selectedSerial) {
    return `
      <section class="wallet-section">
        <header class="section-header"><span class="eyebrow">Collection</span><h2>Your Passes</h2></header>
        <div class="pass-collection">
          ${(wallet.cards || []).map((card) => `
            <button class="pass-thumbnail${card.cardSerial === selectedSerial ? " is-selected" : ""}" type="button" data-select-pass="${attr(card.cardSerial)}" ${card.status !== "active" ? "disabled" : ""}>
              <span class="pass-thumbnail-art">${passArtwork(card, "front")}</span>
              <strong>${esc(card.waveName)}</strong>
              <small>${esc(card.cardSerial)}${card.status === "active" ? "" : ` / ${esc(card.status)}`}</small>
            </button>
          `).join("") || emptyState("No collectible passes yet.")}
        </div>
      </section>
    `;
  }

  function threadChoices(selected = []) {
    const selectedSet = new Set(selected || []);
    return (content.threadContent?.threads || []).map((thread) => `
      <label class="check-row"><input type="checkbox" name="threadSlugs" value="${attr(thread.slug)}" ${selectedSet.has(thread.slug) ? "checked" : ""} /><span>${esc(thread.title)}</span></label>
    `).join("");
  }

  function renderWallet(wallet, selectedSerial, flipped = false) {
    const selectedCard = (wallet.cards || []).find((card) => card.cardSerial === selectedSerial) || wallet.featuredPass || wallet.cards?.[0];
    const available = wallet.availableReleases || [];
    const unlockEmail = window.TrapHouse?.config?.cashForTrash?.personalUnlockEmail || "imhighoncrackandihaveagun@gmail.com";
    const unlockMail = `mailto:${unlockEmail}?subject=${encodeURIComponent(`Cash For Trash unlock ${wallet.holderPublicId}`)}&body=${encodeURIComponent(wallet.personalUnlockCode || "")}`;
    return `
      <div class="wallet-shell" data-wallet data-selected-serial="${attr(selectedCard?.cardSerial || "")}" data-flipped="${flipped ? "true" : "false"}">
        <section class="wallet-identity">
          <span class="status">${esc(wallet.currentTierPublicLabel || wallet.currentTierLabel)}</span>
          <h2>${esc(wallet.displayIdentity || wallet.holderPublicId)}</h2>
          <div class="meta-list">
            ${metaRow(labels.passId || "Permanent Holder ID", wallet.holderPublicId)}
            ${metaRow("Original Entry Wave", `${wallet.originalEntryWaveLabel} / ${wallet.originalEntryWave}`)}
            ${metaRow(labels.tier || "Current Tier", wallet.currentTierLabel)}
            ${metaRow(labels.memberSince || "Member Since", formatDate(wallet.memberSince))}
          </div>
        </section>
        ${renderSelectedPass(wallet, selectedCard, flipped)}
        ${renderWalletCollection(wallet, selectedCard?.cardSerial)}
        ${available.length ? `
          <section class="wallet-section panel">
            <header class="section-header"><span class="eyebrow">Available Now</span><h2>Claim A New Pass</h2></header>
            <div class="cta-row">${available.map((release) => `<button class="button primary" type="button" data-claim-release="${attr(release.id)}">${esc(`${actions.claimNewPass || "Claim New Pass"}: ${release.name}`)}</button>`).join("")}</div>
          </section>
        ` : ""}
        <section class="wallet-section wallet-grid">
          <article class="panel">
            <header class="section-header"><span class="eyebrow">Current Tier</span><h2>${esc(wallet.currentTierLabel)}</h2></header>
            ${wallet.cashForTrashActive && wallet.personalUnlockCode ? `
              <div class="private-unlock">
                <span>Private personal unlock code</span>
                <strong>${esc(wallet.personalUnlockCode)}</strong>
                <div class="cta-row"><button class="button" type="button" data-copy-value="${attr(wallet.personalUnlockCode)}">${esc(actions.copyUnlockCode || "Copy Personal Unlock Code")}</button>${button(actions.emailUnlockCode || "Email Your Code", unlockMail)}</div>
              </div>
            ` : ""}
            <div class="cta-row">${button(actions.upgradePass || "Upgrade Tier", "/store/#cash-for-trash", true)}${button(actions.buyPhysicalPass || "Buy Physical Pass", "/store/#handy-sass")}</div>
          </article>
          <article class="panel">${sectionHeader(content.passContent?.explainer)}</article>
        </section>
        <section class="wallet-section panel">
          <header class="section-header"><span class="eyebrow">Holder Profile</span><h2>Privacy And Public Threads</h2></header>
          <form class="pass-form" data-wallet-profile-form>
            <label class="field"><span>Trap identity</span><input name="trapIdentity" maxlength="40" value="${attr(wallet.trapIdentity || "")}" /></label>
            <label class="check-row"><input name="publicProfileEnabled" type="checkbox" ${wallet.publicProfileEnabled ? "checked" : ""} /><span>Make my holder profile public</span></label>
            <fieldset class="thread-checks"><legend>Threads shown on my public profile</legend>${threadChoices(wallet.selectedPublicThreadSlugs)}</fieldset>
            <div class="cta-row"><button class="button primary" type="submit">${esc(actions.saveProfile || "Save Profile")}</button>${wallet.publicProfileEnabled ? button(actions.viewPublicProfile || "View Public Profile", wallet.publicProfileUrl) : ""}<button class="button" type="button" data-wallet-signout>${esc(actions.signOut || "Close Wallet")}</button></div>
          </form>
          <div class="notice" data-wallet-notice></div>
        </section>
      </div>
    `;
  }

  function renderWalletRecovery(message = "") {
    const page = content.passContent || {};
    const accessReady = Boolean(window.TrapHouse?.admin?.localReview)
      || Boolean(window.TrapHouse?.config?.recovery?.emailProviderConfigured);
    return `
      <div class="wallet-recovery two-column">
        <article class="panel">${sectionHeader(page.recovery)}</article>
        <article class="panel">
          ${accessReady ? `<form class="pass-form" data-wallet-recovery-form>
            <label class="field"><span>${esc(forms.email || "Email")}</span><input name="email" type="email" autocomplete="email" required /></label>
            <button class="button primary" type="submit">${esc(forms.myPass || "Open My Pass")}</button>
          </form>` : ""}
          <div class="notice${message || !accessReady ? " active" : ""}" data-wallet-recovery-notice>${esc(message || (!accessReady ? "Secure email wallet access is being connected and is not open yet." : ""))}</div>
        </article>
      </div>
    `;
  }

  function renderPublicHolderProfile(profile) {
    if (!profile?.valid) return errorState(content.passContent?.invalidMessage || "INVALID TRAP PASS");
    if (profile.private || !profile.publicProfileEnabled) {
      return `<div class="validation-result is-valid panel"><strong>VALID TRAP PASS</strong><p>${esc(content.passContent?.publicPrivateMessage || "This holder's profile is private.")}</p></div>`;
    }
    const publicWallet = {
      holderPublicId: profile.holderPublicId,
      trapIdentity: profile.trapIdentity,
      displayIdentity: profile.trapIdentity || profile.holderPublicId,
      currentTierLabel: profile.currentTierLabel
    };
    return `
      <article class="public-holder-profile">
        <span class="status">VALID TRAP PASS</span>
        <h2>${esc(profile.trapIdentity || profile.holderPublicId)}</h2>
        <div class="meta-list">
          ${metaRow(labels.passId || "Permanent Holder ID", profile.holderPublicId)}
          ${metaRow("Original Entry Wave", `${profile.originalEntryWaveLabel || ""} / ${profile.originalEntryWave || ""}`)}
          ${metaRow(labels.tier || "Current Tier", profile.currentTierLabel)}
          ${metaRow(labels.memberSince || "Member Since", formatDate(profile.memberSince))}
        </div>
        ${profile.featuredPass ? renderSelectedPass(publicWallet, profile.featuredPass, false) : ""}
        ${(profile.selectedPublicThreads || []).length ? `<section class="wallet-section"><h3>Selected Threads</h3><div class="tag-row">${profile.selectedPublicThreads.map((slug) => `<a class="tag" href="/threads/${attr(slug)}/">${esc(findThread(slug)?.title || slug)}</a>`).join("")}</div></section>` : ""}
        ${(profile.approvedContributions || []).length ? `<section class="wallet-section"><h3>Approved Contributions</h3><div class="grid card-grid">${profile.approvedContributions.map((item) => `<article class="panel"><h3>${esc(item.title)}</h3>${copyBlock(item.description)}${item.url ? button("Open", item.url) : ""}</article>`).join("")}</div></section>` : ""}
      </article>
    `;
  }

  function renderCheckoutSuccess() {
    const page = content.checkoutSuccessContent || {};
    return `
      ${renderHero(page.hero)}
      <section class="section compact">
        <div class="container panel">
          ${sectionHeader(page.status)}
          <div class="cta-row">
            ${button(content.storeContent?.hero?.ctaPrimaryLabel || "Open Store", "/store/", true)}
            ${button(forms.myPass || "My Pass", "/my-pass/")}
          </div>
        </div>
      </section>
    `;
  }

  function renderLegacy(page) {
    const legacy = {
      ...(content.legacyContent?.default || {}),
      ...(content.legacyContent?.[page] || {})
    };
    return `
      ${renderHero(legacy)}
      <section class="section compact">
        <div class="container panel">
          ${sectionHeader(legacy)}
          <div class="cta-row">
            ${button(legacy.ctaPrimaryLabel || "Open The Map", legacy.ctaPrimaryHref || "/map/", true)}
            ${button(legacy.ctaSecondaryLabel || "Get Trap Pass", legacy.ctaSecondaryHref || "/trap-pass/")}
          </div>
        </div>
      </section>
    `;
  }

  function renderPage(page) {
    if (page === "home") return renderHome();
    if (page === "map") return renderMap();
    if (page === "january-22") return renderJanuary22();
    if (page === "drops") return renderDrops();
    if (page === "trap-pass") return renderTrapPass();
    if (page === "trap-house") return renderTrapHouse();
    if (page === "store") return renderStore();
    if (page === "about") return renderAbout();
    if (page === "book") return renderBook();
    if (page === "documentary") return renderDocumentary();
    if (page === "thread-detail") return renderThreadDetail();
    if (page === "my-pass") return renderMyPass();
    if (page === "pass") return renderPublicPass();
    if (page === "trap-verify") return renderTrapVerify();
    if (page === "checkout-success") return renderCheckoutSuccess();
    if (page === "preorders" || page === "shop") return renderStore();
    if (page === "threads") return renderMap();
    if (page === "archive" || page === "check-pass" || page === "start-here" || page === "dopesick" || page === "discord") return renderLegacy(page);
    return renderLegacy(page);
  }

  function wireTrapPassClaim() {
    const form = document.querySelector("[data-trap-pass-claim]");
    const output = document.querySelector("[data-claim-output]");
    if (!form || !output) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!window.TrapHouse?.createTrapPassAsync) {
        output.className = "notice error active";
        output.textContent = states.unavailable || "Unavailable.";
        return;
      }
      const data = new FormData(form);
      output.className = "notice active";
      output.textContent = states.loading || "Loading...";
      try {
        const result = await window.TrapHouse.createTrapPassAsync({
          email: data.get("email"),
          trapIdentity: data.get("trapIdentity"),
          discordUsername: data.get("discordUsername"),
          publicProfileEnabled: data.get("publicProfileEnabled") === "1"
        });
        if (result?.wallet) {
          const passId = result.wallet.holderPublicId || "Trap Pass ready";
          const cardSerial = result.wallet.featuredPass?.cardSerial || "Card ready";
          const copyButton = `<button class="button" type="button" data-copy-value="${attr(passId)}">${esc(actions.copyPassId || "Copy Holder ID")}</button>`;
          const validationButton = button(forms.verifyPass || "Check Your Pass", `/check-pass/?serial=${encodeURIComponent(cardSerial)}`, true);
          output.className = "notice active";
          output.innerHTML = `<strong>${esc(result.existed ? "Trap Pass already claimed." : "Trap Pass claimed.")}</strong><p>${esc(`${passId} / ${cardSerial}`)}</p><div class="cta-row">${validationButton}${copyButton}</div>`;
          wireCopyButtons();
          refreshNav();
        } else {
          output.className = `notice${result?.blocked ? " error" : ""} active`;
          output.textContent = result?.message || "Check your email for a secure access link.";
        }
      } catch (error) {
        output.className = "notice error active";
        output.textContent = error.message || states.error || "Something went wrong.";
      }
    });
  }

  function wireMyPass() {
    const output = document.querySelector("[data-my-pass-output]");
    if (!output) return;
    let wallet = null;
    let selectedSerial = "";
    let flipped = false;

    const showRecovery = (message = "") => {
      wallet = null;
      output.innerHTML = renderWalletRecovery(message);
      const form = output.querySelector("[data-wallet-recovery-form]");
      const notice = output.querySelector("[data-wallet-recovery-notice]");
      form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        notice.className = "notice active";
        notice.textContent = states.loading || "Loading...";
        try {
          const result = await window.TrapHouse.requestAccessAsync(new FormData(form).get("email"));
          const openedWallet = await window.TrapHouse.getMyWalletAsync();
          if (openedWallet) {
            showWallet(openedWallet);
            return;
          }
          notice.className = `notice${result?.blocked ? " error" : ""} active`;
          notice.textContent = result?.message || "Check your email for a secure access link.";
        } catch (error) {
          notice.className = "notice error active";
          notice.textContent = error.message || states.error || "Something went wrong.";
        }
      });
    };

    const bindWallet = () => {
      const shell = output.querySelector("[data-wallet]");
      const notice = output.querySelector("[data-wallet-notice]");
      shell?.querySelector("[data-pass-flip]")?.addEventListener("click", () => {
        flipped = !flipped;
        shell.querySelector("[data-selected-pass-stage]")?.classList.toggle("is-flipped", flipped);
      });
      shell?.querySelectorAll("[data-select-pass]").forEach((node) => node.addEventListener("click", () => {
        selectedSerial = node.dataset.selectPass || "";
        flipped = false;
        showWallet(wallet);
      }));
      shell?.querySelectorAll("[data-pass-download]").forEach((node) => node.addEventListener("click", async () => {
        try {
          await window.TrapHouse.downloadPassPng(wallet, node.dataset.cardSerial, node.dataset.passDownload);
        } catch (error) {
          if (notice) {
            notice.className = "notice error active";
            notice.textContent = error.message || states.error || "Something went wrong.";
          }
        }
      }));
      shell?.querySelectorAll("[data-claim-release]").forEach((node) => node.addEventListener("click", async () => {
        try {
          const updated = await window.TrapHouse.claimNewReleaseAsync(node.dataset.claimRelease);
          showWallet(updated);
        } catch (error) {
          if (notice) {
            notice.className = "notice error active";
            notice.textContent = error.message || states.error || "Something went wrong.";
          }
        }
      }));
      shell?.querySelector("[data-wallet-profile-form]")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        try {
          const updated = await window.TrapHouse.updateMyProfileAsync({
            trapIdentity: data.get("trapIdentity"),
            publicProfileEnabled: data.get("publicProfileEnabled") === "on",
            selectedPublicThreadSlugs: data.getAll("threadSlugs")
          });
          showWallet(updated);
        } catch (error) {
          if (notice) {
            notice.className = "notice error active";
            notice.textContent = error.message || states.error || "Something went wrong.";
          }
        }
      });
      shell?.querySelector("[data-wallet-signout]")?.addEventListener("click", () => {
        window.TrapHouse.signOut();
        showRecovery("Wallet closed on this device.");
        refreshNav();
      });
      wireCopyButtons();
    };

    const showWallet = (nextWallet) => {
      wallet = nextWallet;
      selectedSerial = selectedSerial || wallet?.featuredPass?.cardSerial || wallet?.cards?.[0]?.cardSerial || "";
      output.innerHTML = renderWallet(wallet, selectedSerial, flipped);
      bindWallet();
      refreshNav();
    };

    Promise.resolve(window.TrapHouse?.getMyWalletAsync?.())
      .then((result) => result ? showWallet(result) : showRecovery())
      .catch((error) => showRecovery(error.message || states.error || "Something went wrong."));
  }

  function wirePublicPass() {
    const form = document.querySelector("[data-public-pass-lookup]");
    const output = document.querySelector("[data-public-pass-output]");
    const notice = document.querySelector("[data-public-pass-notice]");
    if (!output) return;
    const params = new URLSearchParams(window.location.search);
    const pathMatch = window.location.pathname.match(/\/pass\/([^/]+)\/?$/i);
    const query = params.get("id") || params.get("pass") || pathMatch?.[1] || "";

    async function lookup(value) {
      output.innerHTML = loadingState();
      try {
        const profile = await window.TrapHouse?.getPublicProfileAsync?.(value);
        if (!profile?.valid) throw new Error(content.passContent?.invalidMessage || "INVALID TRAP PASS");
        notice.className = "notice";
        notice.textContent = "";
        output.innerHTML = renderPublicHolderProfile(profile);
      } catch (error) {
        notice.className = "notice error active";
        notice.textContent = error.message || states.error || "Something went wrong.";
        output.innerHTML = errorState(error.message || states.error || "Something went wrong.");
      }
    }

    if (query) lookup(query);
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      lookup(new FormData(form).get("query"));
    });
  }

  function wirePassValidation() {
    document.querySelectorAll("[data-pass-validation-form]").forEach((form) => {
      const panel = form.closest(".panel") || form.parentElement;
      const output = panel?.querySelector("[data-pass-validation-output], [data-pass-validation-notice]")
        || document.querySelector("[data-pass-validation-output]");
      const runLookup = async (serial) => {
        if (!output) return;
        output.className = "notice active";
        output.textContent = states.loading || "Loading...";
        try {
          const result = await window.TrapHouse.validateSerialAsync(serial);
          output.className = `validation-result panel ${result?.valid ? "is-valid" : "is-invalid"}`;
          output.innerHTML = result?.valid
            ? `<strong>VALID TRAP PASS</strong>${result.profileAvailable && result.profileUrl ? `<div class="cta-row">${button(actions.viewPublicProfile || "View Public Profile", result.profileUrl, true)}</div>` : ""}`
            : `<strong>INVALID TRAP PASS</strong>`;
        } catch (error) {
          output.className = "notice error active";
          output.textContent = error.message || states.error || "Something went wrong.";
        }
      };
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await runLookup(new FormData(form).get("serial"));
      });
      const serialFromUrl = new URLSearchParams(window.location.search).get("serial");
      if (serialFromUrl) {
        const input = form.querySelector('[name="serial"]');
        if (input) input.value = serialFromUrl;
        runLookup(serialFromUrl);
      }
    });
  }

  function wireCopyButtons() {
    document.querySelectorAll("[data-copy-pass], [data-copy-value]").forEach((buttonNode) => {
      if (buttonNode.dataset.bound === "true") return;
      buttonNode.dataset.bound = "true";
      buttonNode.addEventListener("click", async () => {
        const value = buttonNode.getAttribute("data-copy-pass") || buttonNode.getAttribute("data-copy-value") || "";
        try {
          await navigator.clipboard.writeText(value);
          buttonNode.textContent = actions.copied || "Copied";
        } catch (error) {
          buttonNode.textContent = value;
        }
      });
    });
  }

  function refreshNav() {
    const page = document.body.dataset.page || "home";
    const oldNav = document.querySelector(".site-nav");
    const oldMobileNav = document.querySelector(".mobile-bottom-nav");
    if (oldNav) oldNav.outerHTML = renderNav(page).replace('<a class="skip-link" href="#main">Skip to content</a>', "");
    if (oldMobileNav) oldMobileNav.outerHTML = renderMobileNav(page);
  }

  function wireInstagramEmbeds() {
    const embeds = document.querySelectorAll(".instagram-media");
    if (!embeds.length) return;
    const processEmbeds = () => window.instgrm?.Embeds?.process?.();
    if (window.instgrm?.Embeds?.process) {
      processEmbeds();
      return;
    }
    const existingScript = document.querySelector("script[data-instgrm-embed]");
    if (existingScript) {
      existingScript.addEventListener("load", processEmbeds, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.dataset.instgrmEmbed = "true";
    script.addEventListener("load", processEmbeds, { once: true });
    document.body.append(script);
  }

  function afterRender(page) {
    if (page === "trap-pass") wireTrapPassClaim();
    if (page === "my-pass") wireMyPass();
    if (page === "pass") wirePublicPass();
    if (page === "trap-pass" || page === "trap-verify") wirePassValidation();
    wireInstagramEmbeds();
    window.TrapHouse?.wireDiscordLinks?.();
    window.TrapHouse?.wireOfficialLinks?.();
    window.TrapHouse?.wirePublicFooter?.();
  }

  function init() {
    const root = document.getElementById("site-root");
    if (!root) return;
    const page = document.body.dataset.page || "home";
    applySeo(page);
    root.innerHTML = `
      <div class="site-shell">
        ${renderNav(page)}
        <main class="site-main" id="main">
          ${renderPage(page)}
        </main>
        ${renderFooter()}
        ${renderMobileNav(page)}
      </div>
    `;
    afterRender(page);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
