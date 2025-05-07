/* VON MIRRRRRRRRRRRRRRRRRRRRRRRRRRR

const entryTypeSelect = document.getElementById("entry-type");
        const eventFields = document.getElementById("event-fields");
      
        entryTypeSelect.addEventListener("change", () => {
          if (entryTypeSelect.value === "event") {
            eventFields.style.display = "block";
          } else {
            eventFields.style.display = "none";
          }
        });

 
        function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
        // Logout-Button
        document.getElementById("logout-btn").addEventListener("click", async () => {
            await fetch("/admin-logout", { method: "POST" });
            window.location.href = "/admin.html";
        });

        async function fetchNews() {
            try {
                const cacheBuster = new Date().getTime(); // Aktuelle Zeit als Cache-Buster
    const response = await fetch(`/news?cb=${cacheBuster}`);
    if (!response.ok) throw new Error("Fehler beim Abrufen der News");
    const news = await response.json();
                const newsList = document.getElementById("news-list");
                newsList.innerHTML = "";

                news.forEach(item => {
                    const li = document.createElement("li");

                    const h3 = document.createElement("h3");
                    h3.textContent = item.title;
                    li.appendChild(h3);

                    const p = document.createElement("p");
                    p.textContent = item.content;
                    li.appendChild(p);

                    if (item.media && item.media.length > 0) {
                        item.media.forEach(mediaUrl => {
                            const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                                mediaUrl.toLowerCase().endsWith('.webm') ||
                                mediaUrl.toLowerCase().endsWith('.ogg') ||
                                mediaUrl.toLowerCase().endsWith('.mkv');

                            if (isVideo) {
                                const video = document.createElement("video");
                                video.src = mediaUrl;
                                video.width = 320;
                                video.height = 240;
                                video.controls = true;
                                li.appendChild(video);
                            } else {
                                const img = document.createElement("img");
                                img.src = mediaUrl;
                                img.alt = "Bild";
                                img.style.maxWidth = "300px";
                                li.appendChild(img);
                            }
                        });
                    }

                    // Zeitstempel anzeigen
                const small = document.createElement("small");
                small.innerHTML = `Erstellt am: ${item.createdAt}` +
                (item.updatedAt && item.updatedAt !== item.createdAt ? ` | Bearbeitet am: ${item.updatedAt}` : "");
                li.appendChild(small);

                    const editButton = document.createElement("button");
                    editButton.textContent = "Bearbeiten";
                    editButton.classList.add("edit-btn");
                    editButton.dataset.id = item.id;
                    editButton.addEventListener('click', function() {
                        const id = this.dataset.id;
                        editNews(id);
                    });
                    li.appendChild(editButton);

                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Löschen";
                    deleteButton.classList.add("delete-btn");
                    deleteButton.dataset.id = item.id;
                    deleteButton.addEventListener('click', function() {
                        const id = this.dataset.id;
                        deleteNews(id);
                    });
                    li.appendChild(deleteButton);

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
        const eventsList = document.getElementById("events-list");
        eventsList.innerHTML = "";
        events.forEach(event => {
            const li = document.createElement("li");
            li.innerHTML = `
                <h3>${event.title}</h3>
                <p>${event.content}</p>
                <p><strong>Datum:</strong> ${event.date} ${event.time ? event.time : ""}</p>
                <p><strong>Ort:</strong> ${event.location}</p>
            `;
            
            // Falls Medien vorhanden sind:
            if (event.media && event.media.length > 0) {
                event.media.forEach(mediaUrl => {
                    const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                                    mediaUrl.toLowerCase().endsWith('.webm') ||
                                    mediaUrl.toLowerCase().endsWith('.ogg') ||
                                    mediaUrl.toLowerCase().endsWith('.mkv');
                    if (isVideo) {
                        li.innerHTML += `<video src="${mediaUrl}" width="320" height="240" controls></video>`;
                    } else {
                        li.innerHTML += `<img src="${mediaUrl}" alt="Bild" style="max-width: 300px;">`;
                    }
                });
            } else {
                // Verwende ein anderes Platzhalterbild:
                li.innerHTML += `<img src="https://res.cloudinary.com/da1r1e6gi/image/upload/v1742407933/Logo_m2eyz9.png" alt="Logo" style="max-width: 300px;">`;
            }
            
            // Zeitstempel anzeigen
            const small = document.createElement("small");
            small.innerHTML = `Erstellt am: ${event.createdAt}` +
                (event.updatedAt && event.updatedAt !== event.createdAt ? ` | Bearbeitet am: ${event.updatedAt}` : "");
            li.appendChild(small);

            // Editieren-Button
            const editButton = document.createElement("button");
            editButton.textContent = "Bearbeiten";
            editButton.addEventListener("click", function() {
                editEvent(event.id);
            });
            li.appendChild(editButton);
            
            // Löschen-Button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Löschen";
            deleteButton.addEventListener("click", function() {
                deleteEvent(event.id);
            });
            li.appendChild(deleteButton);
            
            eventsList.appendChild(li);
        });
    } catch (error) {
        console.error("Fehler beim Abrufen der Veranstaltungen:", error);
    }
}

async function editEvent(id) {
    try {
        const response = await fetch(`/events/${id}`);
        if (!response.ok) throw new Error("Fehler beim Abrufen der Veranstaltung");
        const eventItem = await response.json();

        // Formular mit den Event-Daten füllen
        document.getElementById("entry-id").value = eventItem.id;
        document.getElementById("title").value = eventItem.title;
        document.getElementById("content").value = eventItem.content;
        
        // Setze den Typ auf "event" und zeige event-spezifische Felder an
        document.getElementById("entry-type").value = "event";
        document.getElementById("event-fields").style.display = "block";
        document.getElementById("event-date").value = eventItem.date || "";
        document.getElementById("event-time").value = eventItem.time || "";
        document.getElementById("event-location").value = eventItem.location || "";
        
        // Vorhandene Medien anzeigen
        const existingMediaDiv = document.getElementById("existing-media");
        existingMediaDiv.innerHTML = "";
        if (eventItem.media && eventItem.media.length > 0) {
            eventItem.media.forEach((mediaUrl, index) => {
                const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                                mediaUrl.toLowerCase().endsWith('.webm') ||
                                mediaUrl.toLowerCase().endsWith('.ogg') ||
                                mediaUrl.toLowerCase().endsWith('.mkv');
                let mediaElement;
                if (isVideo) {
                    mediaElement = document.createElement('video');
                    mediaElement.src = mediaUrl;
                    mediaElement.width = 320;
                    mediaElement.height = 240;
                    mediaElement.controls = true;
                } else {
                    mediaElement = document.createElement('img');
                    mediaElement.src = mediaUrl;
                    mediaElement.alt = "Bild";
                    mediaElement.style.maxWidth = "300px";
                }
                
                // Erstelle einen Button zum Entfernen des Mediums
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Entfernen';
                removeButton.classList.add('remove-existing-media-btn');
                removeButton.dataset.mediaIndex = index;
                removeButton.addEventListener('click', debounce(function() {
                    // Du kannst hier eine Funktion removeExistingMediaEvent implementieren,
                    // die analog zu removeExistingMedia funktioniert, aber den Endpunkt /events verwendet.
                    removeExistingMediaEvent(eventItem.id, index);
                }, 300));
                
                const mediaContainer = document.createElement('div');
                mediaContainer.appendChild(mediaElement);
                mediaContainer.appendChild(removeButton);
                existingMediaDiv.appendChild(mediaContainer);
            });
        }
        
        document.getElementById("cancel-edit-btn").style.display = "inline-block";
        document.getElementById("cancel-edit-btn").addEventListener('click', function() {
            cancelEdit();
        });
    } catch (error) {
        console.error("Fehler beim Abrufen der Veranstaltung:", error);
    }
}
async function deleteEvent(id) {
    try {
        const response = await fetch(`/events/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Fehler beim Löschen der Veranstaltung");
        await fetchEvents(); // Aktualisiert die Liste der Veranstaltungen
    } catch (error) {
        console.error("Fehler beim Löschen der Veranstaltung:", error);
    }
}

async function removeExistingMediaEvent(eventId, mediaIndex) {
    // Deaktiviere vorübergehend alle Buttons, um doppelte Klicks zu vermeiden
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
    
    try {
        const response = await fetch(`/events/${eventId}/media/${mediaIndex}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Fehler beim Entfernen des Mediums");
        
        const result = await response.json();
        console.log("Delete response:", result);
        
        // Kleine Verzögerung, damit die Änderung sichtbar wird
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Aktualisiere die Anzeige: sowohl die Event-Liste als auch das Bearbeitungsformular
        await fetchEvents();
        await editEvent(eventId);
    } catch (error) {
        console.error("Fehler beim Entfernen des Mediums:", error);
        alert("Fehler beim Löschen: " + error.message);
    } finally {
        // Reaktiviere alle Buttons
        buttons.forEach(btn => btn.disabled = false);
    }
}



        async function deleteNews(id) {
            try {
                const response = await fetch(`/news/${id}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Fehler beim Löschen der News");
                await fetchNews();
            } catch (error) {
                console.error("Fehler beim Löschen der News:", error);
            }
        }

        async function editNews(id) {
            try {
                const response = await fetch(`/news/${id}`);
                if (!response.ok) throw new Error("Fehler beim Abrufen der News");
                const newsItem = await response.json();

                document.getElementById("entry-id").value = newsItem.id;
                document.getElementById("title").value = newsItem.title;
                document.getElementById("content").value = newsItem.content;

                // Vorhandene Medien anzeigen
                const existingMediaDiv = document.getElementById("existing-media");
                existingMediaDiv.innerHTML = ''; // Clear existing media
                if (newsItem.media && newsItem.media.length > 0) {
                    newsItem.media.forEach((mediaUrl, index) => {
                        const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                            mediaUrl.toLowerCase().endsWith('.webm') ||
                            mediaUrl.toLowerCase().endsWith('.ogg') ||
                            mediaUrl.toLowerCase().endsWith('.mkv');

                        let mediaElement;
                        if (isVideo) {
                            mediaElement = document.createElement('video');
                            mediaElement.src = mediaUrl;
                            mediaElement.width = 320;
                            mediaElement.height = 240;
                            mediaElement.controls = true;
                        } else {
                            mediaElement = document.createElement('img');
                            mediaElement.src = mediaUrl;
                            mediaElement.alt = "Bild";
                            mediaElement.style.maxWidth = "300px";
                        }

                        const removeButton = document.createElement('button');
                        removeButton.textContent = 'Entfernen';
                        removeButton.classList.add('remove-existing-media-btn');
                        removeButton.dataset.mediaIndex = index;
                        removeButton.addEventListener('click', debounce(function() {
                            removeExistingMedia(newsItem.id, index);
                        }, 300)); // 300ms delay

                        const mediaContainer = document.createElement('div');
                        mediaContainer.appendChild(mediaElement);
                        mediaContainer.appendChild(removeButton);
                        existingMediaDiv.appendChild(mediaContainer);
                    });
                }
                document.getElementById("cancel-edit-btn").style.display = "inline-block";
                document.getElementById("cancel-edit-btn").addEventListener('click', function() {
                    cancelEdit();
                });
            } catch (error) {
                console.error("Fehler beim Abrufen der News:", error);
            }
        }

        async function removeExistingMedia(newsId, mediaIndex) {
  // Disable all buttons during operation
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = true);
  
  try {
    const response = await fetch(`/news/${newsId}/media/${mediaIndex}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Fehler beim Entfernen des Mediums");
    
    const result = await response.json();
    console.log("Delete response:", result);
    
    // Add a small delay before reloading
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await fetchNews();
    await editNews(newsId);
  } catch (error) {
    console.error("Fehler beim Entfernen des Mediums:", error);
    alert("Fehler beim Löschen: " + error.message);
  } finally {
    // Re-enable all buttons when done
    buttons.forEach(btn => btn.disabled = false);
  }
}


        async function cancelEdit() {
            document.getElementById("entryForm").reset();
            document.getElementById("entry-id").value = "";
            document.getElementById("existing-media").innerHTML = "";
            document.getElementById("cancel-edit-btn").style.display = "none";
        }

        document.getElementById("entryForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    // Show upload overlay
    const overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(255,255,255,0.8)";
    overlay.style.backdropFilter = "blur(5px)";
    overlay.style.zIndex = 1000;
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    // Spinner
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    spinner.style.border = "4px solid #f3f3f3";
    spinner.style.borderTop = "4px solid #3498db";
    spinner.style.borderRadius = "50%";
    spinner.style.width = "50px";
    spinner.style.height = "50px";
    spinner.style.animation = "spin 1s linear infinite";
    spinner.style.marginBottom = "1rem";

    // Message with more detailed progress information
    const message = document.createElement("p");
    message.id = "upload-message";
    message.textContent = "Vorbereitung zum Hochladen...";

    // Progress element for large uploads
    const progressContainer = document.createElement("div");
    progressContainer.style.width = "80%";
    progressContainer.style.maxWidth = "400px";
    progressContainer.style.marginTop = "10px";
    
    const progressBar = document.createElement("div");
    progressBar.id = "upload-progress";
    progressBar.style.width = "100%";
    progressBar.style.height = "20px";
    progressBar.style.backgroundColor = "#f3f3f3";
    progressBar.style.borderRadius = "10px";
    progressBar.style.overflow = "hidden";
    
    const progressFill = document.createElement("div");
    progressFill.id = "progress-fill";
    progressFill.style.width = "0%";
    progressFill.style.height = "100%";
    progressFill.style.backgroundColor = "#4CAF50";
    progressFill.style.transition = "width 0.3s";
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    // Add elements to overlay
    overlay.appendChild(spinner);
    overlay.appendChild(message);
    overlay.appendChild(progressContainer);
    document.body.appendChild(overlay);

    // Update progress function (can be called from outside)
    window.updateUploadProgress = function(percent, statusText) {
        const fill = document.getElementById("progress-fill");
        const msg = document.getElementById("upload-message");
        if (fill) fill.style.width = percent + "%";
        if (msg && statusText) msg.textContent = statusText;
    };

    const id = document.getElementById("entry-id").value;
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const mediaFiles = document.getElementById("media").files;
    const entryType = document.getElementById("entry-type").value;

    if (!title || !content) {
        alert("Bitte Titel und Inhalt eingeben!");
        document.body.removeChild(overlay);
        return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    
    // Falls es eine Veranstaltung ist, hänge zusätzliche Felder an
    if (entryType === "event") {
        formData.append("date", document.getElementById("event-date").value);
        formData.append("time", document.getElementById("event-time").value);
        formData.append("location", document.getElementById("event-location").value);
    }
    // If there are large files, update the message
    let totalSize = 0;
    for (const file of mediaFiles) {
        formData.append("media", file);
        totalSize += file.size;
        console.log(`📂 Datei hinzugefügt: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
    if (totalSize > 50 * 1024 * 1024) { // If total size > 50MB
        window.updateUploadProgress(0, `Große Dateien erkannt (${(totalSize / (1024 * 1024)).toFixed(2)} MB). Das Hochladen kann einige Minuten dauern...`);
    }
    // Bestimme Endpunkt und Methode basierend auf Typ und ID
    let uploadMethod = id ? "PUT" : "POST";
    let uploadUrl;
    if (entryType === "news") {
        uploadUrl = id ? `/news/${id}` : "/news";
    } else {
        uploadUrl = id ? `/events/${id}` : "/events";
    }
    try {
        // Starte den Timer für den Upload
        const startTime = Date.now();
        let uploadTimer = null;
        if (totalSize > 20 * 1024 * 1024) {
            let seconds = 0;
            uploadTimer = setInterval(() => {
                seconds += 1;
                const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(0);
                window.updateUploadProgress(
                    Math.min(95, Math.floor(seconds * 3)),
                    `Upload läuft seit ${elapsedTime} Sekunden. Bitte warten...`
                );
            }, 1000);
        }
        
        // Perform the actual upload
        const response = await fetch(uploadUrl, {
            method: uploadMethod,
            body: formData
        });
        
        // Clear timer if set
        if (uploadTimer) clearInterval(uploadTimer);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error: ${errorText}`);
        }

        // Update progress to 100%
        window.updateUploadProgress(100, "✅ Upload erfolgreich abgeschlossen!");
        
        console.log("✅ News erfolgreich gespeichert!");
        document.getElementById("entryForm").reset();
        document.getElementById("entry-type").value = "news";
        document.getElementById("event-fields").style.display = "none";
        document.getElementById("entry-id").value = "";
        document.getElementById("existing-media").innerHTML = "";
        document.getElementById("cancel-edit-btn").style.display = "none";
        
        // Small delay to show 100% completion before refreshing
        setTimeout(async () => {
            await fetchNews();
            await fetchEvents();
            document.body.removeChild(overlay);
        }, 500);
    } catch (error) {
        console.error("❌ Fehler beim Speichern der News:", error);
        window.updateUploadProgress(0, `❌ Fehler: ${error.message}`);
        
        // Keep the error visible for a moment before removing overlay
        setTimeout(() => {
            document.body.removeChild(overlay);
            alert(`Fehler beim Speichern der News: ${error.message}`);
        }, 2000);
    }
});


    fetchNews();
    fetchEvents();

/* VON CLAUDEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE

// Tab-Funktionalität verbessern
document.addEventListener('DOMContentLoaded', function() {
    // Tab-Wechsel-Funktionalität
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Aktive Klasse von allen Tabs entfernen
            tabs.forEach(t => t.classList.remove('active'));
            
            // Aktive Klasse dem angeklickten Tab hinzufügen
            this.classList.add('active');
            
            // Alle Content-Sections verstecken
            const contentSections = document.querySelectorAll('.content-section');
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Entsprechende Content-Section anzeigen
            const targetId = `${this.dataset.tab}-section`;
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Verbesserte Type-Selector Funktionalität für News/Events
    const typeOptions = document.querySelectorAll('.type-option');
    typeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Aktive Klasse von allen Optionen entfernen
            typeOptions.forEach(o => o.classList.remove('active'));
            
            // Aktive Klasse der angeklickten Option hinzufügen
            this.classList.add('active');
            
            // Typ-Wert setzen
            const type = this.dataset.type;
            document.getElementById('entry-type').value = type;
            
            // Event-spezifische Felder anzeigen/verstecken
            document.getElementById('event-fields').style.display = 
                type === 'event' ? 'block' : 'none';
        });
    });

    // Media-Uploader Drag & Drop Funktionalität
    const mediaUploader = document.getElementById('media-uploader');
    const mediaInput = document.getElementById('media');
    
    // Datei-Auswahl beim Klicken
    mediaUploader.addEventListener('click', () => {
        mediaInput.click();
    });
    
    // Drag & Drop Funktionalität
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        mediaUploader.classList.add('highlight');
        mediaUploader.style.borderColor = 'var(--primary)';
        mediaUploader.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    }
    
    function unhighlight() {
        mediaUploader.classList.remove('highlight');
        mediaUploader.style.borderColor = 'var(--light-gray)';
        mediaUploader.style.backgroundColor = '';
    }
    
    mediaUploader.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        mediaInput.files = files;
        
        // Optional: Zeige Vorschaubilder der ausgewählten Dateien
        displayFilePreview(files);
    }
    
    // Zeige Vorschaubilder der ausgewählten Dateien (auch bei normaler Dateiauswahl)
    mediaInput.addEventListener('change', function() {
        displayFilePreview(this.files);
    });
    
    function displayFilePreview(files) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview-container';
        previewContainer.style.display = 'flex';
        previewContainer.style.flexWrap = 'wrap';
        previewContainer.style.gap = '10px';
        previewContainer.style.marginTop = '10px';
        
        // Entferne vorhandene Vorschauen
        const existingPreview = mediaUploader.querySelector('.file-preview-container');
        if (existingPreview) {
            mediaUploader.removeChild(existingPreview);
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';
            previewItem.style.position = 'relative';
            previewItem.style.width = '100px';
            previewItem.style.height = '100px';
            previewItem.style.overflow = 'hidden';
            previewItem.style.borderRadius = 'var(--border-radius)';
            previewItem.style.boxShadow = 'var(--shadow)';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                previewItem.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const videoIcon = document.createElement('div');
                videoIcon.innerHTML = '<i class="fas fa-video"></i>';
                videoIcon.style.width = '100%';
                videoIcon.style.height = '100%';
                videoIcon.style.display = 'flex';
                videoIcon.style.alignItems = 'center';
                videoIcon.style.justifyContent = 'center';
                videoIcon.style.fontSize = '2rem';
                videoIcon.style.backgroundColor = '#f8f9fa';
                videoIcon.style.color = 'var(--primary)';
                
                previewItem.appendChild(videoIcon);
            }
            
            const fileNameLabel = document.createElement('div');
            fileNameLabel.textContent = file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name;
            fileNameLabel.style.position = 'absolute';
            fileNameLabel.style.bottom = '0';
            fileNameLabel.style.left = '0';
            fileNameLabel.style.right = '0';
            fileNameLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            fileNameLabel.style.color = 'white';
            fileNameLabel.style.fontSize = '0.7rem';
            fileNameLabel.style.padding = '2px 4px';
            fileNameLabel.style.textOverflow = 'ellipsis';
            fileNameLabel.style.overflow = 'hidden';
            fileNameLabel.style.whiteSpace = 'nowrap';
            
            previewItem.appendChild(fileNameLabel);
            previewContainer.appendChild(previewItem);
        }
        
        mediaUploader.appendChild(previewContainer);
    }
    
    // Verbesserte Darstellung der News- und Event-Listen
    async function fetchNews() {
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/news?cb=${cacheBuster}`);
            if (!response.ok) throw new Error("Fehler beim Abrufen der News");
            const news = await response.json();
            const newsList = document.getElementById("news-list");
            newsList.innerHTML = "";

            if (news.length === 0) {
                showEmptyState(newsList, "Keine News vorhanden", "newspaper");
                return;
            }

            news.forEach(item => {
                const card = createItemCard(item, 'news');
                newsList.appendChild(card);
            });
        } catch (error) {
            console.error("Fehler beim Abrufen der News:", error);
            const newsList = document.getElementById("news-list");
            showErrorState(newsList, "Fehler beim Laden der News");
        }
    }

    async function fetchEvents() {
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/events?cb=${cacheBuster}`);
            if (!response.ok) throw new Error("Fehler beim Abrufen der Veranstaltungen");
            const events = await response.json();
            const eventsList = document.getElementById("events-list");
            eventsList.innerHTML = "";

            if (events.length === 0) {
                showEmptyState(eventsList, "Keine Veranstaltungen vorhanden", "calendar-alt");
                return;
            }

            events.forEach(item => {
                const card = createItemCard(item, 'event');
                eventsList.appendChild(card);
            });
        } catch (error) {
            console.error("Fehler beim Abrufen der Veranstaltungen:", error);
            const eventsList = document.getElementById("events-list");
            showErrorState(eventsList, "Fehler beim Laden der Veranstaltungen");
        }
    }

    function createItemCard(item, type) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        // Mediendarstellung (falls vorhanden)
        if (item.media && item.media.length > 0) {
            const mediaUrl = item.media[0]; // Erstes Medium für Vorschau verwenden
            const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                          mediaUrl.toLowerCase().endsWith('.webm') ||
                          mediaUrl.toLowerCase().endsWith('.ogg') ||
                          mediaUrl.toLowerCase().endsWith('.mkv');
            
            if (isVideo) {
                const video = document.createElement('video');
                video.className = 'item-image';
                video.src = mediaUrl;
                video.setAttribute('muted', true);
                video.setAttribute('playsinline', true);
                
                // Autoplay nur wenn sichtbar
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            video.play().catch(() => {});
                        } else {
                            video.pause();
                        }
                    });
                });
                observer.observe(video);
                
                card.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.className = 'item-image';
                img.src = mediaUrl;
                img.alt = item.title;
                card.appendChild(img);
            }
        } else {
            // Placeholder falls kein Medium vorhanden
            const placeholderDiv = document.createElement('div');
            placeholderDiv.className = 'item-image';
            placeholderDiv.style.display = 'flex';
            placeholderDiv.style.alignItems = 'center';
            placeholderDiv.style.justifyContent = 'center';
            placeholderDiv.style.backgroundColor = 'var(--light-gray)';
            
            const icon = document.createElement('i');
            icon.className = type === 'event' ? 'far fa-calendar-alt fa-3x' : 'far fa-newspaper fa-3x';
            icon.style.color = 'var(--gray)';
            
            placeholderDiv.appendChild(icon);
            card.appendChild(placeholderDiv);
        }
        
        // Inhalt
        const content = document.createElement('div');
        content.className = 'item-content';
        
        const title = document.createElement('h3');
        title.className = 'item-title';
        title.textContent = item.title;
        content.appendChild(title);
        
        const text = document.createElement('p');
        text.className = 'item-text';
        text.textContent = item.content;
        content.appendChild(text);
        
        // Details für Events
        if (type === 'event') {
            const details = document.createElement('div');
            details.className = 'item-details';
            
            if (item.date) {
                const dateDetail = document.createElement('div');
                dateDetail.className = 'item-detail';
                dateDetail.innerHTML = `<i class="far fa-calendar"></i> ${item.date}${item.time ? ' ' + item.time + ' Uhr' : ''}`;
                details.appendChild(dateDetail);
            }
            
            if (item.location) {
                const locationDetail = document.createElement('div');
                locationDetail.className = 'item-detail';
                locationDetail.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${item.location}`;
                details.appendChild(locationDetail);
            }
            
            content.appendChild(details);
        }
        
        // Zeitstempel
        const timestamp = document.createElement('div');
        timestamp.className = 'item-timestamp';
        timestamp.innerHTML = `Erstellt am: ${item.createdAt}` +
            (item.updatedAt && item.updatedAt !== item.createdAt ? ` | Bearbeitet am: ${item.updatedAt}` : "");
        content.appendChild(timestamp);
        
        // Aktionen
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary btn-small';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Bearbeiten';
        editBtn.addEventListener('click', () => {
            if (type === 'event') {
                editEvent(item.id);
            } else {
                editNews(item.id);
            }
        });
        actions.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Löschen';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Möchten Sie diesen ${type === 'event' ? 'Veranstaltung' : 'News'}-Eintrag wirklich löschen?`)) {
                if (type === 'event') {
                    deleteEvent(item.id);
                } else {
                    deleteNews(item.id);
                }
            }
        });
        actions.appendChild(deleteBtn);
        
        content.appendChild(actions);
        card.appendChild(content);
        
        return card;
    }

    function showEmptyState(container, message, iconName) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="far fa-${iconName}"></i>
            <h3>${message}</h3>
            <p>Erstellen Sie neue Inhalte über den "Erstellen / Bearbeiten" Tab.</p>
        `;
        container.appendChild(emptyState);
    }

    function showErrorState(container, message) {
        const errorState = document.createElement('div');
        errorState.className = 'empty-state';
        errorState.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
            <h3>${message}</h3>
            <p>Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator.</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Neu laden
            </button>
        `;
        container.appendChild(errorState);
    }

    // Verbesserte Toast-Nachrichten für Benutzer-Feedback
    function showToast(message, type = 'success') {
        // Entferne bestehende Toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            document.body.removeChild(toast);
        });
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.minWidth = '250px';
        toast.style.padding = '15px 20px';
        toast.style.borderRadius = 'var(--border-radius)';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        toast.style.zIndex = '1000';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';
        toast.style.animation = 'fadeIn 0.3s, fadeOut 0.3s 3.7s';
        toast.style.backgroundColor = type === 'success' ? 'var(--secondary)' : 'var(--danger)';
        toast.style.color = 'white';
        
        toast.innerHTML = `
            <span style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${message}
            </span>
            <i class="fas fa-times" style="cursor: pointer;"></i>
        `;
        
        document.body.appendChild(toast);
        
        // Close button functionality
        toast.querySelector('.fa-times').addEventListener('click', () => {
            document.body.removeChild(toast);
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }

    // Füge CSS für Toast-Animationen hinzu
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
    `;
    document.head.appendChild(style);

    // Verbesserte Bestätigungsdialoge
    function confirmAction(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1001';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.style.backgroundColor = 'white';
        dialog.style.borderRadius = 'var(--border-radius)';
        dialog.style.padding = '20px';
        dialog.style.boxShadow = 'var(--shadow)';
        dialog.style.width = '90%';
        dialog.style.maxWidth = '400px';
        dialog.style.animation = 'scaleIn 0.3s';
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--dark);">${message}</h3>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button class="btn btn-secondary btn-cancel">Abbrechen</button>
                <button class="btn btn-danger btn-confirm">Bestätigen</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Füge CSS für Dialog-Animation hinzu
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Button event listeners
        dialog.querySelector('.btn-cancel').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        });
        
        dialog.querySelector('.btn-confirm').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });
    }

    // Override der existierenden Funktionen mit verbesserter UI
    window.deleteNews = function(id) {
        confirmAction('Möchten Sie diesen News-Eintrag wirklich löschen?', async () => {
            try {
                const response = await fetch(`/news/${id}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Fehler beim Löschen der News");
                
                await fetchNews();
                showToast('News erfolgreich gelöscht', 'success');
            } catch (error) {
                console.error("Fehler beim Löschen der News:", error);
                showToast('Fehler beim Löschen der News', 'error');
            }
        });
    };
    
    window.deleteEvent = function(id) {
        confirmAction('Möchten Sie diese Veranstaltung wirklich löschen?', async () => {
            try {
                const response = await fetch(`/events/${id}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Fehler beim Löschen der Veranstaltung");
                
                await fetchEvents();
                showToast('Veranstaltung erfolgreich gelöscht', 'success');
            } catch (error) {
                console.error("Fehler beim Löschen der Veranstaltung:", error);
                showToast('Fehler beim Löschen der Veranstaltung', 'error');
            }
        });
    };

    // Initialisierung
    fetchNews();
    fetchEvents();
    
    // Weise die verbesserten Funktionen dem globalen Scope zu
    window.fetchNews = fetchNews;
    window.fetchEvents = fetchEvents;
    window.showToast = showToast;
    window.confirmAction = confirmAction;
});*/

