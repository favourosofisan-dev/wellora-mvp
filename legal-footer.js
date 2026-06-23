(function () {
  function t(key, fallback) {
    if (window.WelloraI18n && typeof window.WelloraI18n.t === "function") {
      return window.WelloraI18n.t(key, fallback);
    }

    return fallback;
  }

  function ensureFooter() {
    if (document.querySelector(".legal-footer")) {
      return;
    }

    const footer = document.createElement("footer");
    footer.className = "legal-footer";
    footer.innerHTML =
      '<nav class="legal-footer-nav" aria-label="Legal links">' +
        '<a href="privacy.html" data-i18n="legalPrivacy">' + t("legalPrivacy", "Privacy Policy") + "</a>" +
        '<a href="terms.html" data-i18n="legalTerms">' + t("legalTerms", "Terms") + "</a>" +
        '<a href="disclaimer.html" data-i18n="legalDisclaimer">' + t("legalDisclaimer", "Medical Disclaimer") + "</a>" +
        '<a href="emergency.html" data-i18n="legalEmergency">' + t("legalEmergency", "Emergency Notice") + "</a>" +
      "</nav>";

    document.body.appendChild(footer);

    if (window.WelloraI18n && typeof window.WelloraI18n.applyTranslations === "function") {
      window.WelloraI18n.applyTranslations(footer);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureFooter);
  } else {
    ensureFooter();
  }

  window.addEventListener("wellora:languagechange", function () {
    if (window.WelloraI18n && typeof window.WelloraI18n.applyTranslations === "function") {
      window.WelloraI18n.applyTranslations(document);
    }
  });
})();
