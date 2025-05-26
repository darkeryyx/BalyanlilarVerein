/* async function fetchGalleryMedia() {
    try {
      const [newsRes, eventsRes] = await Promise.all([
        fetch("/news"),
        fetch("/events"),
      ]);
      const [news, events] = await Promise.all([
        newsRes.json(),
        eventsRes.json(),
      ]);
  
      const container = document.getElementById("gallery-grid");
      container.innerHTML = "";
  
      const allMedia = [];
  
      news.forEach(item => {
        if (item.media && item.media.length) {
          item.media.forEach(url => {
            allMedia.push({
              type: isVideo(url) ? "video" : "image",
              url,
              title: item.title,
              id: item.id,
              origin: "news"
            });
          });
        }
      });
  
      events.forEach(item => {
        if (item.media && item.media.length) {
          item.media.forEach(url => {
            allMedia.push({
              type: isVideo(url) ? "video" : "image",
              url,
              title: item.title,
              id: item.id,
              origin: "events"
            });
          });
        }
      });
  
      allMedia.forEach(media => {
        const card = document.createElement("div");
        card.classList.add("gallery-item");
        if (media.type === "video") {
          card.classList.add("video-item");
        }
        card.setAttribute("tabindex", "0"); // Für bessere Accessibility
        card.setAttribute("aria-label", `${media.title} - Tippen für mehr Info`);
        const isVideo = media.type === "video";
        const detailLink =
          media.origin === "news"
            ? `news-detail.html?id=${media.id}`
            : `events-detail.html?id=${media.id}`;
  
        card.innerHTML = `
          <div class="media-container">
            ${isVideo
              ? `<video src="${media.url}" muted playsinline></video>`
              : `<img src="${media.url}" alt="${media.title}">`}
            <div class="media-overlay">
              <div class="media-title" title="${media.title}">${media.title}</div>
              <a href="${detailLink}" class="details-link">
                Mehr lesen <i class="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
        `;
  
        // Behandlung des Klicks für die Lightbox
        const mediaElement = isVideo
          ? card.querySelector("video")
          : card.querySelector("img");
  
        // Touch-Gerät erkennen
        const isTouchDevice = ('ontouchstart' in window) || 
                             (navigator.maxTouchPoints > 0) || 
                             (navigator.msMaxTouchPoints > 0);
  
        // Für Touch-Geräte: Ersten Klick für Overlay, zweiten für Lightbox
        if (isTouchDevice) {
          let overlayShown = false;
          
          card.addEventListener("click", (e) => {
            const overlay = card.querySelector(".media-overlay");
            const link = card.querySelector(".details-link");
            
            // Wenn der Klick auf den Link ist, normal weiterleiten
            if (e.target === link || link.contains(e.target)) {
              return;
            }
            
            // Erster Klick: Overlay anzeigen
            if (!overlayShown) {
              e.preventDefault();
              overlay.style.opacity = "1";
              overlayShown = true;
              
              // Nach 3 Sekunden ausblenden, wenn kein weiterer Klick erfolgt
              setTimeout(() => {
                if (overlayShown) {
                  overlay.style.opacity = "";
                  overlayShown = false;
                }
              }, 3000);
              
              return;
            }
            
            // Zweiter Klick: Lightbox öffnen (nur wenn nicht auf Link geklickt wurde)
            openLightbox(media.url, isVideo);
            overlayShown = false;
          });
        } else {
          // Für Desktop-Geräte: Direkter Klick öffnet Lightbox
          mediaElement.addEventListener("click", (e) => {
            e.stopPropagation();
            openLightbox(media.url, isVideo);
          });
        }
  
        container.appendChild(card);
      });
    } catch (err) {
      console.error("Fehler beim Laden der Galerie:", err);
    }
  }
  
  function openLightbox(url, isVideo) {
    const overlay = document.createElement("div");
     overlay.className = "lightbox-overlay";

  // Close-Button
  const btnClose = document.createElement("button");
  btnClose.className = "lightbox-close";
  btnClose.innerHTML = "&times;";
  overlay.appendChild(btnClose);
  btnClose.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0,0,0,0.8)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 10050;
    overlay.style.cursor = "zoom-out";
  
    let clone;
    if (!isVideo) {
      clone = document.createElement("img");
      clone.src = url;
      clone.style.maxWidth = "90%";
      clone.style.maxHeight = "90%";
    } else {
      clone = document.createElement("video");
      clone.src = url;
      clone.controls = true;
      clone.autoplay = true;
      clone.style.maxWidth = "90%";
      clone.style.maxHeight = "90%";
    }
  
    overlay.appendChild(clone);
    document.body.appendChild(overlay);
  
    overlay.addEventListener("click", () => document.body.removeChild(overlay));
  }
  
  function isVideo(url) {
    return url.toLowerCase().match(/\.(mp4|webm|ogg|mkv)$/);
  }
  
  document.addEventListener("DOMContentLoaded", fetchGalleryMedia);
  
  // Hilfetext anzeigen, wenn der Benutzer zum ersten Mal die Seite besucht
  document.addEventListener("DOMContentLoaded", () => {
    // Prüfen, ob wir auf einem Touch-Gerät sind
    const isTouchDevice = ('ontouchstart' in window) || 
                         (navigator.maxTouchPoints > 0) || 
                         (navigator.msMaxTouchPoints > 0);

    const tip = document.createElement('div');
      tip.className = "gallery-tip";
      tip.style.position = 'fixed';
      tip.style.bottom = '20px';
      tip.style.left = '50%';
      tip.style.transform = 'translateX(-50%)';
      tip.style.backgroundColor = 'rgba(28, 42, 68, 0.9)';
      tip.style.color = 'white';
      tip.style.padding = '10px 15px';
      tip.style.borderRadius = '8px';
      tip.style.fontSize = '14px';
      tip.style.zIndex = '1000';
      tip.style.textAlign = 'center';
      tip.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';

    if (isTouchDevice) {   
      
      tip.innerHTML = 'Tipp: Doppelklick auf ein Bild oder Video um es zu vergrößern. <button style="background: var(--secondary); border: none; color: white; padding: 3px 8px; margin-left: 10px; border-radius: 4px;">OK</button>';
      }else{  
        tip.innerHTML = 'Tipp: Klick auf ein Bild oder Video um es zu vergrößern. <button style="background: var(--secondary); border: none; color: white; padding: 3px 8px; margin-left: 10px; border-radius: 4px;">OK</button>';

      }

      document.body.appendChild(tip);
      
      // Hinweis schließen
      tip.querySelector('button').addEventListener('click', () => {
        document.body.removeChild(tip);
        localStorage.setItem('galleryTipShown', 'true');
      });
      
      // Nach 5 Sekunden automatisch ausblenden
      setTimeout(() => {
        if (document.body.contains(tip)) {
          document.body.removeChild(tip);
        }
      }, 10000);
    
  });*/

  // -------------------------------------------------
