(function (global) {
  const ALERT_CONTAINER_ID = "app-alert-container";
  const CONFIRM_MODAL_ID = "app-confirm-modal";

  function ensureAlertContainer() {
    let container = document.getElementById(ALERT_CONTAINER_ID);

    if (!container) {
      container = document.createElement("div");
      container.id = ALERT_CONTAINER_ID;
      container.className = "app-alert-container";
      document.body.appendChild(container);
    }

    return container;
  }

  function normalizeType(type) {
    const allowed = ["success", "error", "warning", "info"];
    return allowed.includes(type) ? type : "info";
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

  function showAppAlert(message, type = "info", options = {}) {
    const container = ensureAlertContainer();
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

  function ensureConfirmModal() {
    let modal = document.getElementById(CONFIRM_MODAL_ID);

    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = CONFIRM_MODAL_ID;
    modal.className = "app-confirm-modal";
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div class="app-confirm-backdrop"></div>
      <div class="app-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title">
        <div class="app-confirm-header">
          <div class="app-confirm-icon">?</div>
          <div>
            <h3 id="app-confirm-title" class="app-confirm-title">Confirmar acción</h3>
            <p class="app-confirm-message"></p>
          </div>
        </div>
        <div class="app-confirm-actions">
          <button type="button" class="btn-secondary app-confirm-cancel">Cancelar</button>
          <button type="button" class="btn-danger app-confirm-accept">Aceptar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function showAppConfirm(options = {}) {
    const modal = ensureConfirmModal();

    const {
      title = "Confirmar acción",
      message = "¿Deseas continuar?",
      confirmText = "Aceptar",
      cancelText = "Cancelar",
      danger = false,
      closeOnBackdrop = true
    } = options;

    const titleEl = modal.querySelector(".app-confirm-title");
    const messageEl = modal.querySelector(".app-confirm-message");
    const acceptBtn = modal.querySelector(".app-confirm-accept");
    const cancelBtn = modal.querySelector(".app-confirm-cancel");
    const backdrop = modal.querySelector(".app-confirm-backdrop");
    const icon = modal.querySelector(".app-confirm-icon");

    titleEl.textContent = title;
    messageEl.textContent = message;
    acceptBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    acceptBtn.classList.toggle("btn-danger", !!danger);
    acceptBtn.classList.toggle("btn-secondary", !danger);

    icon.textContent = danger ? "!" : "?";
    modal.classList.toggle("is-danger", !!danger);

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    return new Promise((resolve) => {
      let resolved = false;

      const cleanup = () => {
        acceptBtn.removeEventListener("click", onAccept);
        cancelBtn.removeEventListener("click", onCancel);
        backdrop.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);

        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      };

      const finish = (value) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(value);
      };

      const onAccept = () => finish(true);
      const onCancel = () => finish(false);
      const onBackdrop = () => {
        if (closeOnBackdrop) finish(false);
      };
      const onKeydown = (e) => {
        if (e.key === "Escape") finish(false);
      };

      acceptBtn.addEventListener("click", onAccept);
      cancelBtn.addEventListener("click", onCancel);
      backdrop.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeydown);
    });
  }

  global.showAppAlert = showAppAlert;
  global.showAppConfirm = showAppConfirm;
})(window);