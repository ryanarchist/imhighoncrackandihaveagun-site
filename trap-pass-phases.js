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

  async function loadPhases() {
    const response = await fetch("/data/trap-pass-phases.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Trap Pass guide could not be loaded.");
    return response.json();
  }

  function phaseForPass(pass) {
    if (window.TrapHouse?.getTrapPassPhase) return window.TrapHouse.getTrapPassPhase(pass);
    if (!pass) return { level: 0, title: "Front Door" };
    const missions = Number(pass.missions_completed) || 0;
    const unlock = Number(pass.unlock_level) || 0;
    if (unlock >= 5) return { level: 6, title: "Proof Ready" };
    if (unlock >= 4) return { level: 5, title: "Proof Ready" };
    if (unlock >= 2) return { level: 4, title: "Archive Witness" };
    if (missions >= 1) return { level: 3, title: "Mission Proof" };
    if ((pass.thread_keys || []).length) return { level: 2, title: "Thread Witness" };
    return { level: 1, title: "Claim The Key" };
  }

  function renderCurrentPhase(model) {
    const mount = document.querySelector("[data-current-phase]");
    if (!mount) return;
    const pass = window.TrapHouse?.getCurrentPass ? window.TrapHouse.getCurrentPass() : null;
    const current = phaseForPass(pass);
    const phase = model.phases.find((item) => Number(item.level) === Number(current.level)) || model.phases[0];
    mount.innerHTML = `
      <article class="pass-card">
        <span class="pass-stamp">Current Key</span>
        <div class="pass-id">P${safe(phase.level)}</div>
        <p class="lead">${safe(phase.title)}</p>
        <div class="meta-list compact">
          <div><span>Pass</span><strong>${safe(pass?.trap_pass_id || "No pass selected")}</strong></div>
          <div><span>Role</span><strong>${safe(phase.primary_role)}</strong></div>
          <div><span>Status</span><strong>${safe(phase.status)}</strong></div>
          <div><span>Signal</span><strong>${safe(phase.unlock_signal)}</strong></div>
        </div>
      </article>
    `;
  }

  function renderPhases(model) {
    const mount = document.querySelector("[data-phase-list]");
    if (!mount) return;
    const pass = window.TrapHouse?.getCurrentPass ? window.TrapHouse.getCurrentPass() : null;
    const current = phaseForPass(pass);
    mount.innerHTML = model.phases.map((phase) => {
      const active = Number(phase.level) <= Number(current.level);
      return `
        <article class="phase-card ${active ? "active" : "locked"}">
          <span class="thread-number">P${safe(phase.level)}</span>
          <span class="tag">${safe(phase.status)}</span>
          <h3>${safe(phase.title)}</h3>
          <div class="phase-copy">
            <strong>What it means:</strong>
            <p>${safe(phase.summary)}</p>
          </div>
          <div class="meta-list compact">
            <div><span>Role</span><strong>${safe(phase.primary_role)}</strong></div>
            <div><span>Signals</span><strong>${safe(phase.channels.join(", "))}</strong></div>
            <div><span>Moves Forward</span><strong>${safe(phase.unlock_signal)}</strong></div>
          </div>
          <div class="phase-routes"><span>Paths</span><strong>${safe(phase.site_routes.join(", "))}</strong></div>
        </article>
      `;
    }).join("");
  }

  async function initTrapPassPhases() {
    try {
      const model = await loadPhases();
      window.TrapHousePhases = model;
      renderCurrentPhase(model);
      renderPhases(model);
    } catch (error) {
      document.querySelectorAll("[data-phase-error]").forEach((mount) => {
        mount.className = "notice error active";
        mount.innerHTML = `<strong>Key guide load error.</strong><p>${safe(error.message)}</p>`;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTrapPassPhases);
  } else {
    initTrapPassPhases();
  }
})();
