(function (global) {
  const CONTAINER_ID = "app-alert-container";

  function ensureContainer() {
    let container = document.getElementById(CONTAINER_ID);

    if (!container) {
      container = document.createElement("div");
      container.id = CONTAINER_ID;
      container.className = "app-alert-container";
      document.body.appendChild(container);
    }

    return container;
  }

  function normalizeType(type) {
    const allowed = ["success", "error", "warning", "info"];
    return allowed.includes(type) ? type : "info";
  }

  function showAppAlert(message, type = "info", options = {}) {
    const container = ensureContainer();
    const safeType = normalizeType(type);

    const {
      duration = 3500,
      closable = true,
      title = "",
      persistent = false
    } = options;

    const alert = document.createElement("div");
    alert.className = `app-alert app-alert--${safeType}`;

    const icon = document.createElement("div");
    icon.className = "app-alert__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent =
      safeType === "success" ? "✓" :
      safeType === "error" ? "✕" :
      safeType === "warning" ? "!" : "i";

    const content = document.createElement("div");
    content.className = "app-alert__content";

    if (title) {
      const titleEl = document.createElement("div");
      titleEl.className = "app-alert__title";
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }

    const messageEl = document.createElement("div");
    messageEl.className = "app-alert__message";
    messageEl.textContent = message;
    content.appendChild(messageEl);

    alert.appendChild(icon);
    alert.appendChild(content);

    if (closable) {
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "app-alert__close";
      closeBtn.setAttribute("aria-label", "Cerrar alerta");
      closeBtn.innerHTML = "&times;";
      closeBtn.addEventListener("click", () => removeAlert(alert));
      alert.appendChild(closeBtn);
    }

    container.appendChild(alert);

    requestAnimationFrame(() => {
      alert.classList.add("is-visible");
    });

    if (!persistent && duration > 0) {
      window.setTimeout(() => removeAlert(alert), duration);
    }

    return alert;
  }

  function removeAlert(alert) {
    if (!alert || !alert.parentNode) return;
    alert.classList.remove("is-visible");
    alert.classList.add("is-hiding");

    window.setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 220);
  }

  global.showAppAlert = showAppAlert;
})(window);