// gallery.js: AKTUELLE VERSION
// -------------------------------------------------
/*
const ITEMS_PER_PAGE = 15;
let allMedia = [];
let currentFilter = "all";
let currentPage = 1;

// 1) Sobald DOM bereit ist: Medien laden, UI aufbauen
document.addEventListener("DOMContentLoaded", () => {
  setupTipBox();
  setupFilterButtons();
  fetchGalleryMedia();
});

// Tipp-Box, erscheint bei JEDEM Laden
function setupTipBox() {
   // Prüfen, ob wir auf einem Touch-Gerät sind
   const isTouchDevice = ('ontouchstart' in window) || 
   (navigator.maxTouchPoints > 0) || 
   (navigator.msMaxTouchPoints > 0);

const tip = document.createElement('div');
tip.className = "gallery-tip";
tip.style.position = 'fixed';
tip.style.bottom = '20px';
tip.style.left = '50%';
tip.style.transform = 'translateX(-50%)';
tip.style.backgroundColor = 'rgba(28, 42, 68, 0.9)';
tip.style.color = 'white';
tip.style.padding = '10px 15px';
tip.style.borderRadius = '8px';
tip.style.fontSize = '14px';
tip.style.zIndex = '1000';
tip.style.textAlign = 'center';
tip.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';

tip.innerHTML = `
<span data-i18n="${
  isTouchDevice ? "gallery.tip.touch" : "gallery.tip.click"
}"></span>
<button style="background: var(--secondary); border: none; color: white; padding: 3px 8px; margin-left: 10px; border-radius: 4px;" class="gallery-tip-close" data-i18n="gallery.tip.ok"></button>
`;


document.body.appendChild(tip);

// Hinweis schließen
tip.querySelector('button').addEventListener('click', () => {
document.body.removeChild(tip);
localStorage.setItem('galleryTipShown', 'true');
});
}

// Filter-Buttons vorbereiten
function setupFilterButtons() {
  const filterWrap = document.querySelector(".filter-buttons");
  filterWrap.addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") return;
    document
      .querySelectorAll(".filter-buttons button")
      .forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");
    currentFilter = e.target.dataset.filter;
    currentPage = 1;
    renderGallery();
    renderPagination();
  });
}

// Daten laden und initial rendern
async function fetchGalleryMedia() {
  try {
    const [newsRes, eventsRes] = await Promise.all([
      fetch("/news"),
      fetch("/events")
    ]);
    const [news, events] = await Promise.all([newsRes.json(), eventsRes.json()]);

    allMedia = [];
    news.forEach(item => pushMedia(item, "news"));
    events.forEach(item => pushMedia(item, "events"));

    renderGallery();
    renderPagination();
  } catch (err) {
    console.error("Fehler beim Laden der Galerie:", err);
  }
}

// Hilfsfunktion: Medien in allMedia schieben
function pushMedia(item, origin) {
  if (!item.media) return;
  item.media.forEach(url =>
    allMedia.push({
      type: /\.(mp4|webm|ogg|mkv)$/i.test(url) ? "video" : "image",
      url,
      title: item.title,
      id: item.id,
      origin
    })
  );
}

// Galerie rendern (Filter + Pagination)
function renderGallery() {
  const container = document.getElementById("gallery-grid");
  container.innerHTML = "";

  // 1) Filter anwenden
  const filtered = allMedia.filter(m =>
    currentFilter === "all" ? true : m.type === currentFilter
  );

  // 2) Paginieren
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  // 3) Je Item eine Karte rendern
  pageItems.forEach(media => {
    const card = document.createElement("div");
    card.classList.add("gallery-item");
    if (media.type === "video") card.classList.add("video-item");
    card.setAttribute("tabindex", "0");
    card.setAttribute(
      "aria-label",
      `${media.title} – ${media.type === "video" ? "Video" : "Foto"}`
    );

    const detailLink =
      media.origin === "news"
        ? `news-detail.html?id=${media.id}`
        : `events-detail.html?id=${media.id}`;

    card.innerHTML = `
      <div class="media-container">
        ${
          media.type === "video"
            ? `<video src="${media.url}" muted playsinline></video>`
            : `<img src="${media.url}" alt="${media.title}">`
        }
        <div class="media-overlay">
          <div class="media-title" title="${media.title}">${media.title}</div>
          <a href="${detailLink}" class="details-link">
              <span data-i18n="read_more">Mehr lesen</span> <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;

    // Klick-Handler für Lightbox
    const selector = media.type === "video" ? "video" : "img";
    const mediaEl = card.querySelector(selector);
    mediaEl.addEventListener("click", e => {
      e.stopPropagation();
      openLightbox(media.url, media.type === "video");
    });

    container.appendChild(card);
  });
}

// Pagination rendern
function renderPagination() {
  const pag = document.getElementById("pagination");
  pag.innerHTML = "";

  // Gesamtseiten berechnen
  const totalItems = allMedia.filter(m =>
    currentFilter === "all" ? true : m.type === currentFilter
  ).length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return;

  // Prev
  const prev = document.createElement("button");
  prev.innerHTML = `&laquo; <span data-i18n="pagination.prev">Zurück</span>`;
  prev.disabled = currentPage === 1;
  prev.addEventListener("click", () => {
    currentPage--;
    renderGallery();
    renderPagination();
  });
  pag.appendChild(prev);

  // Nummern
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = i;
      renderGallery();
      renderPagination();
    });
    pag.appendChild(btn);
  }

  // Next
  const next = document.createElement("button");
  next.innerHTML = `<span data-i18n="pagination.next">Weiter</span> &raquo;`;
 // next.textContent = "Weiter »";
  next.disabled = currentPage === totalPages;
  next.addEventListener("click", () => {
    currentPage++;
    renderGallery();
    renderPagination();
  });
  pag.appendChild(next);
}

// Lightbox mit Close-Button
function openLightbox(url, isVideo) {
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";

  const btnClose = document.createElement("button");
  btnClose.className = "lightbox-close";
  btnClose.innerHTML = "&times;";
  overlay.appendChild(btnClose);
  btnClose.addEventListener("click", () => document.body.removeChild(overlay));

  const mediaEl = isVideo
    ? (() => {
        const v = document.createElement("video");
        v.src = url;
        v.controls = true;
        return v;
      })()
    : (() => {
        const i = document.createElement("img");
        i.src = url;
        return i;
      })();

  mediaEl.className = "lightbox-content";
  overlay.appendChild(mediaEl);

  overlay.addEventListener("click", e => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  document.body.appendChild(overlay);
}

document.addEventListener("DOMContentLoaded", function () {
  const headerToggle = document.getElementById("headerMenuToggle");
  const nav = document.getElementById("mainNav");

  headerToggle.addEventListener("click", function () {
    nav.classList.toggle("show");
  });
});
*/
  // -------------------------------------------------
