document.getElementById("logout-btn").addEventListener("click", async () => {
    await fetch("/admin-logout", { method: "POST" });
    window.location.href = "/admin.html"; 
});

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
                <h3 contenteditable="false" class="news-title">${item.title}</h3>
                <p contenteditable="false" class="news-content">${item.content}</p>
                <small class="news-date">
                    Erstellt am: ${item.createdAt || "Unbekannt"}
                    ${item.updatedAt ? `<br>Letzte Änderung: ${item.updatedAt}` : ""}
                </small>
                <button class="edit-btn" data-id="${item.id}">✏️ Bearbeiten</button>
                <button class="save-btn" data-id="${item.id}" style="display:none;">💾 Speichern</button>
                <button class="delete-btn" data-id="${item.id}">🗑 Löschen</button>
            `;
            newsList.appendChild(li);
        });

        // Event-Listener für "Bearbeiten"-Buttons setzen
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const li = event.target.closest("li");
                const title = li.querySelector(".news-title");
                const content = li.querySelector(".news-content");
                const saveBtn = li.querySelector(".save-btn");

                title.contentEditable = "true";
                content.contentEditable = "true";
                title.focus();

                event.target.style.display = "none";
                saveBtn.style.display = "inline-block";
            });
        });

        // Event-Listener für "Speichern"-Buttons setzen
        document.querySelectorAll(".save-btn").forEach(button => {
            button.addEventListener("click", async (event) => {
                const li = event.target.closest("li");
                const id = button.dataset.id;
                const title = li.querySelector(".news-title").innerText.trim();
                const content = li.querySelector(".news-content").innerText.trim();

                if (!title || !content) {
                    alert("Bitte Titel und Inhalt eingeben!");
                    return;
                }

                try {
                    const response = await fetch(`/news/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title, content })
                    });

                    if (!response.ok) throw new Error("Fehler beim Speichern der News");

                    console.log("✅ News aktualisiert!");
                    await fetchNews();
                } catch (error) {
                    console.error("❌ Fehler beim Speichern der News:", error);
                }
            });
        });

        // Event-Listener für "Löschen"-Buttons setzen
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", () => deleteNews(button.dataset.id));
        });

    } catch (error) {
        console.error("Fehler beim Abrufen der News:", error);
    }
}




// News löschen
async function deleteNews(id) {
    if (!confirm("Bist du sicher, dass du diese News löschen möchtest?")) return;

    try {
        const response = await fetch(`/news/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Fehler beim Löschen der News");
        console.log("🗑 News erfolgreich gelöscht");
        await fetchNews();
    } catch (error) {
        console.error("Fehler beim Löschen der News:", error);
    }
}


// News bearbeiten
function editNews(id, title, content) {
    document.getElementById("news-id").value = id;
    document.getElementById("title").value = title;
    document.getElementById("content").value = content;
}

// News speichern (Neu oder Bearbeiten)
document.getElementById("newsForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("news-id").value.trim();
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();

    if (!title || !content) {
        alert("Bitte Titel und Inhalt eingeben!");
        return;
    }

    // Disable Submit-Button, um mehrfaches Absenden zu verhindern
    const submitButton = event.target.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
        const method = id ? "PUT" : "POST";
        const url = id ? `/news/${id}` : "/news";

        console.log(`📤 Sende ${method}-Request an ${url}:`, { title, content });

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) throw new Error(`Fehler beim ${id ? "Aktualisieren" : "Speichern"} der News`);

        console.log(`✅ News ${id ? "aktualisiert" : "gespeichert"}!`);
    } catch (error) {
        console.error("❌ Fehler beim Speichern der News:", error);
    } finally {
        // Submit-Button wieder aktivieren & Formular zurücksetzen
        submitButton.disabled = false;
        document.getElementById("newsForm").reset();
        document.getElementById("news-id").value = ""; 
        await fetchNews();
    }
});


fetchNews();
