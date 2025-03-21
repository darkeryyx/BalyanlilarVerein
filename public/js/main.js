async function fetchNews() {
    try {
        const response = await fetch("/news");
        if (!response.ok) throw new Error("Fehler beim Abrufen der News");
        const news = await response.json();
        
        // Sortiere neueste News oben
        const sortedNews = news.sort((a, b) => b.id - a.id);
        const limitedNews = sortedNews.slice(0, 3);
        
        const newsList = document.getElementById("news-list");
        newsList.innerHTML = "";
        
        limitedNews.forEach(item => {
            let mediaElements = '';
            if (item.media && item.media.length > 0) {
                item.media.forEach(mediaUrl => {
                    const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                                    mediaUrl.toLowerCase().endsWith('.webm') ||
                                    mediaUrl.toLowerCase().endsWith('.ogg') ||
                                    mediaUrl.toLowerCase().endsWith('.mkv');
                    if (isVideo) {
                        mediaElements += `<video src="${mediaUrl}" width="320" height="240" controls></video>`;
                    } else {
                        mediaElements += `<img src="${mediaUrl}" alt="Bild" style="max-width: 300px;">`;
                    }
                });
            }
            // Für News wird hier kein Standard-Platzhalter angezeigt
            const li = document.createElement("li");
            li.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                ${mediaElements}
                <small>
                  Erstellt am: ${item.createdAt}
                  ${item.updatedAt && item.updatedAt !== item.createdAt ? " | Bearbeitet am: " + item.updatedAt : ""}
                </small>
            `;
            newsList.appendChild(li);
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
        
        // Sortiere Events absteigend
        const sortedEvents = events.sort((a, b) => b.id - a.id);
        const limitedEvents = sortedEvents.slice(0, 3);
        
        const eventsGrid = document.querySelector(".events-grid");
        eventsGrid.innerHTML = "";
        
        limitedEvents.forEach(event => {
            // Verwende das hochgeladene Bild, falls vorhanden, ansonsten das Standard-Logo
            const imgSrc = (event.media && event.media[0]) 
                ? event.media[0] 
                : "https://res.cloudinary.com/da1r1e6gi/image/upload/v1742407933/Logo_m2eyz9.png";
            
            const card = document.createElement("div");
            card.className = "event-card";
            card.innerHTML = `
                <img src="${imgSrc}" alt="Event Bild" class="event-image">
                <div class="event-details">
                  <span class="event-date">${event.date}${event.time ? ', ' + event.time : ''}</span>
                  <h3 class="event-title">${event.title}</h3>
                  <p class="event-location"><span>📍</span> ${event.location}</p>
                  <p>${event.content}</p>
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


  
  window.onload = function() {
    fetchNews();
    fetchEvents();
  };
  