// gallery.js: TESTVERSION FÜR IOS:
// -------------------------------------------------
// -------------------------------------------------
// gallery.js
// -------------------------------------------------
const ITEMS_PER_PAGE = 15;
let allMedia = [];
let currentFilter = "all";
let currentPage = 1;

// Helper: für Cloudinary-URLs on-the-fly H.264/MP4 erzwingen
function getPlayUrl(url) {
  if (/res\.cloudinary\.com/.test(url) && !url.toLowerCase().endsWith('.mp4')) {
    return url
      .replace(/\/upload\/(v\d+\/)?/, '/upload/f_mp4/')
      .replace(/\.\w+$/, '.mp4');
  }
  return url;
}

// 1) Sobald DOM bereit ist: Medien laden, UI aufbauen
document.addEventListener("DOMContentLoaded", () => {
  setupTipBox();
  setupFilterButtons();
  fetchGalleryMedia();
});

// Tipp-Box, erscheint bei JEDEM Laden (unverändert)
function setupTipBox() {
  const isTouchDevice = ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0);

  const tip = document.createElement('div');
  tip.className = "gallery-tip";
  // … Styles …
  tip.innerHTML = `
    <span data-i18n="${ isTouchDevice ? "gallery.tip.touch" : "gallery.tip.click" }"></span>
    <button class="gallery-tip-close" data-i18n="gallery.tip.ok"></button>
  `;
  document.body.appendChild(tip);
  tip.querySelector('button').addEventListener('click', () => {
    document.body.removeChild(tip);
    localStorage.setItem('galleryTipShown', 'true');
  });
}

