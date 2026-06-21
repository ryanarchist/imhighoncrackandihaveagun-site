(function () {
  function fallbackEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safe(value) {
    return window.TrapHouse?.escapeHTML ? window.TrapHouse.escapeHTML(value) : fallbackEscape(value);
  }

  async function loadSiteModel() {
    const response = await fetch("/data/site-model.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Site model could not be loaded.");
    }
    return response.json();
  }

  function renderAssetGrid(model) {
    document.querySelectorAll("[data-asset-grid]").forEach((mount) => {
      const ids = (mount.dataset.assetGrid || "").split(",").map((id) => id.trim()).filter(Boolean);
      const assets = ids.length
        ? model.featured_assets.filter((asset) => ids.includes(asset.id))
        : model.featured_assets;
      mount.innerHTML = assets.map((asset) => `
        <article class="asset-card ${safe(asset.ratio)}">
          <img src="${safe(asset.path)}" alt="${safe(asset.title)}" loading="lazy" />
          <div>
            <span class="tag">${safe(asset.use)}</span>
            <h3>${safe(asset.title)}</h3>
          </div>
        </article>
      `).join("");
    });
  }

  function renderDropList(model) {
    document.querySelectorAll("[data-drop-list]").forEach((mount) => {
      mount.innerHTML = model.drops.map((drop) => `
        <article class="drop-card">
          <span class="tag">${safe(drop.status)}</span>
          <h3>${safe(drop.name)}</h3>
          <div class="drop-limit">Limit ${safe(drop.limit)}</div>
          <p>${safe(drop.notes)}</p>
          <strong>${safe(drop.integration)}</strong>
        </article>
      `).join("");
    });
  }

  function renderChecklist(model) {
    document.querySelectorAll("[data-launch-checklist]").forEach((mount) => {
      mount.innerHTML = model.launch_checklist.map((item) => `
        <div class="check-row ${item.done ? "done" : "pending"}">
          <span>${item.done ? "Done" : "Pending"}</span>
          <strong>${safe(item.item)}</strong>
        </div>
      `).join("");
    });
  }

  function renderStatus(model) {
    document.querySelectorAll("[data-launch-status]").forEach((mount) => {
      mount.innerHTML = `
        <strong>${model.project.public_launch_ready ? "Ready" : "Under Review"}</strong>
        <span>${safe(model.project.status).replace(/_/g, " ")}</span>
      `;
    });
  }

  async function initSiteModel() {
    try {
      const model = await loadSiteModel();
      window.TrapHouseSiteModel = model;
      renderAssetGrid(model);
      renderDropList(model);
      renderChecklist(model);
      renderStatus(model);
    } catch (error) {
      document.querySelectorAll("[data-site-model-error]").forEach((mount) => {
        mount.className = "notice error active";
        mount.innerHTML = `<strong>Model load error.</strong><p>${safe(error.message)}</p>`;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteModel);
  } else {
    initSiteModel();
  }
})();
