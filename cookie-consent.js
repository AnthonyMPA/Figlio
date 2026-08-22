/* Figlio cookievoorkeuren — Google Analytics wordt uitsluitend na toestemming geladen. */
(() => {
  'use strict';

  const STORAGE_KEY = 'figlio_cookie_consent_v1';
  const GA_MEASUREMENT_ID = 'G-3WPQ6YD3MY';
  const CONSENT_MAX_AGE_MS = 183 * 24 * 60 * 60 * 1000; // maximaal ongeveer 6 maanden
  const validChoices = new Set(['accepted', 'essential_only', 'rejected']);
  let banner;

  const getChoice = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const record = JSON.parse(stored);
      if (!record || !validChoices.has(record.choice) || !Number.isFinite(record.expiresAt)) {
        // Oude, onbeperkt bewaarde voorkeuren vragen we opnieuw expliciet.
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      if (Date.now() >= record.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return record.choice;
    } catch (_) {
      return null;
    }
  };

  const deleteAnalyticsCookies = () => {
    const expires = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
    const host = location.hostname;
    const domains = ['', `; domain=${host}`, `; domain=.${host}`];
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.trim().split('=')[0];
      if (!/^_(ga|gid|gat)(_|$)/i.test(name)) return;
      domains.forEach((domain) => {
        document.cookie = `${name}=; ${expires}; path=/${domain}; SameSite=Lax`;
      });
    });
  };

  const activateAnalytics = () => {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
    if (document.querySelector('script[data-figlio-ga]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    script.dataset.figlioGa = 'true';
    document.head.appendChild(script);
  };

  const applyChoice = (choice) => {
    if (choice === 'accepted') {
      activateAnalytics();
    } else {
      // Stops future Google Analytics sends during the current visit as well.
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
      }
      deleteAnalyticsCookies();
    }
  };

  const closeBanner = () => {
    if (!banner) return;
    banner.classList.remove('is-open');
    banner.setAttribute('aria-hidden', 'true');
  };

  const openBanner = () => {
    if (!banner) return;
    banner.classList.add('is-open');
    banner.setAttribute('aria-hidden', 'false');
    banner.querySelector('[data-cookie-choice="accepted"]')?.focus();
  };

  // Public helper: the footer link can be clicked even when another page script
  // rebuilds or moves footer content after this script has been initialised.
  window.openFiglioCookiePreferences = openBanner;

  const saveChoice = (choice) => {
    if (!validChoices.has(choice)) return;
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        choice,
        savedAt: now,
        expiresAt: now + CONSENT_MAX_AGE_MS,
        version: 1,
      }));
    } catch (_) { /* Local storage can be unavailable. */ }
    applyChoice(choice);
    closeBanner();
    refreshPreferencePage();
  };

  const mountBanner = () => {
    banner = document.createElement('section');
    banner.className = 'cookie-consent';
    banner.id = 'cookieConsent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-labelledby', 'cookieConsentTitle');
    banner.setAttribute('aria-hidden', 'true');
    banner.innerHTML = `
      <div class="cookie-consent-card">
        <div class="cookie-consent-copy">
          <span class="cookie-consent-eyebrow">FIGLIO · PRIVACY</span>
          <h2 id="cookieConsentTitle">Jouw privacy</h2>
          <p>We gebruiken noodzakelijke cookies om de website goed te laten functioneren. Met jouw toestemming gebruiken we Google Analytics om Figlio verder te verbeteren.</p>
          <p class="cookie-consent-details">Weigeren heeft geen invloed op je toegang en je kunt je keuze altijd wijzigen.</p>
          <a class="cookie-policy-link" href="cookies.html#cookiebeleid">Lees ons cookiebeleid</a>
        </div>
        <div class="cookie-consent-actions">
          <button type="button" class="cookie-button cookie-button-primary" data-cookie-choice="accepted">Alles accepteren</button>
          <div class="cookie-secondary-actions">
            <button type="button" class="cookie-button cookie-button-secondary" data-cookie-choice="rejected">Weigeren</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(banner);
  };

  const mountFooterLink = () => {
    const footerContent = document.querySelector('.footer-bottom-content');
    if (!footerContent || footerContent.querySelector('[data-cookie-preferences]')) return;
    const preferenceButton = document.createElement('a');
    preferenceButton.className = 'cookie-preferences-link';
    preferenceButton.dataset.cookiePreferences = 'true';
    preferenceButton.textContent = 'Cookievoorkeuren';
    preferenceButton.href = 'cookies.html#voorkeuren';
    footerContent.appendChild(preferenceButton);
  };

  const refreshPreferencePage = () => {
    const currentChoice = getChoice();
    const labels = {
      accepted: 'Analytics toegestaan',
      rejected: 'Alleen noodzakelijke technieken',
      essential_only: 'Alleen noodzakelijke technieken',
    };
    document.querySelectorAll('[data-cookie-current-status]').forEach((element) => {
      element.textContent = labels[currentChoice] || 'Nog geen keuze gemaakt';
      element.dataset.choice = currentChoice || 'unset';
    });
    document.querySelectorAll('[data-cookie-choice]').forEach((button) => {
      const selected = button.dataset.cookieChoice === currentChoice;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  const start = () => {
    mountBanner();
    mountFooterLink();
    const choice = getChoice();
    if (choice) applyChoice(choice);
    else openBanner();
    refreshPreferencePage();
  };

  // Use delegation instead of relying only on one button instance. This keeps
  // Cookievoorkeuren working on every public page and after dynamic DOM changes.
  document.addEventListener('click', (event) => {
    const choiceButton = event.target.closest('[data-cookie-choice]');
    if (choiceButton) {
      event.preventDefault();
      saveChoice(choiceButton.dataset.cookieChoice);
      return;
    }

    const trigger = event.target.closest('[data-cookie-preferences]');
    if (trigger?.tagName === 'BUTTON') {
      event.preventDefault();
      openBanner();
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