//KOMBINIERT
/*
// Tab-Funktionalität verbessern
document.addEventListener('DOMContentLoaded', function() {
    // Tab-Wechsel-Funktionalität
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Aktive Klasse von allen Tabs entfernen
            tabs.forEach(t => t.classList.remove('active'));
            
            // Aktive Klasse dem angeklickten Tab hinzufügen
            this.classList.add('active');
            
            // Alle Content-Sections verstecken
            const contentSections = document.querySelectorAll('.content-section');
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Entsprechende Content-Section anzeigen
            const targetId = `${this.dataset.tab}-section`;
            document.getElementById(targetId).classList.add('active');
            setupMediaInput();
        });
    });
    

    async function cancelEdit() {
        document.getElementById("entryForm").reset();
        document.getElementById("entry-id").value = "";
        document.getElementById("existing-media").innerHTML = "";
        document.getElementById("cancel-edit-btn").style.display = "none";
        
        // Hier das Zurücksetzen des Media-Inputs und der Vorschau ergänzen
        clearFileInput();
    }
    
    // Verbesserte Type-Selector Funktionalität für News/Events
    const typeOptions = document.querySelectorAll('.type-option');
    typeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Aktive Klasse von allen Optionen entfernen
            typeOptions.forEach(o => o.classList.remove('active'));
            
            // Aktive Klasse der angeklickten Option hinzufügen
            this.classList.add('active');
            
            // Typ-Wert setzen
            const type = this.dataset.type;
            document.getElementById('entry-type').value = type;
            
            // Event-spezifische Felder anzeigen/verstecken
            document.getElementById('event-fields').style.display = 
                type === 'event' ? 'block' : 'none';
        });
    });

    // Media-Uploader Drag & Drop Funktionalität
    const mediaUploader = document.getElementById('media-uploader');
    const mediaInput = document.getElementById('media');
    
    // Datei-Auswahl beim Klicken
    mediaUploader.addEventListener('click', () => {
        mediaInput.click();
    });
    
    // Drag & Drop Funktionalität
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        mediaUploader.classList.add('highlight');
        mediaUploader.style.borderColor = 'var(--primary)';
        mediaUploader.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    }
    
    function unhighlight() {
        mediaUploader.classList.remove('highlight');
        mediaUploader.style.borderColor = 'var(--light-gray)';
        mediaUploader.style.backgroundColor = '';
    }
    
    mediaUploader.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
    
        // Ergänze neue Dateien zur bestehenden Auswahl
        window.currentMediaFiles = (window.currentMediaFiles || []).concat(Array.from(files));
    
        // Optional: Duplikate entfernen (Dateiname & Größe)
        window.currentMediaFiles = window.currentMediaFiles.filter((file, index, self) =>
            index === self.findIndex(f =>
                f.name === file.name &&
                f.size === file.size &&
                f.lastModified === file.lastModified
            )
        );
    
        // Erstelle ein neues FileList-Objekt für das Input-Feld
        const dataTransfer = new DataTransfer();
        window.currentMediaFiles.forEach(file => dataTransfer.items.add(file));
        mediaInput.files = dataTransfer.files;
    
        // Aktualisiere die Vorschau
        displayFilePreview(window.currentMediaFiles);
    }
    
    
    // Zeige Vorschaubilder der ausgewählten Dateien (auch bei normaler Dateiauswahl)
    mediaInput.addEventListener('change', function(e) {
        // Wenn keine neuen Dateien ausgewählt wurden (z.B. "Abbrechen"), NICHTS tun!
        if (!this.files || this.files.length === 0) {
            // Zeige weiterhin die aktuelle Vorschau
            displayFilePreview(window.currentMediaFiles || []);
            return;
        }
    
        // Ergänze neue Dateien zur bestehenden Auswahl
        const newFiles = Array.from(this.files);
        window.currentMediaFiles = (window.currentMediaFiles || []).concat(newFiles);
    
        // Optional: Duplikate entfernen (Dateiname & Größe)
        window.currentMediaFiles = window.currentMediaFiles.filter((file, index, self) =>
            index === self.findIndex(f =>
                f.name === file.name &&
                f.size === file.size &&
                f.lastModified === file.lastModified
            )
        );
    
        // Erstelle ein neues FileList-Objekt für das Input-Feld
        const dataTransfer = new DataTransfer();
        window.currentMediaFiles.forEach(file => dataTransfer.items.add(file));
        this.files = dataTransfer.files;
    
        // Aktualisiere die Vorschau
        displayFilePreview(window.currentMediaFiles);
    });
    
    
    function displayFilePreview(files) {
        const mediaUploader = document.getElementById('media-uploader');
        
        // Entferne vorhandene Vorschauen
        const existingPreview = mediaUploader.querySelector('.file-preview-container');
        if (existingPreview) {
            mediaUploader.removeChild(existingPreview);
        }
        
        if (!files || !files.length) {
            // Falls keine Dateien ausgewählt, verstecke den Clear-All Button
            const clearAllBtn = document.getElementById('clear-all-media-btn');
            if (clearAllBtn) clearAllBtn.style.display = 'none';
            return;
        }
        
        // Zeige den Clear-All Button
        const clearAllBtn = document.getElementById('clear-all-media-btn');
        if (clearAllBtn) clearAllBtn.style.display = 'block';
        
        const previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview-container';
        previewContainer.style.display = 'flex';
        previewContainer.style.flexWrap = 'wrap';
        previewContainer.style.gap = '10px';
        previewContainer.style.marginTop = '10px';
        
        // Wichtig: Aktualisiere die globale Variable
        window.currentMediaFiles = Array.from(files);
        
        window.currentMediaFiles.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';
            previewItem.style.position = 'relative';
            previewItem.style.width = '100px';
            previewItem.style.height = '100px';
            previewItem.style.overflow = 'hidden';
            previewItem.style.borderRadius = 'var(--border-radius)';
            previewItem.style.boxShadow = 'var(--shadow)';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.cursor = 'pointer'; // Zeige Cursor als Pointer für Klickbarkeit
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Vergrößerung bei Klick hinzufügen
                img.addEventListener('click', function(e) {
                    e.stopPropagation(); // Wichtig: Verhindert Blasen des Events zum Uploader
                    
                    // Erstelle ein Modal für die vergrößerte Ansicht
                    const modal = document.createElement('div');
                    modal.style.position = 'fixed';
                    modal.style.top = '0';
                    modal.style.left = '0';
                    modal.style.width = '100%';
                    modal.style.height = '100%';
                    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    modal.style.display = 'flex';
                    modal.style.alignItems = 'center';
                    modal.style.justifyContent = 'center';
                    modal.style.zIndex = '9999';
                    modal.style.cursor = 'pointer';
                    
                    const enlargedImg = document.createElement('img');
                    enlargedImg.src = e.target.src;
                    enlargedImg.style.maxWidth = '90%';
                    enlargedImg.style.maxHeight = '90%';
                    enlargedImg.style.objectFit = 'contain';
                    
                    modal.appendChild(enlargedImg);
                    document.body.appendChild(modal);
                    
                    modal.addEventListener('click', function() {
                        document.body.removeChild(modal);
                    });
                });
                
                previewItem.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const videoIcon = document.createElement('div');
                videoIcon.innerHTML = '<i class="fas fa-video"></i>';
                videoIcon.style.width = '100%';
                videoIcon.style.height = '100%';
                videoIcon.style.display = 'flex';
                videoIcon.style.alignItems = 'center';
                videoIcon.style.justifyContent = 'center';
                videoIcon.style.fontSize = '2rem';
                videoIcon.style.backgroundColor = '#f8f9fa';
                videoIcon.style.color = 'var(--primary)';
                videoIcon.style.cursor = 'pointer';
                
                // Vergrößerung bei Klick für Videos
                videoIcon.addEventListener('click', function(e) {
                    e.stopPropagation(); // Verhindert Blasen des Events zum Uploader
                    
                    const modal = document.createElement('div');
                    modal.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
        `;
                 
                    const closeBtn = document.createElement('button');
                    closeBtn.innerHTML = '×';
                    closeBtn.style.cssText = `
            position: absolute; top: 20px; right: 20px;
            background: transparent; border: none;
            font-size: 30px; color: white; cursor: pointer;
        `;
                  
                    
                    const previewVideo = document.createElement('video');
previewVideo.controls = true;
previewVideo.autoplay = true;
previewVideo.playsInline = true;
previewVideo.style.maxWidth = '90%';
previewVideo.style.maxHeight = '80%';

const objectURL = URL.createObjectURL(file);
previewVideo.src = objectURL;
previewVideo.onloadedmetadata = () => {
    previewVideo.play().catch(() => {});
};


modal.appendChild(previewVideo);

        modal.appendChild(closeBtn);
        document.body.appendChild(modal);

        closeBtn.addEventListener('click', function() {
            URL.revokeObjectURL(objectURL); // Speicher freigeben
            document.body.removeChild(modal);
        });
        
    });
                
                previewItem.appendChild(videoIcon);
            }
            
            // Dateiname-Label
            const fileNameLabel = document.createElement('div');
            fileNameLabel.textContent = file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name;
            fileNameLabel.style.position = 'absolute';
            fileNameLabel.style.bottom = '0';
            fileNameLabel.style.left = '0';
            fileNameLabel.style.right = '0';
            fileNameLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            fileNameLabel.style.color = 'white';
            fileNameLabel.style.fontSize = '0.7rem';
            fileNameLabel.style.padding = '2px 4px';
            fileNameLabel.style.textOverflow = 'ellipsis';
            fileNameLabel.style.overflow = 'hidden';
            fileNameLabel.style.whiteSpace = 'nowrap';
            
            // Entfernen-Button für einzelne Dateien
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.innerHTML = '×';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '0';
            removeBtn.style.right = '0';
            removeBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '0 0 0 var(--border-radius)';
            removeBtn.style.padding = '2px 6px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontSize = '12px';
            removeBtn.style.fontWeight = 'bold';
            removeBtn.title = 'Entfernen';
            
            // Event-Handler zum Entfernen einzelner Dateien
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Verhindert das Öffnen des File Explorers
                
                // Entferne diese Datei aus dem globalen Array
                window.currentMediaFiles.splice(index, 1);
                
                // Erstelle ein neues FileList-Objekt
                const dataTransfer = new DataTransfer();
                window.currentMediaFiles.forEach(file => dataTransfer.items.add(file));
                
                // Aktualisiere das Input-Feld und die Vorschau
                const mediaInput = document.getElementById('media');
                mediaInput.files = dataTransfer.files;
                
                // Aktualisiere die Vorschauanzeige
                displayFilePreview(window.currentMediaFiles);
            });
            
            previewItem.appendChild(fileNameLabel);
            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
        });
        
        mediaUploader.appendChild(previewContainer);
    }
// Hilfsfunktion zum Erstellen eines FileList-ähnlichen Objekts
function createFileList(fileArray) {
    const dataTransfer = new DataTransfer();
    fileArray.forEach(file => dataTransfer.items.add(file));
    return dataTransfer.files;
}

// Aktualisiert das File-Input mit einem neuen FileList
function updateFileInput(newFileList) {
    const mediaInput = document.getElementById('media');
    
    // Speichern der aktuellen Dateien global für spätere Verwendung
    window.currentMediaFiles = Array.from(newFileList);
    
    // Aktualisiere das Input-Feld
    mediaInput.files = newFileList;
    
    // Aktualisiere die Vorschau
    displayFilePreview(newFileList);
}


function clearFileInput() {
    const mediaInput = document.getElementById('media');
    mediaInput.value = '';
    
    // Zurücksetzen der gespeicherten Dateien in der globalen Variable
    window.currentMediaFiles = [];
    
    // Entferne vorhandene Vorschauen
    const mediaUploader = document.getElementById('media-uploader');
    const existingPreview = mediaUploader.querySelector('.file-preview-container');
    if (existingPreview) {
        mediaUploader.removeChild(existingPreview);
    }
    
    // Verstecke den Clear-All Button
    const clearAllBtn = document.getElementById('clear-all-media-btn');
    if (clearAllBtn) clearAllBtn.style.display = 'none';
}
function setupMediaInput() {
    const mediaInput = document.getElementById('media');
    const mediaUploader = document.getElementById('media-uploader');
    
    // Globale Variable für aktuelle Dateien
    window.currentMediaFiles = window.currentMediaFiles || [];   
    
    // Click-Ereignis für den Media-Uploader (verhindert Doppelklick-Probleme)
    mediaUploader.addEventListener('click', (e) => {
        // Klick in die Vorschauliste oder auf "Alle löschen"/Einzel-Entfernen ignorieren
        if (
            e.target.closest('.file-preview-container') ||
            e.target.id === 'clear-all-media-btn' ||
            e.target.closest('.media-remove')
        ) {
            return;
        }
        mediaInput.click();
    });
}

function setupMediaUploader() {
    const mediaUploader = document.getElementById('media-uploader');
    
    // Füge "Alle löschen"-Button hinzu, wenn er noch nicht existiert
    if (!document.getElementById('clear-all-media-btn')) {
        const clearAllButton = document.createElement('button');
        clearAllButton.id = 'clear-all-media-btn';
        clearAllButton.type = 'button';
        clearAllButton.className = 'btn btn-small btn-danger';
        clearAllButton.innerHTML = '<i class="fas fa-times"></i> Alle löschen';
        clearAllButton.style.display = 'none';  // Standardmäßig versteckt
        clearAllButton.style.position = 'absolute';
        clearAllButton.style.top = '10px';
        clearAllButton.style.right = '10px';
        clearAllButton.style.zIndex = '5';
        
        clearAllButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Verhindert, dass der Click-Event zum Uploader durchgereicht wird
            clearFileInput();
        });
        
        mediaUploader.style.position = 'relative'; // Wichtig für absolute Positionierung des Buttons
        mediaUploader.appendChild(clearAllButton);
    }
}

setupMediaUploader();

const entryTypeSelect = document.getElementById("entry-type");
        const eventFields = document.getElementById("event-fields");
      
        entryTypeSelect.addEventListener("change", () => {
          if (entryTypeSelect.value === "event") {
            eventFields.style.display = "block";
          } else {
            eventFields.style.display = "none";
          }
        });

 
        function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
        // Logout-Button
        document.getElementById("logout-btn").addEventListener("click", async () => {
            await fetch("/admin-logout", { method: "POST" });
            window.location.href = "/admin.html";
        });

    // Verbesserte Darstellung der News- und Event-Listen
    async function fetchNews() {
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/news?cb=${cacheBuster}`);
            if (!response.ok) throw new Error("Fehler beim Abrufen der News");
            const news = await response.json();
            const newsList = document.getElementById("news-list");
            newsList.innerHTML = "";

            if (news.length === 0) {
                showEmptyState(newsList, "Keine News vorhanden", "newspaper");
                return;
            }

            news.forEach(item => {
                const card = createItemCard(item, 'news');
                newsList.appendChild(card);
            });
        } catch (error) {
            console.error("Fehler beim Abrufen der News:", error);
            const newsList = document.getElementById("news-list");
            showErrorState(newsList, "Fehler beim Laden der News");
        }
    }

    async function fetchEvents() {
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/events?cb=${cacheBuster}`);
            if (!response.ok) throw new Error("Fehler beim Abrufen der Veranstaltungen");
            const events = await response.json();
            const eventsList = document.getElementById("events-list");
            eventsList.innerHTML = "";

            if (events.length === 0) {
                showEmptyState(eventsList, "Keine Veranstaltungen vorhanden", "calendar-alt");
                return;
            }

            events.forEach(item => {
                const card = createItemCard(item, 'event');
                eventsList.appendChild(card);
            });
        } catch (error) {
            console.error("Fehler beim Abrufen der Veranstaltungen:", error);
            const eventsList = document.getElementById("events-list");
            showErrorState(eventsList, "Fehler beim Laden der Veranstaltungen");
        }
    }

    function createItemCard(item, type) {
        const card = document.createElement('div');
        card.style.cursor = 'pointer'; 
// === Detail-Modal bei Klick auf Karte ===
card.addEventListener('click', () => {
    // Overlay
    const detailModal = document.createElement('div');
    detailModal.style.cssText = `
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
    `;

    // Inhalt
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; padding: 20px;
        border-radius: 8px;
        max-width: 600px; max-height: 80%; overflow: auto;
        position: relative;
    `;
    modalContent.innerHTML = `
        <h2>${item.title}</h2>
        <p>${item.content}</p>
        ${type === 'event' && item.date ? `<p><strong>Datum:</strong> ${item.date} ${item.time || ''}</p>` : ''}
        ${type === 'event' && item.location ? `<p><strong>Ort:</strong> ${item.location}</p>` : ''}
    `;

    // Medien anhängen
    if (item.media && item.media.length) {
        item.media.forEach(src => {
            if (src.match(/\.(mp4|webm|ogg|mkv)$/i)) {
                const vid = document.createElement('video');
                vid.src = src;
                vid.controls = true;
                vid.style.cssText = 'max-width:100%; margin-top:10px;';
                modalContent.appendChild(vid);
            } else {
                const img = document.createElement('img');
                img.src = src;
                img.style.cssText = 'max-width:100%; margin-top:10px;';
                modalContent.appendChild(img);
            }
        });
    }

    // Close-Button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position: absolute; top: 10px; right: 10px;
        font-size: 24px; background: red;
        border: none; color: white; cursor: pointer;
    `;
    closeBtn.addEventListener('click', () => detailModal.remove());

    detailModal.appendChild(modalContent);
    detailModal.appendChild(closeBtn);
    document.body.appendChild(detailModal);
});


        card.className = 'item-card';
        
        // Mediendarstellung (falls vorhanden)
        if (item.media && item.media.length > 0) {
            const mediaUrl = item.media[0]; // Erstes Medium für Vorschau verwenden
            const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                          mediaUrl.toLowerCase().endsWith('.webm') ||
                          mediaUrl.toLowerCase().endsWith('.ogg') ||
                          mediaUrl.toLowerCase().endsWith('.mkv');
            
            if (isVideo) {
                const video = document.createElement('video');
                video.className = 'item-image';
                video.src = mediaUrl;
                video.muted = true;           // HIER hinzugefügt
                video.defaultMuted = true;    // HIER hinzugefügt
                video.volume = 0;             // HIER hinzugefügt
                video.playsInline = true;
                
                // Autoplay nur wenn sichtbar
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            video.play().catch(() => {});
                        } else {
                            video.pause();
                        }
                    });
                });
                observer.observe(video);
                
                card.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.className = 'item-image';
                img.src = mediaUrl;
                img.alt = item.title;
                card.appendChild(img);
            }
        } else {
            // Placeholder falls kein Medium vorhanden
            const placeholderDiv = document.createElement('div');
            placeholderDiv.className = 'item-image';
            placeholderDiv.style.display = 'flex';
            placeholderDiv.style.alignItems = 'center';
            placeholderDiv.style.justifyContent = 'center';
            placeholderDiv.style.backgroundColor = 'var(--light-gray)';
            
            const icon = document.createElement('i');
            icon.className = type === 'event' ? 'far fa-calendar-alt fa-3x' : 'far fa-newspaper fa-3x';
            icon.style.color = 'var(--gray)';
            
            placeholderDiv.appendChild(icon);
            card.appendChild(placeholderDiv);
        }
        
        // Inhalt
        const content = document.createElement('div');
        content.className = 'item-content';
        
        const title = document.createElement('h3');
        title.className = 'item-title';
        title.textContent = item.title;
        content.appendChild(title);
        
        const text = document.createElement('p');
        text.className = 'item-text';
        text.textContent = item.content;
        content.appendChild(text);
        
        // Details für Events
        if (type === 'event') {
            const details = document.createElement('div');
            details.className = 'item-details';
            
            if (item.date) {
                const dateDetail = document.createElement('div');
                dateDetail.className = 'item-detail';
                dateDetail.innerHTML = `<i class="far fa-calendar"></i> ${item.date}${item.time ? ' ' + item.time + ' Uhr' : ''}`;
                details.appendChild(dateDetail);
            }
            
            if (item.location) {
                const locationDetail = document.createElement('div');
                locationDetail.className = 'item-detail';
                locationDetail.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${item.location}`;
                details.appendChild(locationDetail);
            }
            
            content.appendChild(details);
        }
        
        // Zeitstempel
        const timestamp = document.createElement('div');
        timestamp.className = 'item-timestamp';
        timestamp.innerHTML = `Erstellt am: ${item.createdAt}` +
            (item.updatedAt && item.updatedAt !== item.createdAt ? ` | Bearbeitet am: ${item.updatedAt}` : "");
        content.appendChild(timestamp);
        
        // Aktionen
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary btn-small';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Bearbeiten';
        editBtn.addEventListener('click', () => {
            if (type === 'event') {
                editEvent(item.id);
            } else {
                editNews(item.id);
            }
        });
        actions.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Löschen';
        deleteBtn.addEventListener('click', () => {
         //   if (confirm(`Möchten Sie diesen ${type === 'event' ? 'Veranstaltung' : 'News'}-Eintrag wirklich löschen?`)) {
                if (type === 'event') {
                    deleteEvent(item.id);
                } else {
                    deleteNews(item.id);
                }
        //    }
        });
        actions.appendChild(deleteBtn);
        
        content.appendChild(actions);
        card.appendChild(content);
        
        return card;
    }

    function showEmptyState(container, message, iconName) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="far fa-${iconName}"></i>
            <h3>${message}</h3>
            <p>Erstellen Sie neue Inhalte über den "Erstellen / Bearbeiten" Tab.</p>
        `;
        container.appendChild(emptyState);
    }

    function showErrorState(container, message) {
        const errorState = document.createElement('div');
        errorState.className = 'empty-state';
        errorState.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
            <h3>${message}</h3>
            <p>Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator.</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Neu laden
            </button>
        `;
        container.appendChild(errorState);
    }

    // Verbesserte Toast-Nachrichten für Benutzer-Feedback
    function showToast(message, type = 'success') {
        // Entferne bestehende Toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            document.body.removeChild(toast);
        });
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.minWidth = '250px';
        toast.style.padding = '15px 20px';
        toast.style.borderRadius = 'var(--border-radius)';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        toast.style.zIndex = '1000';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';
        toast.style.animation = 'fadeIn 0.3s, fadeOut 0.3s 3.7s';
        toast.style.backgroundColor = type === 'success' ? 'var(--secondary)' : 'var(--danger)';
        toast.style.color = 'white';
        
        toast.innerHTML = `
            <span style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${message}
            </span>
            <i class="fas fa-times" style="cursor: pointer;"></i>
        `;
        
        document.body.appendChild(toast);
        
        // Close button functionality
        toast.querySelector('.fa-times').addEventListener('click', () => {
            document.body.removeChild(toast);
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }

    // Füge CSS für Toast-Animationen hinzu
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
    `;
    document.head.appendChild(style);

    // Verbesserte Bestätigungsdialoge
    function confirmAction(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1001';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.style.backgroundColor = 'white';
        dialog.style.borderRadius = 'var(--border-radius)';
        dialog.style.padding = '20px';
        dialog.style.boxShadow = 'var(--shadow)';
        dialog.style.width = '90%';
        dialog.style.maxWidth = '400px';
        dialog.style.animation = 'scaleIn 0.3s';
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--dark);">${message}</h3>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button class="btn btn-secondary btn-cancel">Abbrechen</button>
                <button class="btn btn-danger btn-confirm">Bestätigen</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Füge CSS für Dialog-Animation hinzu
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Button event listeners
        dialog.querySelector('.btn-cancel').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        });
        
        dialog.querySelector('.btn-confirm').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });
    }

    // Override der existierenden Funktionen mit verbesserter UI
    window.deleteNews = function(id) {
        confirmAction('Möchten Sie diesen News-Eintrag wirklich löschen?', async () => {
            try {
                const response = await fetch(`/news/${id}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Fehler beim Löschen der News");
                
                await fetchNews();
                showToast('News erfolgreich gelöscht', 'success');
            } catch (error) {
                console.error("Fehler beim Löschen der News:", error);
                showToast('Fehler beim Löschen der News', 'error');
            }
        });
    };
    
    window.deleteEvent = function(id) {
        confirmAction('Möchten Sie diese Veranstaltung wirklich löschen?', async () => {
            try {
                const response = await fetch(`/events/${id}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Fehler beim Löschen der Veranstaltung");
                
                await fetchEvents();
                showToast('Veranstaltung erfolgreich gelöscht', 'success');
            } catch (error) {
                console.error("Fehler beim Löschen der Veranstaltung:", error);
                showToast('Fehler beim Löschen der Veranstaltung', 'error');
            }
        });
    };

    async function editEvent(id) {
        try {
          // Wechsle zuerst zum Erstellen-Tab
          const createTab = document.querySelector('.tab[data-tab="create"]');
          if (createTab) {
            createTab.click();
          }
          
          const response = await fetch(`/events/${id}`);
          if (!response.ok) throw new Error("Fehler beim Abrufen der Veranstaltung");
          const eventItem = await response.json();
      
          // Formular mit den Event-Daten füllen
          document.getElementById("entry-id").value = eventItem.id;
          document.getElementById("title").value = eventItem.title;
          document.getElementById("content").value = eventItem.content;
          
          // Setze den Typ auf "event" und zeige event-spezifische Felder an
          document.getElementById("entry-type").value = "event";
          document.getElementById("event-fields").style.display = "block";
          document.getElementById("event-date").value = eventItem.date || "";
          document.getElementById("event-time").value = eventItem.time || "";
          document.getElementById("event-location").value = eventItem.location || "";
          
          // Vorhandene Medien anzeigen
          const existingMediaDiv = document.getElementById("existing-media");
          existingMediaDiv.innerHTML = "";
          
          // Erstelle einen Container für die Medien mit Flexbox
          const mediaContainer = document.createElement('div');
          mediaContainer.style.display = 'flex';
          mediaContainer.style.flexWrap = 'wrap';
          mediaContainer.style.gap = '15px';
          existingMediaDiv.appendChild(mediaContainer);
          
          if (eventItem.media && eventItem.media.length > 0) {
            eventItem.media.forEach((mediaUrl, index) => {
              const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                              mediaUrl.toLowerCase().endsWith('.webm') ||
                              mediaUrl.toLowerCase().endsWith('.ogg') ||
                              mediaUrl.toLowerCase().endsWith('.mkv');
              
              // Container für jedes Medien-Element
              const mediaItemContainer = document.createElement('div');
              mediaItemContainer.style.position = 'relative';
              mediaItemContainer.style.width = '200px';
              mediaItemContainer.style.marginBottom = '15px';
              
              let mediaElement;
              if (isVideo) {
                mediaElement = document.createElement('video');
                mediaElement.src = mediaUrl;
                mediaElement.width = 200;
                mediaElement.height = 150;
                mediaElement.controls = true;
              } else {
                mediaElement = document.createElement('img');
                mediaElement.src = mediaUrl;
                mediaElement.alt = "Bild";
                mediaElement.style.width = '100%';
                mediaElement.style.height = 'auto';
                mediaElement.style.maxHeight = '150px';
                mediaElement.style.objectFit = 'cover';
              }
              
              // Erstelle einen Button zum Entfernen des Mediums
              const removeButton = document.createElement('button');
              removeButton.textContent = 'Entfernen';
              removeButton.style.marginTop = '5px';
              removeButton.style.width = '100%';
              removeButton.classList.add('remove-existing-media-btn');
              removeButton.dataset.mediaIndex = index;
              removeButton.addEventListener('click', debounce(function() {
                removeExistingMediaEvent(eventItem.id, index);
              }, 300));
              
              mediaItemContainer.appendChild(mediaElement);
              mediaItemContainer.appendChild(removeButton);
              mediaContainer.appendChild(mediaItemContainer);
            });
          }
          
          document.getElementById("cancel-edit-btn").style.display = "inline-block";
          document.getElementById("cancel-edit-btn").addEventListener('click', function() {
            cancelEdit();
          });
        } catch (error) {
          console.error("Fehler beim Abrufen der Veranstaltung:", error);
          showToast('Fehler beim Abrufen der Veranstaltung', 'error');
        }
      }


async function removeExistingMediaEvent(eventId, mediaIndex) {
    confirmAction('Möchten Sie dieses Medium wirklich entfernen?', async () => {
    // Deaktiviere vorübergehend alle Buttons, um doppelte Klicks zu vermeiden
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
    
    try {
        const response = await fetch(`/events/${eventId}/media/${mediaIndex}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Fehler beim Entfernen des Mediums");
        
        const result = await response.json();
        console.log("Delete response:", result);
        
        // Kleine Verzögerung, damit die Änderung sichtbar wird
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Aktualisiere die Anzeige: sowohl die Event-Liste als auch das Bearbeitungsformular
        await fetchEvents();
        await editEvent(eventId);
    } catch (error) {
        console.error("Fehler beim Entfernen des Mediums:", error);
        alert("Fehler beim Löschen: " + error.message);
    } finally {
        // Reaktiviere alle Buttons
        buttons.forEach(btn => btn.disabled = false);
    }
});
}


            async function editNews(id) {
                try {
                  // Wechsle zuerst zum Erstellen-Tab
                  const createTab = document.querySelector('.tab[data-tab="create"]');
                  if (createTab) {
                    createTab.click();
                  }
                  
                  const response = await fetch(`/news/${id}`);
                  if (!response.ok) throw new Error("Fehler beim Abrufen der News");
                  const newsItem = await response.json();
              
                  document.getElementById("entry-id").value = newsItem.id;
                  document.getElementById("title").value = newsItem.title;
                  document.getElementById("content").value = newsItem.content;
                  
                  // Setze den Typ auf "news"
                  document.getElementById("entry-type").value = "news";
                  document.getElementById("event-fields").style.display = "none";
              
                  // Vorhandene Medien anzeigen
                  const existingMediaDiv = document.getElementById("existing-media");
                  existingMediaDiv.innerHTML = ''; // Clear existing media
                  
                  // Erstelle einen Container für die Medien mit Flexbox
                  const mediaContainer = document.createElement('div');
                  mediaContainer.style.display = 'flex';
                  mediaContainer.style.flexWrap = 'wrap';
                  mediaContainer.style.gap = '15px';
                  existingMediaDiv.appendChild(mediaContainer);
                  
                  if (newsItem.media && newsItem.media.length > 0) {
                    newsItem.media.forEach((mediaUrl, index) => {
                      const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                        mediaUrl.toLowerCase().endsWith('.webm') ||
                        mediaUrl.toLowerCase().endsWith('.ogg') ||
                        mediaUrl.toLowerCase().endsWith('.mkv');
              
                      // Container für jedes Medien-Element
                      const mediaItemContainer = document.createElement('div');
                      mediaItemContainer.style.position = 'relative';
                      mediaItemContainer.style.width = '200px';
                      mediaItemContainer.style.marginBottom = '15px';
              
                      let mediaElement;
                      if (isVideo) {
                        mediaElement = document.createElement('video');
                        mediaElement.src = mediaUrl;
                        mediaElement.width = 200;
                        mediaElement.height = 150;
                        mediaElement.controls = true;
                      } else {
                        mediaElement = document.createElement('img');
                        mediaElement.src = mediaUrl;
                        mediaElement.alt = "Bild";
                        mediaElement.style.width = '100%';
                        mediaElement.style.height = 'auto';
                        mediaElement.style.maxHeight = '150px';
                        mediaElement.style.objectFit = 'cover';
                      }
              
                      const removeButton = document.createElement('button');
                      removeButton.textContent = 'Entfernen';
                      removeButton.style.marginTop = '5px';
                      removeButton.style.width = '100%';
                      removeButton.classList.add('remove-existing-media-btn');
                      removeButton.dataset.mediaIndex = index;
                      removeButton.addEventListener('click', debounce(function() {
                        removeExistingMedia(newsItem.id, index);
                      }, 300)); // 300ms delay
              
                      mediaItemContainer.appendChild(mediaElement);
                      mediaItemContainer.appendChild(removeButton);
                      mediaContainer.appendChild(mediaItemContainer);
                    });
                  }
                  
                  document.getElementById("cancel-edit-btn").style.display = "inline-block";
                  document.getElementById("cancel-edit-btn").addEventListener('click', function() {
                    cancelEdit();
                  });
                } catch (error) {
                  console.error("Fehler beim Abrufen der News:", error);
                  showToast('Fehler beim Abrufen der News', 'error');
                }
              }

        async function removeExistingMedia(newsId, mediaIndex) {
            confirmAction('Möchten Sie dieses Medium wirklich entfernen?', async () => {
  // Disable all buttons during operation
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = true);
  
  try {
    const response = await fetch(`/news/${newsId}/media/${mediaIndex}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Fehler beim Entfernen des Mediums");
    
    const result = await response.json();
    console.log("Delete response:", result);
    
    // Add a small delay before reloading
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await fetchNews();
    await editNews(newsId);
  } catch (error) {
    console.error("Fehler beim Entfernen des Mediums:", error);
    alert("Fehler beim Löschen: " + error.message);
  } finally {
    // Re-enable all buttons when done
    buttons.forEach(btn => btn.disabled = false);
  }
});
}


        async function cancelEdit() {
            document.getElementById("entryForm").reset();
            document.getElementById("entry-id").value = "";
            document.getElementById("existing-media").innerHTML = "";
            document.getElementById("cancel-edit-btn").style.display = "none";
        }

        document.getElementById("entryForm").addEventListener("submit", async function(event) {
            event.preventDefault();
    // Show upload overlay
    const overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(255,255,255,0.8)";
    overlay.style.backdropFilter = "blur(5px)";
    overlay.style.zIndex = 1000;
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    // Spinner
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    spinner.style.border = "4px solid #f3f3f3";
    spinner.style.borderTop = "4px solid #3498db";
    spinner.style.borderRadius = "50%";
    spinner.style.width = "50px";
    spinner.style.height = "50px";
    spinner.style.animation = "spin 1s linear infinite";
    spinner.style.marginBottom = "1rem";

    // Message with more detailed progress information
    const message = document.createElement("p");
    message.id = "upload-message";
    message.textContent = "Vorbereitung zum Hochladen...";

    // Progress element for large uploads
    const progressContainer = document.createElement("div");
    progressContainer.style.width = "80%";
    progressContainer.style.maxWidth = "400px";
    progressContainer.style.marginTop = "10px";
    
    const progressBar = document.createElement("div");
    progressBar.id = "upload-progress";
    progressBar.style.width = "100%";
    progressBar.style.height = "20px";
    progressBar.style.backgroundColor = "#f3f3f3";
    progressBar.style.borderRadius = "10px";
    progressBar.style.overflow = "hidden";
    
    const progressFill = document.createElement("div");
    progressFill.id = "progress-fill";
    progressFill.style.width = "0%";
    progressFill.style.height = "100%";
    progressFill.style.backgroundColor = "#4CAF50";
    progressFill.style.transition = "width 0.3s";
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    // Add elements to overlay
    overlay.appendChild(spinner);
    overlay.appendChild(message);
    overlay.appendChild(progressContainer);
    document.body.appendChild(overlay);

    // Update progress function (can be called from outside)
    window.updateUploadProgress = function(percent, statusText) {
        const fill = document.getElementById("progress-fill");
        const msg = document.getElementById("upload-message");
        if (fill) fill.style.width = percent + "%";
        if (msg && statusText) msg.textContent = statusText;
    };

    const id = document.getElementById("entry-id").value;
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const mediaFiles = document.getElementById("media").files;
    const entryType = document.getElementById("entry-type").value;

    if (!title || !content) {
        alert("Bitte Titel und Inhalt eingeben!");
        document.body.removeChild(overlay);
        return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    
    // Falls es eine Veranstaltung ist, hänge zusätzliche Felder an
    if (entryType === "event") {
        formData.append("date", document.getElementById("event-date").value);
        formData.append("time", document.getElementById("event-time").value);
        formData.append("location", document.getElementById("event-location").value);
    }
    // If there are large files, update the message
    let totalSize = 0;
    for (const file of mediaFiles) {
        formData.append("media", file);
        totalSize += file.size;
        console.log(`📂 Datei hinzugefügt: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
    if (totalSize > 50 * 1024 * 1024) { // If total size > 50MB
        window.updateUploadProgress(0, `Große Dateien erkannt (${(totalSize / (1024 * 1024)).toFixed(2)} MB). Das Hochladen kann einige Minuten dauern...`);
    }
    // Bestimme Endpunkt und Methode basierend auf Typ und ID
    let uploadMethod = id ? "PUT" : "POST";
    let uploadUrl;
    if (entryType === "news") {
        uploadUrl = id ? `/news/${id}` : "/news";
    } else {
        uploadUrl = id ? `/events/${id}` : "/events";
    }
    try {
        // Starte den Timer für den Upload
        const startTime = Date.now();
        let uploadTimer = null;
        if (totalSize > 20 * 1024 * 1024) {
            let seconds = 0;
            uploadTimer = setInterval(() => {
                seconds += 1;
                const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(0);
                window.updateUploadProgress(
                    Math.min(95, Math.floor(seconds * 3)),
                    `Upload läuft seit ${elapsedTime} Sekunden. Bitte warten...`
                );
            }, 1000);
        }
        
        // Perform the actual upload
        const response = await fetch(uploadUrl, {
            method: uploadMethod,
            body: formData
        });
        
        // Clear timer if set
        if (uploadTimer) clearInterval(uploadTimer);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error: ${errorText}`);
        }

        // Update progress to 100%
        window.updateUploadProgress(100, "✅ Upload erfolgreich abgeschlossen!");
        
        console.log("✅ News erfolgreich gespeichert!");
        document.getElementById("entryForm").reset();
        document.getElementById("entry-type").value = "news";
        document.getElementById("event-fields").style.display = "none";
        document.getElementById("entry-id").value = "";
        document.getElementById("existing-media").innerHTML = "";
        document.getElementById("cancel-edit-btn").style.display = "none";

        clearFileInput();
        const clearBtn = document.getElementById('clear-media-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        
        // Small delay to show 100% completion before refreshing
        setTimeout(async () => {
            await fetchNews();
            await fetchEvents();

            // Wechsle zum entsprechenden Tab basierend auf dem Typ des erstellten Eintrags
            const targetTab = document.querySelector(`.tab[data-tab="${entryType === 'event' ? 'events' : 'news'}"]`);
            if (targetTab) {
                targetTab.click();
            }

            document.body.removeChild(overlay);
        }, 500);
    } catch (error) {
        console.error("❌ Fehler beim Speichern der News:", error);
        window.updateUploadProgress(0, `❌ Fehler: ${error.message}`);
        
        // Keep the error visible for a moment before removing overlay
        setTimeout(() => {
            document.body.removeChild(overlay);
            alert(`Fehler beim Speichern der News: ${error.message}`);
        }, 2000);
    }
});


    // Initialisierung
    fetchNews();
    fetchEvents();
    
    // Weise die verbesserten Funktionen dem globalen Scope zu
    window.fetchNews = fetchNews;
    window.fetchEvents = fetchEvents;
    window.showToast = showToast;
    window.confirmAction = confirmAction;
});
*/

