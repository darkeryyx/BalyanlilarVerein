async function fetchNews() {
    try {
        const response = await fetch("/news");
        if (!response.ok) throw new Error("Fehler beim Abrufen der News");
        const news = await response.json();
        
        // Sortiere neueste News oben
        const sortedNews = news.sort((a, b) => b.id - a.id);
        const limitedNews = sortedNews.slice(0, 4);
        
        const newsList = document.getElementById("news-list");
        newsList.innerHTML = "";
        
        limitedNews.forEach(item => {
            let mediaElements = '';
            if (item.media && item.media.length > 0) {
                item.media.forEach(mediaUrl => {
                    const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|webm|ogg|mkv)$/);
                    if (isVideo) {
                        mediaElements += `<video src="${mediaUrl}" controls></video>`;
                    } else {
                        mediaElements += `<img src="${mediaUrl}" alt="Bild">`;
                    }
                });
            }
            const card = document.createElement("div");
            card.className = "news-card";
            card.innerHTML = `
                <h3>${item.title}</h3>
<p>${item.content.length > 200 ? item.content.substring(0, 200) + "..." : item.content}</p>
<a href="news-detail.html?id=${item.id}" class="read-more">Mehr lesen <span>→</span></a>

                ${mediaElements}
                <small>Erstellt am: ${item.createdAt}
                ${item.updatedAt && item.updatedAt !== item.createdAt ? " | Bearbeitet am: " + item.updatedAt : ""}</small>
            `;
            newsList.appendChild(card);
        });
        
    } catch (error) {
        console.error("Fehler beim Abrufen der News:", error);
    }
}

async function fetchEvents() {
    try {
      const response = await fetch("/events");
      if (!response.ok) throw new Error("Fehler beim Abrufen der Veranstaltungen");
      const events = await response.json();
  
      const sortedEvents = events.sort((a, b) => b.id - a.id);
      const limitedEvents = sortedEvents.slice(0, 3);
      const eventsGrid = document.querySelector(".events-grid");
      eventsGrid.innerHTML = "";
  
      limitedEvents.forEach(event => {
        let mediaHtml = "";
  
        if (event.media && event.media.length > 0) {
          event.media.forEach(url => {
            const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mkv)$/);
            mediaHtml += isVideo
              ? `<video src="${url}" controls class="event-media"></video>`
              : `<img src="${url}" alt="Bild" class="event-media">`;
          });
        } else {
          mediaHtml = `<img src="/logo2.png" alt="Standardbild" class="event-media">`;
        }
  
        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
          <div class="event-card-media">
            ${mediaHtml}
          </div>
          <div class="event-details">
            <span class="event-date">${event.date}${event.time ? ", " + event.time : ""}</span>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-location"><span><i class="fas fa-map-marker-alt"></i></span> ${event.location}</p>
            <p class="event-description">
              ${event.content.length > 200 ? event.content.substring(0, 200) + "..." : event.content}
            </p>
            <a href="events-detail.html?id=${event.id}" class="read-more">Mehr lesen <span>→</span></a>
            <small>
              Erstellt am: ${event.createdAt}
              ${event.updatedAt && event.updatedAt !== event.createdAt ? " | Bearbeitet am: " + event.updatedAt : ""}
            </small>
          </div>
        `;
        eventsGrid.appendChild(card);
      });
    } catch (error) {
      console.error("Fehler beim Abrufen der Veranstaltungen:", error);
    }
  }
  
      
document.addEventListener("click", function(e) {
    if ((e.target.tagName === "IMG" || e.target.tagName === "VIDEO") && !e.target.classList.contains("no-zoom")) {
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
        if (e.target.tagName === "IMG") {
            clone = document.createElement("img");
            clone.src = e.target.src;
            clone.style.maxWidth = "90%";
            clone.style.maxHeight = "90%";
        } else {
            clone = document.createElement("video");
            clone.src = e.target.src;
            clone.controls = true;
            clone.autoplay = true;
            clone.style.maxWidth = "90%";
            clone.style.maxHeight = "90%";
        }

        overlay.appendChild(clone);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", () => document.body.removeChild(overlay));
    }
});
document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth <= 768) {
      const mainContent = document.querySelector(".main-content");
      const eventsSection = document.querySelector("#events-section");
      if (mainContent && eventsSection) {
        mainContent.insertBefore(eventsSection, mainContent.querySelector(".sidebar"));
      }
    }
  });

  window.onload = function() {
    fetchNews();
    fetchEvents();
  };
  