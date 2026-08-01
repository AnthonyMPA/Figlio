(() => {
  const cacheKey = "figlio-website-popup";
  const websitePopupEndpoint = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:4199/api/website-popup/active"
    : "https://bestellen.figlio.be/api/website-popup/active";
  let dismissed = false;

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

  function brusselsToday() {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function normalizeNotice(value) {
    if (!value || typeof value !== "object") return null;

    const title = typeof value.title === "string" ? value.title.trim() : "";
    const text = typeof value.text === "string" ? value.text.trim() : "";
    const startDate = typeof value.startDate === "string" ? value.startDate : "";
    const endDate = typeof value.endDate === "string" ? value.endDate : "";
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!title || !datePattern.test(startDate) || !datePattern.test(endDate)) return null;
    return { title, text, startDate, endDate };
  }

  function isCurrent(notice) {
    if (!notice) return false;
    const today = brusselsToday();
    return notice.startDate <= today && today <= notice.endDate;
  }

  function readCachedNotice() {
    try {
      return normalizeNotice(JSON.parse(localStorage.getItem(cacheKey)));
    } catch {
      return null;
    }
  }

  function cacheNotice(notice) {
    try {
      if (notice) {
        localStorage.setItem(cacheKey, JSON.stringify(notice));
      } else {
        localStorage.removeItem(cacheKey);
      }
    } catch {}
  }

  function createModal() {
    const modal = document.createElement("div");
    modal.className = "notice-modal";
    modal.id = "notice-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Websitebericht");
    modal.innerHTML = `
      <div class="notice-dialog">
        <button class="notice-close" type="button" aria-label="Sluiten">&#10005;</button>
        <div class="notice-title">FIGLIO</div>
        <div class="notice-body">
          <p class="notice-primary"></p>
          <p class="notice-secondary"></p>
          <div class="notice-signoff">A Presto.</div>
        </div>
      </div>`;
    document.body.append(modal);

    function hide() {
      dismissed = true;
      modal.classList.remove("is-open");
    }

    modal.querySelector(".notice-close").addEventListener("click", hide);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) hide();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hide();
    });

    return modal;
  }

  function renderNotice(notice) {
    if (dismissed) return;

    const modal = document.getElementById("notice-modal") || createModal();
    const primary = modal.querySelector(".notice-primary");
    const secondary = modal.querySelector(".notice-secondary");

    primary.textContent = notice.title;
    secondary.textContent = notice.text;
    secondary.hidden = !notice.text;
    modal.classList.add("is-open");
  }

  async function loadManagedNotice(mayOpen) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(websitePopupEndpoint, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Pop-up ophalen mislukt (${response.status})`);

      const { popup } = await response.json();
      const notice = normalizeNotice(popup);
      if (!notice || !isCurrent(notice)) {
        cacheNotice(null);
        document.getElementById("notice-modal")?.remove();
        return;
      }

      cacheNotice(notice);
      if (mayOpen) renderNotice(notice);
    } catch {
      const cachedNotice = readCachedNotice();
      if (mayOpen && isCurrent(cachedNotice)) renderNotice(cachedNotice);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function init() {
    loadManagedNotice(shouldShowNotice());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
