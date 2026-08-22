/* Figlio cookievoorkeuren — Google Analytics wordt uitsluitend na toestemming geladen. */
(() => {
  'use strict';

  const STORAGE_KEY = 'figlio_cookie_consent_v1';
  const GA_MEASUREMENT_ID = 'G-3WPQ6YD3MY';
  const validChoices = new Set(['accepted', 'essential_only', 'rejected']);
  let banner;

  const getChoice = () => {
    try {
      const choice = localStorage.getItem(STORAGE_KEY);
      return validChoices.has(choice) ? choice : null;
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

  const saveChoice = (choice) => {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (_) { /* Local storage can be unavailable. */ }
    applyChoice(choice);
    closeBanner();
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
        </div>
        <div class="cookie-consent-actions">
          <button type="button" class="cookie-button cookie-button-primary" data-cookie-choice="accepted">Alles accepteren</button>
          <div class="cookie-secondary-actions">
            <button type="button" class="cookie-button cookie-button-secondary" data-cookie-choice="rejected">Weigeren</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(banner);
    banner.querySelectorAll('[data-cookie-choice]').forEach((button) => {
      button.addEventListener('click', () => saveChoice(button.dataset.cookieChoice));
    });
  };

  const mountFooterLink = () => {
    const footerContent = document.querySelector('.footer-bottom-content');
    if (!footerContent || footerContent.querySelector('[data-cookie-preferences]')) return;
    const preferenceButton = document.createElement('button');
    preferenceButton.type = 'button';
    preferenceButton.className = 'cookie-preferences-link';
    preferenceButton.dataset.cookiePreferences = 'true';
    preferenceButton.textContent = 'Cookievoorkeuren';
    preferenceButton.addEventListener('click', openBanner);
    footerContent.appendChild(preferenceButton);
  };

  const start = () => {
    mountBanner();
    mountFooterLink();
    const choice = getChoice();
    if (choice) applyChoice(choice);
    else openBanner();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