// Filter-Buttons vorbereiten (unverändert)
function setupFilterButtons() {
  const filterWrap = document.querySelector(".filter-buttons");
  filterWrap.addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") return;
    document
      .querySelectorAll(".filter-buttons button")
      .forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");
    currentFilter = e.target.dataset.filter;
    currentPage = 1;
    renderGallery();
    renderPagination();
  });
}

// Daten laden und initial rendern (unverändert)
async function fetchGalleryMedia() {
  try {
    const [newsRes, eventsRes] = await Promise.all([
      fetch("/news"),
      fetch("/events")
    ]);
    const [news, events] = await Promise.all([newsRes.json(), eventsRes.json()]);

    allMedia = [];
    news.forEach(item => pushMedia(item, "news"));
    events.forEach(item => pushMedia(item, "events"));

    renderGallery();
    renderPagination();
  } catch (err) {
    console.error("Fehler beim Laden der Galerie:", err);
  }
}

// Hilfsfunktion: Medien in allMedia schieben (unverändert)
function pushMedia(item, origin) {
  if (!item.media) return;
  item.media.forEach(url =>
    allMedia.push({
      type: /\.(mp4|webm|ogg|mkv)$/i.test(url) ? "video" : "image",
      url,
      title: item.title,
      id: item.id,
      origin
    })
  );
}

