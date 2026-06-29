(function () {
  const config = window.TRAP_HOUSE_CONFIG || {};
  const endpoint = config.stripeCheckoutSessionEndpoint || "/api/stripe/create-checkout-session";
  const healthEndpoint = config.stripeCheckoutHealthEndpoint || "/api/stripe/health";
  const buttons = Array.from(document.querySelectorAll("[data-checkout-product]"));
  const statusNodes = Array.from(document.querySelectorAll("[data-checkout-status]"));
  const emailInput = document.querySelector("[data-checkout-email]");
  const stagedMessage = "Paid checkout is not open yet. Free Trap Pass claiming and pass checks are live.";

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

  function disableCheckout(message, tone) {
    buttons.forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("aria-busy", "false");
    });
    setStatus(message || stagedMessage, tone || "pending");
  }

  function enableCheckout() {
    buttons.forEach((button) => {
      button.disabled = false;
      button.removeAttribute("aria-disabled");
      button.setAttribute("aria-busy", "false");
    });
    setStatus("Secure checkout through Stripe. Access and pass status update after payment is verified.", "ready");
  }

  async function refreshCheckoutReadiness() {
    if (!healthEndpoint && config.preorderCheckoutEnabled && config.stripeCheckoutReady) {
      enableCheckout();
      return true;
    }

    disableCheckout("Checking whether secure checkout is open.", "working");

    try {
      const response = await fetch(healthEndpoint, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ready) {
        enableCheckout();
        return true;
      }
    } catch (error) {
      console.warn("Checkout health check failed:", error);
    }

    disableCheckout(stagedMessage, "pending");
    return false;
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
      setStatus("Paid checkout is not open yet. Free Trap Pass claiming and pass checks are live.", "error");
      button.textContent = label;
      lockButtons(false);
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => startCheckout(button));
  });

  refreshCheckoutReadiness();
})();
