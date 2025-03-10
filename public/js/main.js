async function fetchNews() {
    try {
        const response = await fetch("/news");
        if (!response.ok) throw new Error("Fehler beim Abrufen der News");
        const news = await response.json();
        const newsList = document.getElementById("news-list"); // Korrekte ID

        newsList.innerHTML = ""; // Leere die Liste, bevor neue News hinzugefügt werden

        news.forEach(item => {
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

            const li = document.createElement("li");
            li.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                ${mediaElements}
                <small>Erstellt am: ${item.createdAt}</small>
            `;
            newsList.appendChild(li);
        });

    } catch (error) {
        console.error("Fehler beim Abrufen der News:", error);
    }
}

window.onload = fetchNews;
