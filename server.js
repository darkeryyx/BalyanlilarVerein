const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { parse } = require("dotenv");

const env = parse(readFileSync(resolve(process.cwd(), "process.env")));
const express = require('express');
const app = express();
app.use(express.json({ limit: "50mb" })); // Erhöht die maximale JSON-Größe für große Uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Erlaubt größere Anfragen


const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

//const newsFile = resolve("news.json");
// === Import und Konfiguration von Cloudinary ===
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

// === Multer-Konfiguration: Speicher in den Arbeitsspeicher statt auf der Festplatte ===
const multer = require("multer");
// Statt diskStorage nutzen wir memoryStorage, damit wir die Datei-Buffer direkt an Cloudinary senden können.
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
      "image/png", "image/jpeg", "image/jpg", "image/gif",
      "video/mp4", "video/webm", "video/ogg", "video/x-matroska" // MKV hinzufügen
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
  } else {
      cb(new Error("Nur Bild- und Videoformate (MP4, MKV, WEBM, OGG) erlaubt!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});



// Sicherstellen, dass der Upload-Ordner existiert
const fs = require("fs");
const uploadDir = "public/uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// Sicherheits-Header aktivieren mit spezifischen Richtlinien
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "trusted-scripts.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));


// Rate Limiting für Login-Versuche
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Maximal 5 Versuche pro IP
  message: 'Zu viele Anmeldeversuche, bitte später erneut versuchen.'
});

// Admin-Zugangsdaten aus Umgebungsvariablen laden
const admin = {
    username: env.ADMIN_USERNAME,
    passwordHash: env.ADMIN_PASSWORD_HASH
};

// Sicherere Session-Einstellungen
app.use(session({
  secret: env.SESSION_SECRET || 'supersecurekey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production', // Setze auf true, wenn HTTPS verwendet wird
    maxAge: 60 * 60 * 1000 // 1 Stunde
  }
}));

app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));


// Admin-Login mit Rate-Limiting
app.post('/admin-login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
  
    if (username !== admin.username) {
      return res.status(401).send('Ungültiger Benutzername');
    }
  
    bcrypt.compare(password, admin.passwordHash, (err, isMatch) => {
      if (err) {
        return res.status(500).send('Fehler beim Überprüfen des Passworts');
      }
  
      if (!isMatch) {
        return res.status(401).send('Ungültige Anmeldedaten');
      }
  
      req.session.user = { username };
      res.redirect('/adminDashboard'); 
    });
  });

// Middleware zur Admin-Authentifizierung
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.username === admin.username) {
    return next();
  }
  res.status(403).send({ message: 'Zugriff verweigert. Admin bitte einloggen.' });
}

// Logout-Funktion
app.post('/admin-logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Fehler beim Abmelden');
    }
    res.send({ message: 'Erfolgreich abgemeldet' });
  });
});

// Startseite
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin-Seite
app.get('/adminDashboard', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.use(express.json());

const newsFile = path.join(__dirname, "data", "news.json");

// Sicherstellen, dass der data-Ordner existiert
if (!fs.existsSync(path.dirname(newsFile))) {
    fs.mkdirSync(path.dirname(newsFile), { recursive: true });
}
//das überprüft net ob zwei gleiche titel existieren, vllt das nötig falls die news mit gleichem titel erstellen wollen
/*app.post("/news", (req, res) => {
    console.log("📥 POST-Anfrage erhalten:", req.body); // Debug-Log
    let news = loadNews();
    const newArticle = { id: Date.now(), title: req.body.title, content: req.body.content };

    if (!newArticle.title || !newArticle.content) {
        return res.status(400).json({ error: "Titel und Inhalt sind erforderlich!" });
    }

    news.push(newArticle);
    saveNews(news);

    console.log("📝 News gespeichert:", newArticle); // Debug-Log
    res.status(201).json(newArticle);
});*/

// Funktion zum Laden der News
function loadNews() {
  try {
      if (!fs.existsSync(newsFile)) {
          console.warn("⚠ Datei existiert nicht. Erstelle neue news.json...");
          fs.writeFileSync(newsFile, "[]", { encoding: "utf8" });
          return [];
      }

      const rawData = fs.readFileSync(newsFile, "utf8");
      if (!rawData) {
          console.warn("⚠ news.json ist leer.  Erstelle neue news.json...");
          fs.writeFileSync(newsFile, "[]", { encoding: "utf8" });
          return [];
      }

      try {
          return JSON.parse(rawData);
      } catch (parseError) {
          console.error("❌ Fehler beim Parsen der News:", parseError);
          console.warn("⚠ news.json ist korrupt.  Erstelle neue news.json...");
          fs.writeFileSync(newsFile, "[]", { encoding: "utf8" });
          return [];
      }
  } catch (err) {
      console.error("❌ Fehler beim Laden der News:", err);
      return [];
  }
}




// Funktion zum Speichern der News
function saveNews(news) {
    return new Promise((resolve, reject) => {
        try {
            if (!Array.isArray(news)) {
                reject(new Error("❌ Ungültige Daten: News ist kein Array!"));
                return;
            }

            fs.writeFile(newsFile, JSON.stringify(news, null, 2), { encoding: "utf8" }, (err) => {
                if (err) {
                    console.error("❌ Fehler beim Speichern der News:", err);
                    reject(err);
                } else {
                    console.log("✅ News erfolgreich gespeichert!");
                    resolve();
                }
            });
        } catch (err) {
            console.error("❌ Fehler beim Speichern der News:", err);
            reject(err);
        }
    });
}




// Route: Alle News abrufen
app.get("/news", (req, res) => {
    res.json(loadNews());
});

// Route: Neue News hinzufügen
// Route: Neue News hinzufügen
// Route: Neue News hinzufügen mit Cloudinary-Upload
app.post("/news", upload.array("media", 10), async (req, res) => {
  console.log("📥 POST-Anfrage erhalten:", req.body);
  console.log("📂 Hochgeladene Dateien:", req.files ? req.files.map(file => file.originalname) : "Keine");

  // Prüfung: Titel und Inhalt müssen vorhanden sein
  if (!req.body.title || !req.body.content) {
      console.error("❌ Titel oder Inhalt fehlen!");
      return res.status(400).json({ error: "Titel und Inhalt sind erforderlich!" });
  }

  try {
      // Lade alle Dateien zu Cloudinary hoch
      const uploadPromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                  { resource_type: 'auto' }, // Automatische Erkennung des Dateityps (z.B. Bild oder Video)
                  (error, result) => {
                      if (error) {
                          console.error("❌ Cloudinary Upload Error:", error);
                          return reject(error);
                      }
                      resolve(result.secure_url);
                  }
              );
              uploadStream.end(file.buffer);
          });
      });

      const mediaUrls = req.files.length > 0 ? await Promise.all(uploadPromises) : [];
      
      let news = loadNews();
      const newArticle = {
          id: Date.now(),
          title: req.body.title,
          content: req.body.content,
          media: mediaUrls, 
          createdAt: new Date().toLocaleDateString("de-DE")
      };

      news.push(newArticle);

      await saveNews(news);
      console.log("✅ News erfolgreich gespeichert:", newArticle);
      res.status(201).json(newArticle);
  } catch (error) {
      console.error("❌ Fehler beim Hochladen der Dateien oder beim Speichern der News:", error);
      res.status(500).json({ error: "Fehler beim Hochladen der Dateien oder beim Speichern der News" });
  }
});







