let trapWalletInitAttempts = 0;

function initTrapWallet() {
  const passMount = document.querySelector("[data-wallet-passes]");
  const baggieMount = document.querySelector("[data-wallet-baggies]");
  const statsMount = document.querySelector("[data-wallet-stats]");
  const form = document.querySelector("[data-wallet-open-form]");
  const empty = document.querySelector("[data-wallet-empty]");
  if (!passMount || !baggieMount || !statsMount) return;
  if (!window.TrapHouse) {
    if (trapWalletInitAttempts < 20) {
      trapWalletInitAttempts += 1;
      setTimeout(initTrapWallet, 50);
    }
    return;
  }
  if (passMount.dataset.bound === "true") return;
  passMount.dataset.bound = "true";

  function safe(value) {
    return window.TrapHouse.escapeHTML(value);
  }

  function passCard(item) {
    const pass = item.pass;
    const earned = item.baggies.filter((baggie) => baggie.earned).length;
    const threads = (item.threads || []).map((thread) => thread.title).join(", ") || "Trap Pass Lore";
    return `
      <article class="wallet-pass ${pass.trap_pass_id === window.TrapHouse.getCurrentPass()?.trap_pass_id ? "active" : ""}">
        <span class="pass-stamp">${pass.trap_pass_id === window.TrapHouse.getCurrentPass()?.trap_pass_id ? "Selected Pass" : "Trap Pass"}</span>
        <h3>${safe(pass.trap_pass_id)}</h3>
        <p>Wave ${safe(pass.wave_number)} - ${safe(pass.wave_name)}</p>
        <div class="meta-list compact">
          <div><span>Holder</span><strong>${safe(pass.display_name)}</strong></div>
          <div><span>Role</span><strong>${safe(pass.discord_role)}</strong></div>
          <div><span>Unlock</span><strong>Level ${safe(pass.unlock_level)}</strong></div>
          <div><span>Key Status</span><strong>${safe(pass.phase_name)}</strong></div>
          <div><span>Threads</span><strong>${safe(threads)}</strong></div>
          <div><span>Proof</span><strong>${earned}/${item.baggies.length} baggies</strong></div>
        </div>
        <div class="cta-row">
          <button type="button" data-select-pass="${safe(pass.trap_pass_id)}">Select Pass</button>
          <a class="button" href="/pass/?id=${encodeURIComponent(pass.trap_pass_id)}">Public Summary</a>
          <a class="button" href="/trap-pass/">Trap Pass</a>
        </div>
      </article>
    `;
  }

  function baggieCard(baggie) {
    return `
      <article class="baggie-card ${baggie.earned ? "earned" : "locked"}">
        <span class="baggie-top">${safe(baggie.status)}</span>
        <h3>${safe(baggie.title)}</h3>
        <p>${safe(baggie.description)}</p>
        <strong>${safe(baggie.reward)}</strong>
      </article>
    `;
  }

  function render() {
    const inventory = window.TrapHouse.getWalletInventory();
    const current = window.TrapHouse.getCurrentPass();
    const selected = inventory.passes.find((item) => item.pass.trap_pass_id === current?.trap_pass_id) || inventory.passes[0];

    statsMount.innerHTML = `
      <div><strong>${safe(inventory.total_passes)}</strong><span>Selected Passes</span></div>
      <div><strong>${safe(inventory.total_baggies_earned)}</strong><span>Proof Baggies</span></div>
      <div><strong>${safe(selected?.roles.length || 0)}</strong><span>Role Maps</span></div>
      <div><strong>${safe(selected?.pass.phase_level || 0)}</strong><span>Key Status</span></div>
    `;

    if (!inventory.passes.length) {
      empty.className = "notice active";
      empty.innerHTML = '<strong>No pass selected.</strong><p>Claim a Trap Pass or check an existing ID to open your card.</p><div class="cta-row"><a class="button primary" href="/trap-pass/">Claim Trap Pass</a><a class="button" href="/check-pass/">Check Pass</a></div>';
      passMount.innerHTML = "";
      baggieMount.innerHTML = "";
      return;
    }

    empty.className = "notice";
    empty.innerHTML = "";
    passMount.innerHTML = inventory.passes.map(passCard).join("");
    baggieMount.innerHTML = selected.baggies.map(baggieCard).join("");
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = form.querySelector("input").value;
    try {
      await window.TrapHouse.setCurrentPassAsync(query);
      render();
    } catch (error) {
      empty.className = "notice error active";
      empty.innerHTML = "<strong>Pass lookup failed.</strong><p>Your pass could not be checked. Try again in a minute.</p>";
    }
  });

  passMount.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-pass]");
    if (!button) return;
    window.TrapHouse.setCurrentPass(button.dataset.selectPass);
    render();
  });

  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTrapWallet);
} else {
  initTrapWallet();
}