// Galerie rendern (Filter + Pagination)
function renderGallery() {
  const container = document.getElementById("gallery-grid");
  container.innerHTML = "";

  // 1) Filter anwenden
  const filtered = allMedia.filter(m =>
    currentFilter === "all" ? true : m.type === currentFilter
  );

  // 2) Paginieren
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  // 3) Je Item eine Karte rendern
  pageItems.forEach(media => {
    const card = document.createElement("div");
    card.classList.add("gallery-item");
    if (media.type === "video") card.classList.add("video-item");
    card.setAttribute("tabindex", "0");
    card.setAttribute(
      "aria-label",
      `${media.title} – ${media.type === "video" ? "Video" : "Foto"}`
    );

    const detailLink =
      media.origin === "news"
        ? `news-detail.html?id=${media.id}`
        : `events-detail.html?id=${media.id}`;

    // **HIER**: Video mit poster & MP4-Quelle, Bild unverändert
    const mediaHtml = media.type === "video"
      ? (() => {
          const url       = media.url;
          const playUrl   = getPlayUrl(url);
          const posterUrl = url.replace(/\.\w+$/, '.jpg');
          return `
            <video
              muted
              playsinline
              webkit-playsinline
              poster="${posterUrl}"
              class="gallery-video"
            >
              <source src="${playUrl}" type="video/mp4">
              <source src="${url}" type="video/${url.split('.').pop()}">
              Dein Browser unterstützt HTML5-Videos nicht.
            </video>
          `;
        })()
      : `<img src="${media.url}" alt="${media.title}">`;

    card.innerHTML = `
      <div class="media-container">
        ${mediaHtml}
        <div class="media-overlay">
          <div class="media-title" title="${media.title}">${media.title}</div>
          <a href="${detailLink}" class="details-link">
            <span data-i18n="read_more">Mehr lesen</span>
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;

    // Klick-Handler für Lightbox (unverändert)
    const selector = media.type === "video" ? "video" : "img";
    const mediaEl = card.querySelector(selector);
    mediaEl.addEventListener("click", e => {
      e.stopPropagation();
      openLightbox(media.url, media.type === "video");
    });

    container.appendChild(card);
  });
}

// Pagination rendern (unverändert)
function renderPagination() {
  const pag = document.getElementById("pagination");
  pag.innerHTML = "";

  const totalItems = allMedia.filter(m =>
    currentFilter === "all" ? true : m.type === currentFilter
  ).length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return;

  // Prev
  const prev = document.createElement("button");
  prev.innerHTML = `&laquo; <span data-i18n="pagination.prev">Zurück</span>`;
  prev.disabled = currentPage === 1;
  prev.addEventListener("click", () => {
    currentPage--;
    renderGallery();
    renderPagination();
  });
  pag.appendChild(prev);

  // Nummern
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = i;
      renderGallery();
      renderPagination();
    });
    pag.appendChild(btn);
  }

  // Next
  const next = document.createElement("button");
  next.innerHTML = `<span data-i18n="pagination.next">Weiter</span> &raquo;`;
  next.disabled = currentPage === totalPages;
  next.addEventListener("click", () => {
    currentPage++;
    renderGallery();
    renderPagination();
  });
  pag.appendChild(next);
}

// Lightbox mit Close-Button
function openLightbox(url, isVideo) {
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";

  const btnClose = document.createElement("button");
  btnClose.className = "lightbox-close";
  btnClose.innerHTML = "&times;";
  overlay.appendChild(btnClose);
  btnClose.addEventListener("click", () => document.body.removeChild(overlay));

  const mediaEl = isVideo
    ? (() => {
        const v = document.createElement("video");
        v.src               = getPlayUrl(url);
        v.controls          = true;
        v.autoplay          = true;
        v.playsInline       = true;
        v.webkitPlaysInline = true;
        return v;
      })()
    : (() => {
        const i = document.createElement("img");
        i.src = url;
        return i;
      })();

  mediaEl.className = "lightbox-content";
  overlay.appendChild(mediaEl);

  overlay.addEventListener("click", e => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  document.body.appendChild(overlay);
}

// Header-Menü Toggle (unverändert)
document.addEventListener("DOMContentLoaded", function () {
  const headerToggle = document.getElementById("headerMenuToggle");
  const nav = document.getElementById("mainNav");
  headerToggle.addEventListener("click", function () {
    nav.classList.toggle("show");
  });
});
