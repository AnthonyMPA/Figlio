(() => {
  function getNavigationType() {
    try {
      const entry = performance.getEntriesByType?.("navigation")?.[0];
      if (entry && typeof entry.type === "string") return entry.type;
    } catch {}
    return "navigate";
  }

  function isSameOriginReferrer() {
    if (!document.referrer) return false;
    try {
      return new URL(document.referrer).origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function shouldShowNotice() {
    const navigationType = getNavigationType();
    if (navigationType === "reload") return true;
    return !isSameOriginReferrer();
  }

  function init() {
    const modal = document.getElementById("notice-modal");
    const closeButton = document.getElementById("notice-close");
    if (!modal || !closeButton) return;

    function hide() {
      modal.classList.remove("is-open");
    }

    if (shouldShowNotice()) {
      modal.classList.add("is-open");
    }

    closeButton.addEventListener("click", hide);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) hide();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hide();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
