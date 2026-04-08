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

  function shouldShowPopup() {
    const navType = getNavigationType(); // "navigate" | "reload" | "back_forward" | "prerender"
    if (navType === "reload") return true; // always on refresh
    return !isSameOriginReferrer(); // show when coming from outside (e.g., Google) or direct
  }

  function init() {
    const modal = document.getElementById("closed-april-modal");
    const close = document.getElementById("closed-april-close");
    if (!modal || !close) return;

    function hideModal() {
      modal.classList.remove("is-open");
    }

    if (shouldShowPopup()) {
      modal.classList.add("is-open");
    }

    close.addEventListener("click", hideModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hideModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideModal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

