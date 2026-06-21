document.addEventListener("DOMContentLoaded", () => {
  const sceneTabs = document.querySelector("[data-scene-tabs]");
  const stage = document.querySelector("[data-room-stage]");
  const image = document.querySelector("[data-room-image]");
  const hotspots = document.querySelector("[data-room-hotspots]");
  const story = document.querySelector("[data-room-story]");
  const title = document.querySelector("[data-room-map-title]");
  const description = document.querySelector("[data-room-map-description]");

  if (!sceneTabs || !stage || !image || !hotspots || !story) return;

  let scenes = [];
  let activeScene = null;

  function safe(value) {
    return window.TrapHouse ? window.TrapHouse.escapeHTML(value) : String(value || "");
  }

  function renderStory(point) {
    story.innerHTML = `
      <span class="eyebrow">${safe(point.unlock)}</span>
      <h2>${safe(point.label)}</h2>
      <p class="lead">${safe(point.story)}</p>
      <div class="meta-list compact">
        <div><span>Site Door</span><strong>${safe(point.route)}</strong></div>
        <div><span>Discord Room</span><strong>${safe(point.discord)}</strong></div>
      </div>
      <div class="cta-row">
        <a class="button primary" href="${safe(point.route)}">Open Site Door</a>
        <a class="button" href="/discord/">Open Discord Room</a>
      </div>
    `;
  }

  function renderScene(scene) {
    activeScene = scene;
    image.src = scene.image;
    image.alt = scene.alt;
    stage.style.aspectRatio = scene.aspect || "2537 / 1914";
    title.textContent = scene.name;
    description.textContent = scene.description;
    hotspots.innerHTML = scene.hotspots.map((point, index) => `
      <button class="hotspot" type="button" style="left: ${point.x}%; top: ${point.y}%;" data-hotspot="${safe(point.id)}" aria-label="${safe(point.label)}">
        <span>${index + 1}</span>
      </button>
    `).join("");
    sceneTabs.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.scene === scene.id);
    });
    renderStory(scene.hotspots[0]);
  }

  function render(data) {
    scenes = data.scenes || [];
    sceneTabs.innerHTML = scenes.map((scene) => `
      <button type="button" data-scene="${safe(scene.id)}">${safe(scene.name)}</button>
    `).join("");
    renderScene(scenes[0]);
  }

  sceneTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-scene]");
    if (!button) return;
    const nextScene = scenes.find((scene) => scene.id === button.dataset.scene);
    if (nextScene) renderScene(nextScene);
  });

  hotspots.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-hotspot]");
    if (!button || !activeScene) return;
    const point = activeScene.hotspots.find((item) => item.id === button.dataset.hotspot);
    if (point) renderStory(point);
  });

  fetch("/data/room-map.json", { cache: "no-store" })
    .then((response) => response.json())
    .then(render)
    .catch((error) => {
      story.innerHTML = `<div class="notice error active"><strong>Room map failed to load.</strong><p>${safe(error.message)}</p></div>`;
    });
});
