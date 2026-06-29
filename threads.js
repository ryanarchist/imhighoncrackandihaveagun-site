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

  async function loadThreads() {
    const response = await fetch("/data/threads.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Threads model could not be loaded.");
    return response.json();
  }

  function renderThreadCards(model) {
    const mount = document.querySelector("[data-thread-cards]");
    if (!mount) return;
    const nodesById = new Map(model.threads.map((thread) => [thread.id, thread]));
    mount.innerHTML = model.threads.map((thread) => `
      <article class="thread-card" id="${safe(thread.id)}">
        <span class="thread-number">${String(thread.number).padStart(2, "0")}</span>
        <h3>${safe(thread.title)}</h3>
        <span class="thread-key">#${safe(thread.channel)}</span>
        <p>${safe(thread.summary)}</p>
        <p class="thread-role">${safe((thread.feeds || []).length ? `Feeds: ${thread.feeds.map((id) => nodesById.get(id)?.title || id).join(", ")}` : "Role: ending convergence")}</p>
        <div class="chip-list">
          <span class="role-chip">Signal ${safe(thread.pass_phase)}</span>
          ${thread.heavy ? '<span class="role-chip">Heavy Context</span>' : ""}
        </div>
      </article>
    `).join("");
  }

  function renderTheoryCards(model) {
    const mount = document.querySelector("[data-thread-theory]");
    if (!mount || !Array.isArray(model.theory_cards)) return;
    mount.innerHTML = model.theory_cards.map((card) => `
      <article>
        <span>${safe(card.number)}</span>
        <h3>${safe(card.title)}</h3>
        <p>${safe(card.summary)}</p>
      </article>
    `).join("");
  }

  function renderRules(model) {
    const mount = document.querySelector("[data-thread-rules]");
    if (!mount || !Array.isArray(model.rules)) return;
    mount.innerHTML = model.rules.map((rule) => `
      <article>
        <span>${safe(rule.label)}</span>
        <strong>${safe(rule.title)}</strong>
        <p>${safe(rule.summary)}</p>
      </article>
    `).join("");
  }

  function renderFlow(model) {
    const mount = document.querySelector("[data-thread-flow]");
    if (!mount) return;
    mount.innerHTML = model.flow.map((item, index) => `
      <div class="thread-flow-step">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${safe(item)}</strong>
      </div>
    `).join("");
  }

  function renderOrigin(model) {
    const mount = document.querySelector("[data-thread-origin]");
    if (!mount) return;
    mount.innerHTML = `
      <span class="eyebrow">Origin Thread</span>
      <h2>${safe(model.origin.title)}</h2>
      <p class="lead">${safe(model.origin.summary)}</p>
      <div class="cta-row">
        <a class="button primary" href="/trap-pass/">Get Trap Pass</a>
        <a class="button" href="/trap-pass/">Trap Pass</a>
        <a class="button" href="/discord/">Enter Discord</a>
      </div>
    `;
  }

  function renderBook(model) {
    const mount = document.querySelector("[data-thread-book]");
    if (!mount || !model.book) return;
    mount.innerHTML = `
      <span class="eyebrow">Book Thread</span>
      <h2>${safe(model.book.title)}</h2>
      <p class="lead">${safe(model.book.summary)}</p>
      <p class="sublead">${safe(model.book.body)}</p>
      <p class="sublead">${safe(model.book.footer)}</p>
      <div class="cta-row">
        <a class="button primary" href="/book/">Open The Book</a>
        <a class="button" href="/store/">Store</a>
      </div>
    `;
  }

  function renderAuthor(model) {
    const mount = document.querySelector("[data-thread-author]");
    if (!mount || !model.author) return;
    mount.innerHTML = `
      <span class="eyebrow">${safe(model.author.title)}</span>
      <h2>${safe(model.author.name)}</h2>
      <p class="lead">${safe(model.author.summary)}</p>
      <p class="sublead">${safe(model.author.body)}</p>
      <p class="sublead">${safe(model.author.footer)}</p>
      <div class="cta-row">
        <a class="button primary" href="/project/">Open The Project</a>
        <a class="button" href="/dopesick/">Dopesick</a>
      </div>
    `;
  }

  function renderPassThreads(model) {
    const mount = document.querySelector("[data-pass-thread-preview]");
    if (!mount || !window.TrapHouse) return;
    const current = window.TrapHouse.getCurrentPass();
    const keys = current?.thread_keys || ["trap-pass-lore", "public-project-witness"];
    const selected = model.threads.filter((thread) => keys.includes(thread.id));
    mount.innerHTML = `
      <span class="eyebrow">Your Pass Threads</span>
      <h2>${current ? safe(current.trap_pass_id) : "No Pass Selected"}</h2>
      <p class="lead">${current ? "These are the wires currently attached to your active pass." : "Claim a pass to attach thread routes to your public pass."}</p>
      <div class="framework-list">
        ${(selected.length ? selected : model.threads.slice(0, 3)).map((thread) => `
          <div class="framework-row">
            <strong>${safe(thread.title)}</strong>
            <span>${safe(thread.summary)}</span>
            <span>#${safe(thread.channel)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  const threadPositions = {
    "january-22": [50, 43],
    "addiction-machine": [20, 13],
    "psychosis-loop": [20, 28],
    "grief-loss": [21, 48],
    "cats-home-tenderness": [25, 68],
    "writing-inside-the-fire": [34, 87],
    "money-desperation": [51, 86],
    "system-mirror": [67, 87],
    "platform-war": [79, 68],
    "trap-pass-lore": [78, 45],
    "self-destruction-vs-creation": [14, 84],
    "public-project-witness": [78, 25],
    "ending-convergence": [78, 10]
  };

  function nodeTitle(node) {
    return node.id === "january-22" ? "January 22" : node.title;
  }

  function buildConnections(model) {
    const edges = model.threads.flatMap((thread) => (thread.feeds || []).map((target) => [thread.id, target]));
    const originEdges = model.threads.map((thread) => [model.origin.id, thread.id]);
    return [...originEdges, ...edges];
  }

  function crossingKey(ids) {
    return [...ids].sort().join("|");
  }

  function getSpecialCrossing(model, a, b) {
    if (!a || !b || !Array.isArray(model.crossings)) return null;
    const key = crossingKey([a.id, b.id]);
    return model.crossings.find((crossing) => crossingKey(crossing.ids || []) === key) || null;
  }

  function describeCrossing(a, b, nodesById) {
    if (!a || !b) {
      return "Pick a second wire to cross it against the first.";
    }
    const aFeedsB = (a.feeds || []).includes(b.id);
    const bFeedsA = (b.feeds || []).includes(a.id);
    if (aFeedsB) {
      return `${nodeTitle(a)} feeds ${nodeTitle(b)}. The first wire pushes the second one forward.`;
    }
    if (bFeedsA) {
      return `${nodeTitle(b)} feeds ${nodeTitle(a)}. The second wire pushes the first one forward.`;
    }
    const shared = (a.feeds || []).filter((id) => (b.feeds || []).includes(id)).map((id) => nodesById.get(id)?.title).filter(Boolean);
    if (shared.length) {
      return `${nodeTitle(a)} and ${nodeTitle(b)} share a downstream wire: ${shared.join(", ")}.`;
    }
    if (a.id === "january-22" || b.id === "january-22") {
      return "This crossing runs through the origin. January 22 is the blast crater every other wire keeps routing back to.";
    }
    if (a.id === "ending-convergence" || b.id === "ending-convergence") {
      return "This crossing runs into the ending convergence. The separate wires collapse back into one house.";
    }
    return `${nodeTitle(a)} and ${nodeTitle(b)} are not directly wired yet, but both route through the origin and the ending convergence.`;
  }

  function renderInspector(model, selectedIds, nodesById) {
    const mount = document.querySelector("[data-thread-inspector]");
    if (!mount) return;
    const selected = selectedIds.map((id) => nodesById.get(id)).filter(Boolean);
    const first = selected[0];
    const second = selected[1];
    if (!first) {
      mount.innerHTML = `
        <span class="eyebrow">Thread Inspector</span>
        <h2>Pick A Wire</h2>
        <p class="lead">Select one thread to inspect it. Select a second thread to cross them.</p>
        <p class="sublead">${safe(model.manifesto)}</p>
        <div class="thread-inspector-meter">
          <span>Board Status</span>
          <strong>12 wires loaded</strong>
        </div>
      `;
      return;
    }
    const directFeeds = (first.feeds || []).map((id) => nodesById.get(id)).filter(Boolean);
    const special = second ? getSpecialCrossing(model, first, second) : null;
    const lead = special?.lead || (second ? describeCrossing(first, second, nodesById) : first.summary);
    const body = special?.body || (second ? `${first.summary} ${second.summary}` : "");
    const relationship = special?.relationship || (second ? `${nodeTitle(first)} crosses ${nodeTitle(second)}` : nodeTitle(first));
    const discord = special?.discord || `#${first.channel || model.origin.channel}${second ? ` / #${second.channel || model.origin.channel}` : ""}`;
    const passSignal = special?.pass_phase || `${first.pass_phase || "origin"}${second ? ` / ${second.pass_phase || "origin"}` : ""}`;
    const feeds = special?.feeds || (directFeeds.map((thread) => thread.title).join(", ") || "Ending convergence");
    mount.innerHTML = `
      <span class="eyebrow">${second ? "Crossing" : "Selected Thread"}</span>
      <h2>${safe(special?.title || (second ? `${nodeTitle(first)} x ${nodeTitle(second)}` : nodeTitle(first)))}</h2>
      <p class="lead">${safe(lead)}</p>
      ${body ? `<p class="sublead">${safe(body)}</p>` : ""}
      <div class="thread-inspector-meter">
        <span>${second ? "Crossing Loaded" : "Wire Loaded"}</span>
        <strong>${safe(second ? "2 selected" : "1 selected")}</strong>
      </div>
      <div class="framework-list">
        <div class="framework-row meta-row"><strong>Relationship</strong><span>${safe(relationship)}</span></div>
        <div class="framework-row meta-row"><strong>Discord</strong><span>${safe(discord)}</span></div>
        <div class="framework-row meta-row"><strong>Pass Signal</strong><span>${safe(passSignal)}</span></div>
        <div class="framework-row meta-row"><strong>Feeds</strong><span>${safe(feeds)}</span></div>
      </div>
    `;
  }

  function renderThreadWeb(model) {
    const mount = document.querySelector("[data-thread-web]");
    if (!mount) return;
    const originNode = {
      ...model.origin,
      number: 0,
      feeds: model.threads.map((thread) => thread.id),
      pass_phase: "origin"
    };
    const nodes = [originNode, ...model.threads];
    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    const edges = buildConnections(model).filter(([from, to]) => threadPositions[from] && threadPositions[to]);
    let selectedIds = [];

    function toggleThread(id) {
      if (!nodesById.has(id)) return;
      if (selectedIds.includes(id)) {
        selectedIds = selectedIds.filter((item) => item !== id);
      } else {
        selectedIds = [...selectedIds, id].slice(-2);
      }
      render();
    }

    function render() {
      mount.innerHTML = `
        <div class="thread-web map-backed">
          <img src="${safe(model.hero_asset || "/assets/trap-house/threads-map-board-new.png")}" alt="" />
          <div class="thread-web-header">
            <span>Thread Board</span>
            <strong>${selectedIds.length ? `${selectedIds.length} wire${selectedIds.length > 1 ? "s" : ""} selected` : "Choose a wire"}</strong>
          </div>
          <svg class="thread-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${edges.map(([from, to]) => {
              const [x1, y1] = threadPositions[from];
              const [x2, y2] = threadPositions[to];
              const active = selectedIds.includes(from) || selectedIds.includes(to);
              return `<line class="thread-line${active ? " active" : ""}" data-from="${safe(from)}" data-to="${safe(to)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
            }).join("")}
          </svg>
          <div class="thread-node-layer">
            ${nodes.map((node) => {
              const [x, y] = threadPositions[node.id];
              const selected = selectedIds.includes(node.id);
              const nodeClass = [
                selected ? "selected" : "",
                node.id === model.origin.id ? "is-origin" : "",
                node.id === "ending-convergence" ? "is-convergence" : "",
                node.heavy ? "is-heavy" : ""
              ].filter(Boolean).join(" ");
              return `
                <button class="thread-node ${safe(nodeClass)}" type="button" data-thread-node="${safe(node.id)}" aria-pressed="${selected ? "true" : "false"}" aria-label="Inspect ${safe(nodeTitle(node))}" style="left:${x}%;top:${y}%;">
                  <span>${node.number ? String(node.number).padStart(2, "0") : "00"}</span>
                  <strong>${safe(nodeTitle(node))}</strong>
                </button>
              `;
            }).join("")}
          </div>
          <div class="thread-web-legend">
            <span><i class="origin"></i>origin</span>
            <span><i class="heavy"></i>heavy context</span>
            <span><i class="selected"></i>selected crossing</span>
          </div>
          <div class="thread-web-footer">Each line is a public story route, not a private claim.</div>
        </div>
      `;
      mount.querySelectorAll("[data-thread-node]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          toggleThread(button.dataset.threadNode);
        });
      });
      renderInspector(model, selectedIds, nodesById);
    }

    render();
  }

  async function initThreadsPage() {
    try {
      const model = await loadThreads();
      window.TrapHouseThreads = model;
      renderTheoryCards(model);
      renderRules(model);
      renderOrigin(model);
      renderBook(model);
      renderAuthor(model);
      renderThreadCards(model);
      renderFlow(model);
      renderPassThreads(model);
      renderThreadWeb(model);
    } catch (error) {
      document.querySelectorAll("[data-thread-error]").forEach((mount) => {
        mount.className = "notice error active";
        mount.innerHTML = `<strong>Threads load error.</strong><p>${safe(error.message)}</p>`;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThreadsPage);
  } else {
    initThreadsPage();
  }
})();
