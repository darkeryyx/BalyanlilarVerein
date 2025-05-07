async function fetchGalleryMedia() {
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
        card.className = "gallery-item";
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
              ? `<video src="${media.url}" muted autoplay loop playsinline></video>`
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
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0,0,0,0.8)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 9999;
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
    
    if (isTouchDevice && !localStorage.getItem('galleryTipShown')) {
      const tip = document.createElement('div');
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
      
      tip.innerHTML = 'Tipp: Tippen Sie auf ein Bild, um Informationen anzuzeigen <button style="background: var(--secondary); border: none; color: white; padding: 3px 8px; margin-left: 10px; border-radius: 4px;">OK</button>';
      
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
      }, 5000);
    }
  });