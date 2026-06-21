document.addEventListener("DOMContentLoaded", () => {
  const app = document.querySelector("[data-room-key]");
  if (!app || !window.TrapHouse) return;

  const key = app.dataset.roomKey;
  const room = window.TrapHouse.hiddenRooms[key];
  const titles = document.querySelectorAll("[data-room-title]");
  const requirements = document.querySelectorAll("[data-room-requirement]");
  const bodies = document.querySelectorAll("[data-room-body]");
  const status = document.querySelector("[data-room-status]");
  const passMount = document.querySelector("[data-current-pass]");
  const form = document.querySelector("[data-room-check-form]");

  if (room) {
    titles.forEach((title) => title.textContent = room.title);
    requirements.forEach((requirement) => requirement.textContent = room.requirement);
    bodies.forEach((body) => body.textContent = room.body);
    document.title = `${room.title} | The Trap House`;
  }

  function render(pass) {
    const unlocked = window.TrapHouse.canAccessRoom(key, pass);
    app.classList.toggle("unlocked", Boolean(unlocked));
    app.classList.toggle("locked", !unlocked);
    status.innerHTML = unlocked
      ? "<strong>Unlocked.</strong><p>This pass has enough access for this room. Step inside and keep the key close.</p>"
      : "<strong>This room is locked unless your Trap Pass has the right access level.</strong><p>Claim or check a pass, then come back with the key.</p>";
    passMount.innerHTML = pass
      ? window.TrapHouse.renderPassCard(pass, { hideLink: true })
      : "<p class='fineprint'>No active Trap Pass is selected.</p>";
  }

  render(window.TrapHouse.getCurrentPass());

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = form.querySelector("input").value;
    const pass = window.TrapHouse.setCurrentPass(query);
    render(pass);
  });
});
