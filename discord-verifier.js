let discordVerifierInitAttempts = 0;

function initDiscordVerifier() {
  const form = document.querySelector("[data-discord-verify-form]");
  const output = document.querySelector("[data-discord-verify-output]");
  if (!form || !output) return;
  if (!window.TrapHouse) {
    if (discordVerifierInitAttempts < 20) {
      discordVerifierInitAttempts += 1;
      setTimeout(initDiscordVerifier, 50);
    }
    return;
  }
  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  function safe(value) {
    return window.TrapHouse.escapeHTML(value);
  }

  function renderResult(result) {
    if (!result.verified) {
      output.innerHTML = `
        <div class="notice error active">
          <strong>Trap Pass not verified.</strong>
          <p>${safe(result.error)}</p>
        </div>
      `;
      return;
    }

    const pass = result.public_summary;
    const unlockedRooms = result.rooms.filter((room) => room.unlocked);
    const threadLabels = (pass.thread_keys || []).join(", ");
    output.innerHTML = `
      <div class="verifier-output">
        <article class="pass-card">
          <span class="pass-stamp">Verified Public Summary</span>
          <div class="pass-id">${safe(pass.trap_pass_id)}</div>
          <p class="lead">Wave ${safe(pass.wave_number)} - ${safe(pass.wave_name)}</p>
          <div class="meta-list compact">
            <div><span>Holder</span><strong>${safe(pass.display_name)}</strong></div>
            <div><span>Status</span><strong>${safe(pass.status)}</strong></div>
            <div><span>Discord Role</span><strong>${safe(pass.discord_role)}</strong></div>
            <div><span>Unlock Level</span><strong>Level ${safe(pass.unlock_level)}</strong></div>
            <div><span>Missions</span><strong>${safe(pass.missions_completed)} complete</strong></div>
            <div><span>Pass History</span><strong>${safe(pass.pass_history_name)}</strong></div>
            <div><span>Threads</span><strong>${safe(threadLabels)}</strong></div>
          </div>
          <p class="fineprint" style="margin-top: 14px;">Private data withheld: email, private notes, system IDs, and account-only details.</p>
          <div class="cta-row"><a class="button" href="/trap-pass/#pass-history">See Pass History</a><a class="button" href="/threads/">Open Threads</a></div>
        </article>
        <div class="panel feature-copy">
          <span class="eyebrow">Roles To Apply</span>
          <div class="chip-list">${result.roles.map((role) => `<span class="role-chip">${safe(role)}</span>`).join("")}</div>
          <span class="eyebrow" style="margin-top: 18px;">Unlocked Website Drops</span>
          <div class="framework-list">
            ${unlockedRooms.map((room) => `
              <div class="framework-row">
                <strong>${safe(room.title)}</strong>
                <span>${safe(room.route)}</span>
                <span>${safe(room.requirement)}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="panel feature-copy">
          <span class="eyebrow">Discord Channel Access</span>
          <div class="framework-list">
            ${result.channels.map((channel) => `
              <div class="framework-row">
                <strong>#${safe(channel.name)}</strong>
                <span>${safe(channel.reason)}</span>
                <span>${safe(channel.access)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = form.querySelector("input").value;
    try {
      renderResult(await window.TrapHouse.verifyTrapPassAsync(query));
    } catch (error) {
      output.innerHTML = `
        <div class="notice error active">
          <strong>Trap Pass verify failed.</strong>
          <p>The verifier could not check pass storage. Try again in a minute.</p>
        </div>
      `;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDiscordVerifier);
} else {
  initDiscordVerifier();
}
