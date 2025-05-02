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
              source: "news"
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
              source: "events"
            });
          });
        }
      });
  
      allMedia.forEach(media => {
        const card = document.createElement("div");
        card.className = "gallery-item";
        card.innerHTML = `
          <a href="${media.source}-detail.html?id=${media.id}">
            ${media.type === "video"
              ? `<video src="${media.url}" controls></video>`
              : `<img src="${media.url}" alt="${media.title}">`}
            <div class="media-title">${media.title}</div>
          </a>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      console.error("Fehler beim Laden der Galerie:", err);
    }
  }
  
  function isVideo(url) {
    return url.toLowerCase().match(/\.(mp4|webm|ogg|mkv)$/);
  }
  
  document.addEventListener("DOMContentLoaded", fetchGalleryMedia);
  