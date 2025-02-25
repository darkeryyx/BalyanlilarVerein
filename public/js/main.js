async function fetchNews() {
    try {
        const response = await fetch("/news");
        if (!response.ok) throw new Error("Fehler beim Abrufen der News");
        const news = await response.json();
        const newsContainer = document.getElementById("news-container");
        newsContainer.innerHTML = "";

        news.forEach(item => {
            const article = document.createElement("article");
            article.innerHTML = `
                <h2>${item.title}</h2>
                <p>${item.content}</p>
                <small>Erstellt am: ${item.createdAt}</small>
            `;

            // **Bilder/Videos anzeigen**
            if (item.media && item.media.length > 0) {
                item.media.forEach(mediaUrl => {
                    const mediaElement = document.createElement(mediaUrl.endsWith(".mp4") ? "video" : "img");
                    mediaElement.src = mediaUrl;
                    mediaElement.style.maxWidth = "100%";
                    if (mediaUrl.endsWith(".mp4")) {
                        mediaElement.controls = true;
                    }
                    article.appendChild(mediaElement);
                });
            }

            newsContainer.appendChild(article);
        });

    } catch (error) {
        console.error("Fehler beim Abrufen der News:", error);
    }
}


window.onload = fetchNews;
