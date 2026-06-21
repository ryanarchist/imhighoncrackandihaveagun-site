(function () {
  const config = window.TRAP_HOUSE_CONFIG || {};
  const endpoint = config.stripeCheckoutSessionEndpoint || "/api/stripe/create-checkout-session";
  const buttons = Array.from(document.querySelectorAll("[data-checkout-product]"));
  const statusNodes = Array.from(document.querySelectorAll("[data-checkout-status]"));
  const emailInput = document.querySelector("[data-checkout-email]");

  function setStatus(message, tone) {
    statusNodes.forEach((node) => {
      node.textContent = message || "";
      node.dataset.tone = tone || "";
    });
  }

  function getEmail() {
    const explicit = String(emailInput?.value || "").trim();
    if (explicit) return explicit;

    try {
      return String(localStorage.getItem("iho_last_email") || "").trim();
    } catch (error) {
      return "";
    }
  }

  function lockButtons(locked) {
    buttons.forEach((button) => {
      button.disabled = locked;
      button.setAttribute("aria-busy", locked ? "true" : "false");
    });
  }

  if (!config.preorderCheckoutEnabled || !config.stripeCheckoutReady) {
    buttons.forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
    });
    setStatus("Checkout is staged for the next opening. Trap Pass claiming and pass checks are live; paid checkout opens when the payment room is connected.", "pending");
    return;
  }

  async function startCheckout(button) {
    const productKey = button.dataset.checkoutProduct;
    const quantity = Number.parseInt(button.dataset.checkoutQuantity || "1", 10);
    const label = button.textContent;

    if (!productKey) return;

    lockButtons(true);
    button.textContent = "Opening Stripe...";
    setStatus("Opening secure Stripe checkout.", "working");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKey,
          quantity: Number.isFinite(quantity) ? quantity : 1,
          email: getEmail()
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.message || data.error || "checkout_unavailable");
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error("Checkout failed:", error);
      setStatus("Checkout is not open yet. Trap Pass claiming and pass checks are live while the payment room is being connected.", "error");
      button.textContent = label;
      lockButtons(false);
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => startCheckout(button));
  });
})();