// Route: News löschen
app.delete("/news/:id", (req, res) => {
    let news = loadNews();
    news = news.filter(n => n.id != req.params.id);
    saveNews(news);
    res.json({ message: "✅ News gelöscht" });
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});

// News bearbeiten
app.put("/news/:id", (req, res) => {
  let news = loadNews();
  const index = news.findIndex(n => n.id == req.params.id);
  
  if (index === -1) {
      return res.status(404).json({ error: "Artikel nicht gefunden" });
  }

  // Datum des letzten Updates setzen
  news[index] = {
      ...news[index],
      title: req.body.title,
      content: req.body.content,
      updatedAt: new Date().toLocaleDateString("de-DE") // Änderungsdatum speichern
  };

  saveNews(news);

  console.log("✏️ News aktualisiert:", news[index]);
  res.json(news[index]);
});


// News löschen
app.delete("/news/:id", (req, res) => {
    let news = loadNews();
    const filteredNews = news.filter(n => n.id != req.params.id);
    
    if (news.length === filteredNews.length) {
        return res.status(404).json({ error: "Artikel nicht gefunden" });
    }

    saveNews(filteredNews);
    
    console.log("🗑 News gelöscht mit ID:", req.params.id);
    res.json({ message: "News gelöscht" });
});




console.log("📂 News-Datei Pfad:", newsFile);
console.log("📂 Inhalt der News-Datei beim Start:", loadNews());





/*
// News abrufen
app.get("/news", (req, res) => {
    res.json(loadNews());
});

// News erstellen
app.post("/news", (req, res) => {
    let news = loadNews();
    const newArticle = { id: Date.now(), title: req.body.title, content: req.body.content };
    news.push(newArticle);
    saveNews(news);
    res.status(201).json(newArticle);
});

// News löschen
app.delete("/news/:id", (req, res) => {
    let news = loadNews();
    news = news.filter(n => n.id != req.params.id);
    saveNews(news);
    res.json({ message: "News gelöscht" });
});


// News abrufen
app.get('/news', (req, res) => {
  res.json(loadNews());
});

// News erstellen
app.post('/news', isAdmin, (req, res) => {
  const news = loadNews();
  const newArticle = { id: Date.now(), title: req.body.title, content: req.body.content };
  news.push(newArticle);
  saveNews(news);
  res.status(201).json(newArticle);
});

// News bearbeiten
app.put('/news/:id', isAdmin, (req, res) => {
  let news = loadNews();
  const index = news.findIndex(n => n.id == req.params.id);
  if (index === -1) return res.status(404).send('Artikel nicht gefunden');
  news[index] = { ...news[index], title: req.body.title, content: req.body.content };
  saveNews(news);
  res.json(news[index]);
});

// News löschen
app.delete('/news/:id', isAdmin, (req, res) => {
  let news = loadNews();
  news = news.filter(n => n.id != req.params.id);
  saveNews(news);
  res.send('Artikel gelöscht');
});

// Server starten
const port = 3000;
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
console.log("Admin-Benutzername:", env.ADMIN_USERNAME );
console.log("Admin-Passwort-Hash:", env.ADMIN_PASSWORD_HASH);
*/