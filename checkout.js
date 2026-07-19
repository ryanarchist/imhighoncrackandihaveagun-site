(function () {
  const config = window.TRAP_HOUSE_CONFIG || {};
  const endpoint = config.stripeCheckoutSessionEndpoint || "/api/stripe/create-checkout-session";
  const healthEndpoint = config.stripeCheckoutHealthEndpoint || "/api/stripe/health";
  const buttons = Array.from(document.querySelectorAll("[data-checkout-product]"));
  const statusNodes = Array.from(document.querySelectorAll("[data-checkout-status]"));
  const emailInput = document.querySelector("[data-checkout-email]");
  const checkoutText = window.IHOCAIHAGSiteContent?.uiContent?.checkout || {};
  const checkoutClosedMessage = checkoutText.closed || "Paid checkout is not open yet.";
  const checkoutClosedButton = checkoutText.closedButton || "Checkout Opening Soon";
  const checkoutCheckingButton = checkoutText.checkingButton || "Checking Checkout...";

  buttons.forEach((button) => {
    button.dataset.checkoutLabel = button.textContent.trim();
  });

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
      const available = button.dataset.checkoutEnabled !== "false";
      button.disabled = locked || !available;
      if (button.disabled) button.setAttribute("aria-disabled", "true");
      else button.removeAttribute("aria-disabled");
      button.setAttribute("aria-busy", locked ? "true" : "false");
    });
  }

  function disableCheckout(message, tone) {
    buttons.forEach((button) => {
      const available = button.dataset.checkoutEnabled !== "false";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("aria-busy", "false");
      if (available) {
        button.textContent = tone === "working" ? checkoutCheckingButton : checkoutClosedButton;
        button.title = message || checkoutClosedMessage;
      }
    });
    setStatus(message || checkoutClosedMessage, tone || "pending");
  }

  function enableCheckout() {
    buttons.forEach((button) => {
      const available = button.dataset.checkoutEnabled !== "false";
      button.disabled = !available;
      if (available) {
        button.removeAttribute("aria-disabled");
        button.removeAttribute("title");
        button.textContent = button.dataset.checkoutLabel || button.textContent;
      } else {
        button.setAttribute("aria-disabled", "true");
      }
      button.setAttribute("aria-busy", "false");
    });
    setStatus(checkoutText.ready || "Checkout ready.", "ready");
  }

  async function refreshCheckoutReadiness() {
    if (!buttons.length) return false;
    if (!healthEndpoint) {
      disableCheckout(checkoutClosedMessage, "pending");
      return false;
    }

    disableCheckout(checkoutText.checking || "Checking checkout.", "working");

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

    disableCheckout(checkoutClosedMessage, "pending");
    return false;
  }

  async function startCheckout(button) {
    const productKey = button.dataset.checkoutProduct;
    const quantity = Number.parseInt(button.dataset.checkoutQuantity || "1", 10);
    const label = button.textContent;

    if (!productKey) return;

    lockButtons(true);
    button.textContent = checkoutText.openingButton || "Opening checkout...";
    setStatus(checkoutText.opening || "Opening checkout.", "working");

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
      button.textContent = label;
      await refreshCheckoutReadiness();
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => startCheckout(button));
  });

  refreshCheckoutReadiness();
})();
