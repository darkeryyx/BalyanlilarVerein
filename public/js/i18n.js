// public/js/i18n.js

// aktuelle Sprache, default Deutsch
let currentLang = localStorage.getItem('lang') || 'de';

// Übersetzt alle markierten Elemente
function updateTranslations() {
    // Text-Inhalte
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const txt = TRANSLATIONS[currentLang][key];
      if (txt !== undefined) el.textContent = txt;
    });
    // HTML-Inhalte (erlaubt <strong>, <em> etc.)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const html = TRANSLATIONS[currentLang][key];
      if (html !== undefined) el.innerHTML = html;
    });
  }
  

// Sprachwechsel-Funktion
function setLanguage(lang) {
  if (!window.TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  updateTranslations();
}

document.addEventListener('DOMContentLoaded', () => {
    updateTranslations();
    // Falls Du Buttons zum Wechseln hast:
    document.getElementById('btn-de')?.addEventListener('click', () => setLanguage('de'));
    document.getElementById('btn-tr')?.addEventListener('click', () => setLanguage('tr'));
});
