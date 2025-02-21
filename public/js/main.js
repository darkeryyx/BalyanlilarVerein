async function fetchNews() {
    try {
        const response = await fetch("/news");
        if (!response.ok) throw new Error("Fehler beim Abrufen der News");
        const news = await response.json();
        const newsList = document.getElementById("news-list");
        newsList.innerHTML = "";

        news.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                ${item.image ? `<img src="${item.image}" class="news-image" alt="News Bild">` : ""}
                ${item.video ? `<video controls class="news-video"><source src="${item.video}" type="video/mp4"></video>` : ""}
                <small class="news-date">Erstellt am: ${item.createdAt || "Unbekannt"}</small>
            `;
            newsList.appendChild(li);
        });

    } catch (error) {
        console.error("Fehler beim Abrufen der News:", error);
    }
}

window.onload = fetchNews;