// von neuer ai: 
// Tab-Funktionalität verbessern
document.addEventListener('DOMContentLoaded', function() {
    // Tab-Wechsel-Funktionalität
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Aktive Klasse von allen Tabs entfernen
            tabs.forEach(t => t.classList.remove('active'));
            
            // Aktive Klasse dem angeklickten Tab hinzufügen
            this.classList.add('active');
            
            // Alle Content-Sections verstecken
            const contentSections = document.querySelectorAll('.content-section');
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Entsprechende Content-Section anzeigen
            const targetId = `${this.dataset.tab}-section`;
            document.getElementById(targetId).classList.add('active');
            setupMediaInput();
        });
    });
    

    async function cancelEdit() {
        document.getElementById("entryForm").reset();
        document.getElementById("entry-id").value = "";
        document.getElementById("existing-media").innerHTML = "";
        document.getElementById("cancel-edit-btn").style.display = "none";
        
        // Hier das Zurücksetzen des Media-Inputs und der Vorschau ergänzen
        clearFileInput();
    }
    
    // Verbesserte Type-Selector Funktionalität für News/Events
    const typeOptions = document.querySelectorAll('.type-option');
    typeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Aktive Klasse von allen Optionen entfernen
            typeOptions.forEach(o => o.classList.remove('active'));
            
            // Aktive Klasse der angeklickten Option hinzufügen
            this.classList.add('active');
            
            // Typ-Wert setzen
            const type = this.dataset.type;
            document.getElementById('entry-type').value = type;
            
            // Event-spezifische Felder anzeigen/verstecken
            document.getElementById('event-fields').style.display = 
                type === 'event' ? 'block' : 'none';
        });
    });

    // Media-Uploader Drag & Drop Funktionalität
    const mediaUploader = document.getElementById('media-uploader');
    const mediaInput = document.getElementById('media');
    
    // FIX 1: Variable zur Verfolgung des Datei-Explorer-Status
    let fileExplorerOpen = false;
    
    // Datei-Auswahl beim Klicken
    mediaUploader.addEventListener('click', (e) => {
        // FIX 1: Verhindern, dass der File Explorer erneut geöffnet wird, wenn er bereits offen ist
        if (fileExplorerOpen) return;
        
        // FIX 1: Datei-Explorer-Status setzen
        fileExplorerOpen = true;
        mediaInput.click();
        
        // FIX 1: Status nach kurzer Verzögerung zurücksetzen
        setTimeout(() => {
            fileExplorerOpen = false;
        }, 1000);
    });
    
    // Drag & Drop Funktionalität
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        mediaUploader.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        mediaUploader.classList.add('highlight');
        mediaUploader.style.borderColor = 'var(--primary)';
        mediaUploader.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    }
    
    function unhighlight() {
        mediaUploader.classList.remove('highlight');
        mediaUploader.style.borderColor = 'var(--light-gray)';
        mediaUploader.style.backgroundColor = '';
    }
    
    mediaUploader.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
    
        // Ergänze neue Dateien zur bestehenden Auswahl
        window.currentMediaFiles = (window.currentMediaFiles || []).concat(Array.from(files));
    
        // Optional: Duplikate entfernen (Dateiname & Größe)
        window.currentMediaFiles = window.currentMediaFiles.filter((file, index, self) =>
            index === self.findIndex(f =>
                f.name === file.name &&
                f.size === file.size &&
                f.lastModified === file.lastModified
            )
        );
    
        // Erstelle ein neues FileList-Objekt für das Input-Feld
        const dataTransfer = new DataTransfer();
        window.currentMediaFiles.forEach(file => dataTransfer.items.add(file));
        mediaInput.files = dataTransfer.files;
    
        // Aktualisiere die Vorschau
        displayFilePreview(window.currentMediaFiles);
    }
    
    
    // Zeige Vorschaubilder der ausgewählten Dateien (auch bei normaler Dateiauswahl)
    // Fix for the file explorer reopening issue
    let isHandlingChange = false;
    mediaInput.addEventListener('change', function(e) {
        if (isHandlingChange) return;
        isHandlingChange = true;

        // If no new files were selected, maintain current files
        if (!this.files || this.files.length === 0) {
            // restore input.files from window.currentMediaFiles
           const dt = new DataTransfer();
           (window.currentMediaFiles || []).forEach(f => dt.items.add(f));
           this.files = dt.files;
            displayFilePreview(window.currentMediaFiles || []);
            isHandlingChange = false;
            return;
        }

        // Add new files to existing selection
        const newFiles = Array.from(this.files);
        window.currentMediaFiles = (window.currentMediaFiles || []).concat(newFiles);

        // Remove duplicates
        window.currentMediaFiles = window.currentMediaFiles.filter((file, index, self) =>
            index === self.findIndex(f =>
                f.name === file.name &&
                f.size === file.size &&
                f.lastModified === file.lastModified
            )
        );

        // Update the input's FileList
        const dataTransfer = new DataTransfer();
        window.currentMediaFiles.forEach(file => dataTransfer.items.add(file));
        this.files = dataTransfer.files;

        // Update preview
        displayFilePreview(window.currentMediaFiles);
        
        // Reset the handling flag after a short delay
        setTimeout(() => {
            isHandlingChange = false;
        }, 100);
    });
    
    
    function displayFilePreview(files) {
        const mediaUploader = document.getElementById('media-uploader');
        
        // Entferne vorhandene Vorschauen
        const existingPreview = mediaUploader.querySelector('.file-preview-container');
        if (existingPreview) {
            mediaUploader.removeChild(existingPreview);
        }
        
        if (!files || !files.length) {
            // Falls keine Dateien ausgewählt, verstecke den Clear-All Button
            const clearAllBtn = document.getElementById('clear-all-media-btn');
            if (clearAllBtn) clearAllBtn.style.display = 'none';
            return;
        }
        
        // Zeige den Clear-All Button
        const clearAllBtn = document.getElementById('clear-all-media-btn');
        if (clearAllBtn) clearAllBtn.style.display = 'block';
        
        const previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview-container';
        previewContainer.style.display = 'flex';
        previewContainer.style.flexWrap = 'wrap';
        previewContainer.style.gap = '10px';
        previewContainer.style.marginTop = '10px';
        
        // Wichtig: Aktualisiere die globale Variable
        window.currentMediaFiles = Array.from(files);
        
        window.currentMediaFiles.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';
            previewItem.style.position = 'relative';
            previewItem.style.width = '100px';
            previewItem.style.height = '100px';
            previewItem.style.overflow = 'hidden';
            previewItem.style.borderRadius = 'var(--border-radius)';
            previewItem.style.boxShadow = 'var(--shadow)';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.cursor = 'pointer'; // Zeige Cursor als Pointer für Klickbarkeit
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Vergrößerung bei Klick hinzufügen
                img.addEventListener('click', function(e) {
                    e.stopPropagation(); // Wichtig: Verhindert Blasen des Events zum Uploader
                    
                    // Erstelle ein Modal für die vergrößerte Ansicht
                    const modal = document.createElement('div');
                    modal.style.position = 'fixed';
                    modal.style.top = '0';
                    modal.style.left = '0';
                    modal.style.width = '100%';
                    modal.style.height = '100%';
                    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    modal.style.display = 'flex';
                    modal.style.alignItems = 'center';
                    modal.style.justifyContent = 'center';
                    modal.style.zIndex = '9999';
                    modal.style.cursor = 'pointer';
                    
                    const enlargedImg = document.createElement('img');
                    enlargedImg.src = e.target.src;
                    enlargedImg.style.maxWidth = '90%';
                    enlargedImg.style.maxHeight = '90%';
                    enlargedImg.style.objectFit = 'contain';
                    
                    modal.appendChild(enlargedImg);
                    document.body.appendChild(modal);
                    
                    modal.addEventListener('click', function() {
                        document.body.removeChild(modal);
                    });
                });
                
                previewItem.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const videoIcon = document.createElement('div');
                videoIcon.innerHTML = '<i class="fas fa-video"></i>';
                videoIcon.style.width = '100%';
                videoIcon.style.height = '100%';
                videoIcon.style.display = 'flex';
                videoIcon.style.alignItems = 'center';
                videoIcon.style.justifyContent = 'center';
                videoIcon.style.fontSize = '2rem';
                videoIcon.style.backgroundColor = '#f8f9fa';
                videoIcon.style.color = 'var(--primary)';
                videoIcon.style.cursor = 'pointer';
                
                // Vergrößerung bei Klick für Videos
                videoIcon.addEventListener('click', function(e) {
                    e.stopPropagation(); // Verhindert Blasen des Events zum Uploader
                    
                    const modal = document.createElement('div');
                    modal.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
        `;
                    
                    const closeBtn = document.createElement('button');
                    closeBtn.innerHTML = '×';
                    closeBtn.style.cssText = `
            position: absolute; top: 20px; right: 20px;
            background: transparent; border: none;
            font-size: 30px; color: white; cursor: pointer;
        `;
                    
                    const previewVideo = document.createElement('video');
                    previewVideo.controls = true;
                    previewVideo.autoplay = true;
                    previewVideo.playsInline = true;
                    previewVideo.style.maxWidth = '90%';
                    previewVideo.style.maxHeight = '80%';

                    const objectURL = URL.createObjectURL(file);
                    previewVideo.src = objectURL;
                    previewVideo.onloadedmetadata = () => {
                        previewVideo.play().catch(() => {});
                    };

                    modal.appendChild(previewVideo);
                    modal.appendChild(closeBtn);
                    document.body.appendChild(modal);

                    closeBtn.addEventListener('click', function() {
                        URL.revokeObjectURL(objectURL); // Speicher freigeben
                        document.body.removeChild(modal);
                    });
                });
                
                previewItem.appendChild(videoIcon);
            }
            
            // Dateiname-Label
            const fileNameLabel = document.createElement('div');
            fileNameLabel.textContent = file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name;
            fileNameLabel.style.position = 'absolute';
            fileNameLabel.style.bottom = '0';
            fileNameLabel.style.left = '0';
            fileNameLabel.style.right = '0';
            fileNameLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            fileNameLabel.style.color = 'white';
            fileNameLabel.style.fontSize = '0.7rem';
            fileNameLabel.style.padding = '2px 4px';
            fileNameLabel.style.textOverflow = 'ellipsis';
            fileNameLabel.style.overflow = 'hidden';
            fileNameLabel.style.whiteSpace = 'nowrap';
            
            // Entfernen-Button für einzelne Dateien
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.innerHTML = '×';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '0';
            removeBtn.style.right = '0';
            removeBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '0 0 0 var(--border-radius)';
            removeBtn.style.padding = '2px 6px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontSize = '12px';
            removeBtn.style.fontWeight = 'bold';
            removeBtn.title = 'Entfernen';
            
            // Event-Handler zum Entfernen einzelner Dateien
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Verhindert das Öffnen des File Explorers
                
                // Entferne diese Datei aus dem globalen Array
                window.currentMediaFiles.splice(index, 1);
                
                // Erstelle ein neues FileList-Objekt
                const dataTransfer = new DataTransfer();
                window.currentMediaFiles.forEach(file => dataTransfer.items.add(file));
                
                // Aktualisiere das Input-Feld und die Vorschau
                const mediaInput = document.getElementById('media');
                mediaInput.files = dataTransfer.files;
                
                // Aktualisiere die Vorschauanzeige
                displayFilePreview(window.currentMediaFiles);
            });
            
            previewItem.appendChild(fileNameLabel);
            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
        });
        
        mediaUploader.appendChild(previewContainer);
    }

    // Hilfsfunktion zum Erstellen eines FileList-ähnlichen Objekts
    function createFileList(fileArray) {
        const dataTransfer = new DataTransfer();
        fileArray.forEach(file => dataTransfer.items.add(file));
        return dataTransfer.files;
    }

    // Aktualisiert das File-Input mit einem neuen FileList
    function updateFileInput(newFileList) {
        const mediaInput = document.getElementById('media');
        
        // Speichern der aktuellen Dateien global für spätere Verwendung
        window.currentMediaFiles = Array.from(newFileList);
        
        // Aktualisiere das Input-Feld
        mediaInput.files = newFileList;
        
        // Aktualisiere die Vorschau
        displayFilePreview(newFileList);
    }


    function clearFileInput() {
        const mediaInput = document.getElementById('media');
        mediaInput.value = '';
        
        // Zurücksetzen der gespeicherten Dateien in der globalen Variable
        window.currentMediaFiles = [];
        
        // Entferne vorhandene Vorschauen
        const mediaUploader = document.getElementById('media-uploader');
        const existingPreview = mediaUploader.querySelector('.file-preview-container');
        if (existingPreview) {
            mediaUploader.removeChild(existingPreview);
        }
        
        // Verstecke den Clear-All Button
        const clearAllBtn = document.getElementById('clear-all-media-btn');
        if (clearAllBtn) clearAllBtn.style.display = 'none';
    }
    
    function setupMediaInput() {
        const mediaInput = document.getElementById('media');
        const mediaUploader = document.getElementById('media-uploader');
        
        // Globale Variable für aktuelle Dateien
        window.currentMediaFiles = window.currentMediaFiles || [];
        
        // Click-Ereignis für den Media-Uploader (verhindert Doppelklick-Probleme)
        mediaUploader.addEventListener('click', (e) => {
            // Klick in die Vorschauliste oder auf "Alle löschen"/Einzel-Entfernen ignorieren
            if (
                e.target.closest('.file-preview-container') ||
                e.target.id === 'clear-all-media-btn' ||
                e.target.closest('.media-remove')
            ) {
                return;
            }
            
        });
    }

    function setupMediaUploader() {
        const mediaUploader = document.getElementById('media-uploader');
        
        // Füge "Alle löschen"-Button hinzu, wenn er noch nicht existiert
        if (!document.getElementById('clear-all-media-btn')) {
            const clearAllButton = document.createElement('button');
            clearAllButton.id = 'clear-all-media-btn';
            clearAllButton.type = 'button';
            clearAllButton.className = 'btn btn-small btn-danger';
            clearAllButton.innerHTML = '<i class="fas fa-times"></i> Alle löschen';
            clearAllButton.style.display = 'none';  // Standardmäßig versteckt
            clearAllButton.style.position = 'absolute';
            clearAllButton.style.top = '10px';
            clearAllButton.style.right = '10px';
            clearAllButton.style.zIndex = '5';
            
            clearAllButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Verhindert, dass der Click-Event zum Uploader durchgereicht wird
                clearFileInput();
            });
            
            mediaUploader.style.position = 'relative'; // Wichtig für absolute Positionierung des Buttons
            mediaUploader.appendChild(clearAllButton);
        }
    }

    setupMediaUploader();

    const entryTypeSelect = document.getElementById("entry-type");
    const eventFields = document.getElementById("event-fields");
  
    entryTypeSelect.addEventListener("change", () => {
      if (entryTypeSelect.value === "event") {
        eventFields.style.display = "block";
      } else {
        eventFields.style.display = "none";
      }
    });


    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Logout-Button
    document.getElementById("logout-btn").addEventListener("click", async () => {
        await fetch("/admin-logout", { method: "POST" });
        window.location.href = "/admin.html";
    });

    // Verbesserte Darstellung der News- und Event-Listen
    async function fetchNews() {
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/news?cb=${cacheBuster}`);
            if (!response.ok) throw new Error("Fehler beim Abrufen der News");
            const news = await response.json();
            const newsList = document.getElementById("news-list");
            newsList.innerHTML = "";

            if (news.length === 0) {
                showEmptyState(newsList, "Keine News vorhanden", "newspaper");
                return;
            }

            news.forEach(item => {
                const card = createItemCard(item, 'news');
                newsList.appendChild(card);
            });
        } catch (error) {
            console.error("Fehler beim Abrufen der News:", error);
            const newsList = document.getElementById("news-list");
            showErrorState(newsList, "Fehler beim Laden der News");
        }
    }

    async function fetchEvents() {
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/events?cb=${cacheBuster}`);
            if (!response.ok) throw new Error("Fehler beim Abrufen der Veranstaltungen");
            const events = await response.json();
            const eventsList = document.getElementById("events-list");
            eventsList.innerHTML = "";

            if (events.length === 0) {
                showEmptyState(eventsList, "Keine Veranstaltungen vorhanden", "calendar-alt");
                return;
            }

            events.forEach(item => {
                const card = createItemCard(item, 'event');
                eventsList.appendChild(card);
            });
        } catch (error) {
            console.error("Fehler beim Abrufen der Veranstaltungen:", error);
            const eventsList = document.getElementById("events-list");
            showErrorState(eventsList, "Fehler beim Laden der Veranstaltungen");
        }
    }

    function createItemCard(item, type) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        // FIX 2: Card sollte nur klickbar sein, wenn nicht auf Buttons geklickt wird
        card.addEventListener('click', (e) => {
            // FIX 2: Wenn auf einen Button oder ein Formularfeld innerhalb der Karte geklickt wurde,
            // keine Detailansicht öffnen
            if (
                e.target.closest('button') || 
                e.target.closest('input') || 
                e.target.closest('.item-actions')
            ) {
                return;
            }
            
            // Overlay
            const detailModal = document.createElement('div');
            detailModal.style.cssText = `
                position: fixed; top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex; align-items: center; justify-content: center;
                z-index: 10000;
            `;

            // Inhalt
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white; padding: 20px;
                border-radius: 8px;
                max-width: 600px; max-height: 80%; overflow: auto;
                position: relative;
            `;
            modalContent.innerHTML = `
                <h2>${item.title}</h2>
                <p>${item.content}</p>
                ${type === 'event' && item.date ? `<p><strong>Datum:</strong> ${item.date} ${item.time || ''}</p>` : ''}
                ${type === 'event' && item.location ? `<p><strong>Ort:</strong> ${item.location}</p>` : ''}
            `;

            // Medien anhängen
            if (item.media && item.media.length) {
                item.media.forEach(src => {
                    if (src.match(/\.(mp4|webm|ogg|mkv)$/i)) {
                        const vid = document.createElement('video');
                        vid.src = src;
                        vid.controls = true;
                        vid.style.cssText = 'max-width:100%; margin-top:10px;';
                        modalContent.appendChild(vid);
                    } else {
                        const img = document.createElement('img');
                        img.src = src;
                        img.style.cssText = 'max-width:100%; margin-top:10px;';
                        modalContent.appendChild(img);
                    }
                });
            }

            // Close-Button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                position: absolute; top: 10px; right: 10px;
                font-size: 24px; background: red;
                border: none; color: white; cursor: pointer;
            `;
            closeBtn.addEventListener('click', () => detailModal.remove());

            detailModal.appendChild(modalContent);
            detailModal.appendChild(closeBtn);
            document.body.appendChild(detailModal);
        });
        
        // Mediendarstellung (falls vorhanden)
        if (item.media && item.media.length > 0) {
            const mediaUrl = item.media[0]; // Erstes Medium für Vorschau verwenden
            const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') ||
                          mediaUrl.toLowerCase().endsWith('.webm') ||
                          mediaUrl.toLowerCase().endsWith('.ogg') ||
                          mediaUrl.toLowerCase().endsWith('.mkv');
            
            if (isVideo) {
                const video = document.createElement('video');
                video.className = 'item-image';
                video.src = mediaUrl;
                video.muted = true;           
                video.defaultMuted = true;    
                video.volume = 0;             
                video.playsInline = true;
                
                // Autoplay nur wenn sichtbar
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            video.play().catch(() => {});
                        } else {
                            video.pause();
                        }
                    });
                });
                observer.observe(video);
                
                card.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.className = 'item-image';
                img.src = mediaUrl;
                img.alt = item.title;
                card.appendChild(img);
            }
        } else {
            // Placeholder falls kein Medium vorhanden
            const placeholderDiv = document.createElement('div');
            placeholderDiv.className = 'item-image';
            placeholderDiv.style.display = 'flex';
            placeholderDiv.style.alignItems = 'center';
            placeholderDiv.style.justifyContent = 'center';
            placeholderDiv.style.backgroundColor = 'var(--light-gray)';
            
            const icon = document.createElement('i');
            icon.className = type === 'event' ? 'far fa-calendar-alt fa-3x' : 'far fa-newspaper fa-3x';
            icon.style.color = 'var(--gray)';
            
            placeholderDiv.appendChild(icon);
            card.appendChild(placeholderDiv);
        }
        
        // Inhalt
        const content = document.createElement('div');
        content.className = 'item-content';
        
        const title = document.createElement('h3');
        title.className = 'item-title';
        title.textContent = item.title;
        content.appendChild(title);
        
        const text = document.createElement('p');
        text.className = 'item-text';
        text.textContent = item.content;
        content.appendChild(text);
        
        // Details für Events
        if (type === 'event') {
            const details = document.createElement('div');
            details.className = 'item-details';
            
            if (item.date) {
                const dateDetail = document.createElement('div');
                dateDetail.className = 'item-detail';
                dateDetail.innerHTML = `<i class="far fa-calendar"></i> ${item.date}${item.time ? ' ' + item.time + ' Uhr' : ''}`;
                details.appendChild(dateDetail);
            }
            
            if (item.location) {
                const locationDetail = document.createElement('div');
                locationDetail.className = 'item-detail';
                locationDetail.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${item.location}`;
                details.appendChild(locationDetail);
            }
            
            content.appendChild(details);
        }
        
        // Zeitstempel
        const timestamp = document.createElement('div');
        timestamp.className = 'item-timestamp';
        timestamp.innerHTML = `Erstellt am: ${item.createdAt}` +
            (item.updatedAt && item.updatedAt !== item.createdAt ? ` | Bearbeitet am: ${item.updatedAt}` : "");
        content.appendChild(timestamp);
        
        // Aktionen
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary btn-small';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Bearbeiten';
        // FIX 2: Stoppt die Eventpropagation, so dass das Klick-Event nicht zum Card-Element gelangt
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Verhindert, dass das Klick-Event zum Card-Element gelangt
            if (type === 'event') {
                editEvent(item.id);
            } else {
                editNews(item.id);
            }
        });
        actions.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Löschen';
        // FIX 2: Stoppt die Eventpropagation, so dass das Klick-Event nicht zum Card-Element gelangt
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Verhindert, dass das Klick-Event zum Card-Element gelangt
            if (type === 'event') {
                deleteEvent(item.id);
            } else {
                deleteNews(item.id);
            }
        });
        actions.appendChild(deleteBtn);
        
        content.appendChild(actions);
        card.appendChild(content);
        
        return card;
    }

    function showEmptyState(container, message, iconName) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="far fa-${iconName}"></i>
            <h3>${message}</h3>
            <p>Erstellen Sie neue Inhalte über den "Erstellen / Bearbeiten" Tab.</p>
        `;
        container.appendChild(emptyState);
    }

    function showErrorState(container, message) {
        const errorState = document.createElement('div');
        errorState.className = 'empty-state';
        errorState.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
            <h3>${message}</h3>
            <p>Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator.</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Neu laden
            </button>
        `;
        container.appendChild(errorState);
    }

    // Verbesserte Toast-Nachrichten für Benutzer-Feedback
    function showToast(message, type = 'success') {
        // Entferne bestehende Toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            document.body.removeChild(toast);
        });
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.minWidth = '250px';
        toast.style.padding = '15px 20px';
        toast.style.borderRadius = 'var(--border-radius)';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        toast.style.zIndex = '1000';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';
        toast.style.animation = 'fadeIn 0.3s, fadeOut 0.3s 3.7s';
        toast.style.backgroundColor = type === 'success' ? 'var(--secondary)' : 'var(--danger)';
        toast.style.color = 'white';
        
        toast.innerHTML = `
            <span style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${message}
            </span>
            <i class="fas fa-times" style="cursor: pointer;"></i>
        `;
        
        document.body.appendChild(toast);
        
        // Close button functionality
        toast.querySelector('.fa-times').addEventListener('click', () => {
            document.body.removeChild(toast);
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }

    // Füge CSS für Toast-Animationen hinzu
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
    `;
    document.head.appendChild(style);

    // Verbesserte Bestätigungsdialoge
    function confirmAction(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1001';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.style.backgroundColor = 'white';
        dialog.style.borderRadius = 'var(--border-radius)';
        dialog.style.padding = '20px';
        dialog.style.boxShadow = 'var(--shadow)';
        dialog.style.width = '90%';
        dialog.style.maxWidth = '400px';
        dialog.style.animation = 'scaleIn 0.3s';
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--dark);">${message}</h3>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button class="btn btn-secondary btn-cancel">Abbrechen</button>
                <button class="btn btn-danger btn-confirm">Bestätigen</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Füge CSS für Dialog-Animation hinzu
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Button event listeners
        dialog.querySelector('.btn-cancel').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        });
        
        dialog.querySelector('.btn-confirm').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });
    }

    // Override der existierenden Funktionen mit verbesserter UI
    window.deleteNews = function(id) {
        confirmAction('Möchten Sie diesen News-Eintrag wirklich löschen?', async () => {
            try {
                const response = await fetch(`/news/${id}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Fehler beim Löschen der News");
                
                await fetchNews();
                showToast('News erfolgreich gelöscht', 'success');
            } catch (error) {
                console.error("Fehler beim Löschen der News:", error);
                showToast('Fehler beim Löschen der News', 'error');
            }
        });
    };
    
    window.deleteEvent = function(id) {
        confirmAction('Möchten Sie diese Veranstaltung wirklich löschen?', async () => {
            try {
                const response = await fetch(`/events/${id}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Fehler beim Löschen der Veranstaltung");
                
                await fetchEvents();
                showToast('Veranstaltung erfolgreich gelöscht', 'success');
            } catch (error) {
                console.error("Fehler beim Löschen der Veranstaltung:", error);
                showToast('Fehler beim Löschen der Veranstaltung', 'error');
            }
        });
    };

    async function editEvent(id) {
        try {
          const createTab = document.querySelector('.tab[data-tab="create"]');
          if (createTab) createTab.click();
      
          const response = await fetch(`/events/${id}`);
          if (!response.ok) throw new Error('Fehler beim Abrufen der Veranstaltung');
          const eventItem = await response.json();
          window.eventItem = eventItem;
          window.mediaToRemove = new Set();
      
          // Formular füllen
          document.getElementById('entry-id').value         = eventItem.id;
          document.getElementById('title').value            = eventItem.title;
          document.getElementById('content').value          = eventItem.content;
          document.getElementById('entry-type').value       = 'event';
          document.getElementById('event-fields').style.display = 'block';
          document.getElementById('event-date').value       = eventItem.date || '';
          document.getElementById('event-time').value       = eventItem.time || '';
          document.getElementById('event-location').value   = eventItem.location || '';
      
          // Medien anzeigen
          const existingMediaDiv = document.getElementById('existing-media');
          existingMediaDiv.innerHTML = '';
          const mediaContainer = document.createElement('div');
          mediaContainer.style.display    = 'flex';
          mediaContainer.style.flexWrap   = 'wrap';
          mediaContainer.style.gap        = '15px';
          existingMediaDiv.appendChild(mediaContainer);
      
          (eventItem.media || []).forEach((mediaUrl) => {
            const mediaItemContainer = document.createElement('div');
            mediaItemContainer.style.position = 'relative';
            mediaItemContainer.style.width    = '200px';
            mediaItemContainer.style.marginBottom = '15px';
      
            let mediaElement;
            if (/\.(mp4|webm|ogg|mkv)$/i.test(mediaUrl)) {
              mediaElement = document.createElement('video');
              mediaElement.src      = mediaUrl;
              mediaElement.width    = 200;
              mediaElement.height   = 150;
              mediaElement.controls = true;
            } else {
              mediaElement = document.createElement('img');
              mediaElement.src        = mediaUrl;
              mediaElement.alt        = 'Vorschau';
              mediaElement.style.width     = '100%';
              mediaElement.style.maxHeight = '150px';
              mediaElement.style.objectFit = 'cover';
            }
      
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = 'Entfernen';
            removeBtn.style.marginTop = '5px';
            removeBtn.style.width = '100%';
      
            setupRemoveExistingMedia(removeBtn, mediaUrl, mediaItemContainer);
      
            mediaItemContainer.appendChild(mediaElement);
            mediaItemContainer.appendChild(removeBtn);
            mediaContainer.appendChild(mediaItemContainer);
          });
      
          const cancelBtn = document.getElementById('cancel-edit-btn');
          cancelBtn.style.display = 'inline-block';
          cancelBtn.onclick = () => {
            // Media-To-Remove zurücksetzen
            window.mediaToRemove.clear();
            cancelEdit();
          };
      
        } catch (error) {
          console.error(error);
          showToast('Fehler beim Abrufen der Veranstaltung', 'error');
        }
      }


// Hilfsfunktion: Formular zurücksetzen
function clearForm() {
    const form = document.getElementById('entryForm');
    form.reset();
    clearFileInput();
    window.mediaToRemove = new Set();
    // Entferne Speichern-Hinweis
    const note = form.querySelector('.save-notification');
    if (note) note.remove();
  }
        function showSaveNotification() {
            const form = document.getElementById('entryForm');
            if (!form.querySelector('.save-notification')) {
              const note = document.createElement('div');
              note.className = 'save-notification';
              note.style.cssText = `
                background-color: #fff3cd;
                color: #856404;
                padding: 10px;
                margin: 10px 0;
                border: 1px solid #ffeeba;
                border-radius: 4px;
                text-align: center;
              `;
              note.textContent = 'Bitte speichere die Änderungen, um das entfernte Medium endgültig zu löschen.';
              form.insertBefore(note, form.firstChild);
            }
          }
// Entfernen-Handler (markiert Media zum Entfernen, löscht erst beim Speichern)
function setupRemoveExistingMedia(button, mediaUrl, container) {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!confirm('Medium wirklich entfernen?')) return;
  
      // Visuell ausblenden
      container.style.display = 'none';
  
      // Zum Entfernen markieren
      window.mediaToRemove = window.mediaToRemove || new Set();
      window.mediaToRemove.add(mediaUrl);
  
      // Hinweis fürs Speichern anzeigen
      showSaveNotification();
    });
  }          
    // Fix for automatic saving when removing media
    async function removeExistingMedia(entryId, mediaUrl, container) {
        confirmAction('Medium wirklich entfernen?', () => {
          // visuell ausblenden
          container.style.display = 'none';
            try {
                window.mediaToRemove = window.mediaToRemove || new Set();
                window.mediaToRemove.add(mediaUrl);

                // 3. Hinweis einblenden, dass gespeichert werden muss
                const form = document.getElementById('entryForm');
                if (!form.querySelector('.save-notification')) {
                  const note = document.createElement('div');
                  note.className = 'save-notification';
                  note.textContent =
                    'Bitte speichere die Änderungen, damit das Medium endgültig entfernt wird.';
                  form.insertBefore(note, form.firstChild);
    }
                // Add a notification that changes need to be saved
                const notification = document.createElement('div');
                notification.className = 'save-notification';
                notification.style.cssText = `
                    background-color: #fff3cd;
                    color: #856404;
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ffeeba;
                    border-radius: 4px;
                    text-align: center;
                `;
                notification.textContent = 'Bitte speichern Sie die Änderungen, um das Medium endgültig zu entfernen.';

                const existingNotification = document.querySelector('.save-notification');
                if (!existingNotification) {
                    const form = document.getElementById('entryForm');
                    form.insertBefore(notification, form.firstChild);
                }

                // Mark the media for removal when the form is submitted
                if (!window.mediaToRemove) window.mediaToRemove = new Set();
                window.mediaToRemove.add(mediaUrl);

            } catch (error) {
                console.error("Fehler beim Markieren des Mediums zum Entfernen:", error);
                showToast('Fehler beim Markieren des Mediums zum Entfernen', 'error');
            }
        });
    }

    async function editNews(id) {
        try {
          const createTab = document.querySelector('.tab[data-tab="create"]');
          if (createTab) createTab.click();
      
          const response = await fetch(`/news/${id}`);
          if (!response.ok) throw new Error('Fehler beim Abrufen der News');
          const newsItem = await response.json();
          window.newsItem = newsItem;
          window.mediaToRemove = new Set();
      
          // Formular füllen
          document.getElementById('entry-id').value      = newsItem.id;
          document.getElementById('title').value         = newsItem.title;
          document.getElementById('content').value       = newsItem.content;
          document.getElementById('entry-type').value    = 'news';
          document.getElementById('event-fields').style.display = 'none';
      
          // Medien anzeigen
          const existingMediaDiv = document.getElementById('existing-media');
          existingMediaDiv.innerHTML = '';
          const mediaContainer = document.createElement('div');
          mediaContainer.style.display  = 'flex';
          mediaContainer.style.flexWrap = 'wrap';
          mediaContainer.style.gap      = '15px';
          existingMediaDiv.appendChild(mediaContainer);
      
          (newsItem.media || []).forEach((mediaUrl) => {
            const mediaItemContainer = document.createElement('div');
            mediaItemContainer.style.position = 'relative';
            mediaItemContainer.style.width    = '200px';
            mediaItemContainer.style.marginBottom = '15px';
      
            let mediaElement;
            if (/\.(mp4|webm|ogg|mkv)$/i.test(mediaUrl)) {
              mediaElement = document.createElement('video');
              mediaElement.src      = mediaUrl;
              mediaElement.width    = 200;
              mediaElement.height   = 150;
              mediaElement.controls = true;
            } else {
              mediaElement = document.createElement('img');
              mediaElement.src        = mediaUrl;
              mediaElement.alt        = 'Vorschau';
              mediaElement.style.width     = '100%';
              mediaElement.style.maxHeight = '150px';
              mediaElement.style.objectFit = 'cover';
            }
      
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = 'Entfernen';
            removeBtn.style.marginTop = '5px';
            removeBtn.style.width = '100%';
      
            setupRemoveExistingMedia(removeBtn, mediaUrl, mediaItemContainer);
      
            mediaItemContainer.appendChild(mediaElement);
            mediaItemContainer.appendChild(removeBtn);
            mediaContainer.appendChild(mediaItemContainer);
          });
      
          const cancelBtn = document.getElementById('cancel-edit-btn');
          cancelBtn.style.display = 'inline-block';
          cancelBtn.onclick = () => {
            window.mediaToRemove.clear();
            cancelEdit();
          };
      
        } catch (error) {
          console.error(error);
          showToast('Fehler beim Abrufen der News', 'error');
        }
      }
      
      
    // Update form submission to handle removed media
    document.getElementById("entryForm").addEventListener("submit", async function(event) {
        event.preventDefault();
    // Show upload overlay
    const overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(255,255,255,0.8)";
    overlay.style.backdropFilter = "blur(5px)";
    overlay.style.zIndex = 1000;
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    // Spinner
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    spinner.style.border = "4px solid #f3f3f3";
    spinner.style.borderTop = "4px solid #3498db";
    spinner.style.borderRadius = "50%";
    spinner.style.width = "50px";
    spinner.style.height = "50px";
    spinner.style.animation = "spin 1s linear infinite";
    spinner.style.marginBottom = "1rem";

    // Message with more detailed progress information
    const message = document.createElement("p");
    message.id = "upload-message";
    message.textContent = "Vorbereitung zum Hochladen...";

    // Progress element for large uploads
    const progressContainer = document.createElement("div");
    progressContainer.style.width = "80%";
    progressContainer.style.maxWidth = "400px";
    progressContainer.style.marginTop = "10px";
    
    const progressBar = document.createElement("div");
    progressBar.id = "upload-progress";
    progressBar.style.width = "100%";
    progressBar.style.height = "20px";
    progressBar.style.backgroundColor = "#f3f3f3";
    progressBar.style.borderRadius = "10px";
    progressBar.style.overflow = "hidden";
    
    const progressFill = document.createElement("div");
    progressFill.id = "progress-fill";
    progressFill.style.width = "0%";
    progressFill.style.height = "100%";
    progressFill.style.backgroundColor = "#4CAF50";
    progressFill.style.transition = "width 0.3s";
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    // Add elements to overlay
    overlay.appendChild(spinner);
    overlay.appendChild(message);
    overlay.appendChild(progressContainer);
    document.body.appendChild(overlay);

    // Update progress function (can be called from outside)
    window.updateUploadProgress = function(percent, statusText) {
        const fill = document.getElementById("progress-fill");
        const msg = document.getElementById("upload-message");
        if (fill) fill.style.width = percent + "%";
        if (msg && statusText) msg.textContent = statusText;
    };

    const id = document.getElementById("entry-id").value;
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const mediaFiles = document.getElementById("media").files;
    const entryType = document.getElementById("entry-type").value;

    if (!title || !content) {
        alert("Bitte Titel und Inhalt eingeben!");
        document.body.removeChild(overlay);
        return;
    }
        // Add removed media indices to formData
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);

        // falls Du echte URLs/IDs trackst, schick sie als Array
        if (window.mediaToRemove && window.mediaToRemove.size > 0) {
            Array.from(window.mediaToRemove).forEach((url) => {
              formData.append('removedMedia[]', url);
            });
          }
          
  

        if (entryType === "event") {
            formData.append("date", document.getElementById("event-date").value);
            formData.append("time", document.getElementById("event-time").value);
            formData.append("location", document.getElementById("event-location").value);
        }
        // If there are large files, update the message
        let totalSize = 0;
        for (const file of mediaFiles) {
            formData.append("media", file);
            totalSize += file.size;
            console.log(`📂 Datei hinzugefügt: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
        }
        if (totalSize > 50 * 1024 * 1024) { // If total size > 50MB
            window.updateUploadProgress(0, `Große Dateien erkannt (${(totalSize / (1024 * 1024)).toFixed(2)} MB). Das Hochladen kann einige Minuten dauern...`);
        }
        // Bestimme Endpunkt und Methode basierend auf Typ und ID
        let uploadMethod = id ? "PUT" : "POST";
        let uploadUrl;
        if (entryType === "news") {
            uploadUrl = id ? `/news/${id}` : "/news";
        } else {
            uploadUrl = id ? `/events/${id}` : "/events";
        }

        try {
            // Starte den Timer für den Upload
            const startTime = Date.now();
            let uploadTimer = null;
            if (totalSize > 20 * 1024 * 1024) {
                let seconds = 0;
                uploadTimer = setInterval(() => {
                    seconds += 1;
                    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(0);
                    window.updateUploadProgress(
                        Math.min(95, Math.floor(seconds * 3)),
                        `Upload läuft seit ${elapsedTime} Sekunden. Bitte warten...`
                    );
                }, 1000);
            }
            
            // Perform the actual upload
            const response = await fetch(uploadUrl, {
                method: uploadMethod,
                body: formData
            });
            
            // Clear timer if set
            if (uploadTimer) clearInterval(uploadTimer);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error: ${errorText}`);
            }
    
            // Update progress to 100%
            window.updateUploadProgress(100, "✅ Upload erfolgreich abgeschlossen!");
            
            console.log("✅ News erfolgreich gespeichert!");
            if (!id) {
                       // NEU-Anlage: Form zurücksetzen und Tab wechseln
                       document.getElementById("entryForm").reset();
                       clearFileInput();
                       setTimeout(async () => {
                           await fetchNews();
                           await fetchEvents();
                           const targetTab = document.querySelector(`.tab[data-tab="${entryType === 'event' ? 'events' : 'news'}"]`);
                           if (targetTab) targetTab.click();
                           document.body.removeChild(overlay);
                           window.mediaToRemove = new Set();
                       }, 500);
                   } else {
                       // EDIT-Modus: im Bearbeiten-Form bleiben
                       setTimeout(async () => {
                           await fetchNews();
                           await fetchEvents();
                           clearForm();
                           document.body.removeChild(overlay);
                           window.mediaToRemove = new Set();
                       }, 500);
                   }
            document.getElementById("entry-type").value = "news";
            document.getElementById("event-fields").style.display = "none";
            document.getElementById("entry-id").value = "";
            document.getElementById("existing-media").innerHTML = "";
            document.getElementById("cancel-edit-btn").style.display = "none";
    
            
            const clearBtn = document.getElementById('clear-media-btn');
            if (clearBtn) clearBtn.style.display = 'none';
            
            
        } catch (error) {
            console.error("❌ Fehler beim Speichern der News:", error);
            window.updateUploadProgress(0, `❌ Fehler: ${error.message}`);
            
            // Keep the error visible for a moment before removing overlay
            setTimeout(() => {
                document.body.removeChild(overlay);
                alert(`Fehler beim Speichern der News: ${error.message}`);
            }, 2000);
        }
    });
        // ... (rest of the submit handler remains the same)

        // Clear the removed media tracking after successful submission
        
  

    // Initialisierung
    fetchNews();
    fetchEvents();
    
    // Weise die verbesserten Funktionen dem globalen Scope zu
    window.fetchNews = fetchNews;
    window.fetchEvents = fetchEvents;
    window.showToast = showToast;
    window.confirmAction = confirmAction;
});