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

const multer = require("multer");

// Speicherort für Uploads festlegen
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// Filter für erlaubte Dateitypen (nur Bilder & Videos)
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


// Multer Middleware für einzelne Datei
const upload = multer({ storage: storage, fileFilter: fileFilter });

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
        }

        let rawData = fs.readFileSync(newsFile, "utf8").trim();
        if (!rawData || rawData.length < 2 || rawData.includes("�")) {
            console.warn("⚠ Ungültiger Inhalt in news.json erkannt. Setze auf leere Liste...");
            fs.writeFileSync(newsFile, "[]", { encoding: "utf8" });
            return [];
        }

        return JSON.parse(rawData);
    } catch (err) {
        console.error("❌ Fehler beim Laden der News:", err);
        return [];
    }
}




// Funktion zum Speichern der News
function saveNews(news) {
    try {
        if (!Array.isArray(news)) {
            throw new Error("❌ Ungültige Daten: News ist kein Array!");
        }

        fs.writeFileSync(newsFile, JSON.stringify(news, null, 2), { encoding: "utf8" });
        console.log("✅ News erfolgreich gespeichert!");
    } catch (err) {
        console.error("❌ Fehler beim Speichern der News:", err);
    }
}




// Route: Alle News abrufen
app.get("/news", (req, res) => {
    res.json(loadNews());
});

// Route: Neue News hinzufügen
app.post("/news", upload.fields([{ name: "image" }, { name: "video" }]), (req, res) => {
  console.log("📥 POST-Anfrage erhalten:", req.body);
  console.log("📂 Hochgeladene Dateien:", req.files);

  let news = loadNews();

  const newArticle = {
      id: Date.now(),
      title: req.body.title,
      content: req.body.content,
      image: req.files["image"] ? `/uploads/${req.files["image"][0].filename}` : null,
      video: req.files["video"] ? `/uploads/${req.files["video"][0].filename}` : null,
      createdAt: new Date().toLocaleDateString("de-DE")
  };

  news.push(newArticle);
  saveNews(news);

  console.log("✅ News erfolgreich gespeichert:", newArticle);
  res.status(201).json(newArticle);
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