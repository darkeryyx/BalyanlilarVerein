const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { parse } = require("dotenv");

const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const env = parse(readFileSync(resolve(process.cwd(), "process.env")));
const express = require('express');
const app = express();
app.set('trust proxy', true);
app.use((req, res, next) => {
  console.log('Incoming request from IP:', req.ip);
  next();
});

const allowedIPs = ['89.0.125.145', '2a0a:a54a:a046:0:e1b1:8613:f4df:6baf'];

app.use((req, res, next) => {
  // IPv4-Adressen können als ::ffff:IPv4 erscheinen, daher Präfix entfernen
  let ip = req.ip;
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (allowedIPs.includes(ip)) {
    return next(); // Zugriff erlauben
  }
  res.status(503).sendFile(path.join(__dirname, 'public', 'maintenance.html'));
});



app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// Add this before your routes
app.use(cors({
  origin: true,  // Allow same-origin requests
  credentials: true  // Allow cookies to be sent with requests
}));

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
});

const multer = require("multer");
// Temporäres Upload-Verzeichnis
const uploadDir = path.join(__dirname, 'tmp_uploads');
// Sicherstellen, dass das Verzeichnis existiert
const fs = require("fs");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
} 
const eventsFile = path.join(__dirname, "data", "events.json");
if (!fs.existsSync(path.dirname(eventsFile))) {
  fs.mkdirSync(path.dirname(eventsFile), { recursive: true });
}
// Multer-Konfiguration für diskStorage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/png", "image/jpeg", "image/jpg", "image/gif",
        "video/mp4", "video/webm", "video/ogg", "video/x-matroska"
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Nur Bild- und Videoformate (MP4, MKV, WEBM, OGG) erlaubt!"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 250 * 1024 * 1024 // 250MB
    }
});

// direkt ganz oben in server.js, noch vor allen anderen Middlewares:
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  console.log('🛠️  DEV-Modus: Helmet wird NICHT geladen – kein CSP/COOP/HSTS');
} else {
  // hier kommt dein bisheriger Helmet-Block rein:
  const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc:  ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'", "https://res.cloudinary.com"],
    imgSrc:     ["'self'", "data:", "https://res.cloudinary.com"],
    mediaSrc:   ["'self'", "https://res.cloudinary.com", "blob:"],
    styleSrc:   ["'self'", "'unsafe-inline'"],
    fontSrc:    ["'self'"],
    objectSrc:  ["'none'"],
    upgradeInsecureRequests: []
  };

  app.use(helmet({
    contentSecurityPolicy: { directives: cspDirectives },
    hsts:                   { maxAge: 31536000, includeSubDomains: true },
    crossOriginOpenerPolicy:{ policy: 'same-origin' },
    crossOriginEmbedderPolicy:{ policy: 'require-corp' },
    referrerPolicy:         { policy: 'same-origin' }
  }));
}



const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Zu viele Anmeldeversuche, bitte später erneut versuchen.'
});

const admin = {
    username: env.ADMIN_USERNAME,
    passwordHash: env.ADMIN_PASSWORD_HASH
};

app.use(session({
    secret: env.SESSION_SECRET || 'supersecurekey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000
    }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

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

function loadEvents() {
    try {
      if (!fs.existsSync(eventsFile)) {
        console.warn("Datei existiert nicht. Erstelle neue events.json...");
        fs.writeFileSync(eventsFile, "[]", { encoding: "utf8" });
        return [];
      }
      const rawData = fs.readFileSync(eventsFile, "utf8");
      if (!rawData) {
        console.warn("events.json ist leer. Erstelle neue events.json...");
        fs.writeFileSync(eventsFile, "[]", { encoding: "utf8" });
        return [];
      }
      return JSON.parse(rawData);
    } catch (err) {
      console.error("Fehler beim Laden der Veranstaltungen:", err);
      return [];
    }
  }
  
  function saveEvents(events) {
    return new Promise((resolve, reject) => {
      try {
        if (!Array.isArray(events)) {
          reject(new Error("Ungültige Daten: Events ist kein Array!"));
          return;
        }
        fs.writeFile(eventsFile, JSON.stringify(events, null, 2), { encoding: "utf8" }, (err) => {
          if (err) {
            console.error("Fehler beim Speichern der Veranstaltungen:", err);
            reject(err);
          } else {
            console.log("✅ Veranstaltungen erfolgreich gespeichert!");
            resolve();
          }
        });
      } catch (err) {
        console.error("Fehler beim Speichern der Veranstaltungen:", err);
        reject(err);
      }
    });
  }
  app.get("/events", (req, res) => {
    res.json(loadEvents());
  });
  app.post("/events", upload.array("media", 10), async (req, res) => {
    console.log("POST-Veranstaltung:", req.body);
    if (!req.body.title || !req.body.content || !req.body.date || !req.body.location) {
      return res.status(400).json({ error: "Titel, Inhalt, Datum und Ort sind erforderlich!" });
    }
    try {
      const mediaUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const result = await new Promise((resolve, reject) => {
              const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
              cloudinary.uploader.upload_large(
                file.path,
                { 
                  resource_type: resourceType,
                  public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}` 
                },
                (error, result) => {
                  deleteFile(file.path);
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );
            });
            mediaUrls.push(result.secure_url);
          } catch (uploadError) {
            console.error("Upload-Fehler:", uploadError);
          }
        }
      }
          // Falls keine Datei hochgeladen wurde, verwende das Logo als Standardbild
    if (mediaUrls.length === 0) {
        mediaUrls.push("/logo2.png");
      }
  
      let events = loadEvents();
      const timestamp = new Date().toLocaleDateString("de-DE");
      const newEvent = {
        id: Date.now(),
        title: req.body.title,
        content: req.body.content,
        date: req.body.date,
        time: req.body.time || "",
        location: req.body.location,
        media: mediaUrls,
        createdAt: timestamp,
        updatedAt: timestamp 
      };
      events.push(newEvent);
      await saveEvents(events);
      console.log("✅ Veranstaltung erfolgreich gespeichert:", newEvent);
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Fehler beim Speichern der Veranstaltung:", error);
      res.status(500).json({ error: "Fehler beim Speichern der Veranstaltung" });
    }
  });
  
  app.get("/events/:id", (req, res) => {
    let events = loadEvents();
    const eventItem = events.find(e => e.id == req.params.id);
    if (!eventItem) {
      return res.status(404).json({ error: "Veranstaltung nicht gefunden" });
    }
    res.json(eventItem);
  });
  app.put("/events/:id", upload.array("media", 10), async (req, res) => {
    if (!req.body.title || !req.body.content || !req.body.date || !req.body.location) {
      return res.status(400).json({ error: "Titel, Inhalt, Datum und Ort sind erforderlich!" });
    }
    try {
      let events = loadEvents();
      const index = events.findIndex(e => e.id == req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Veranstaltung nicht gefunden" });
      }
  
      const newMediaUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const result = await new Promise((resolve, reject) => {
              const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
              cloudinary.uploader.upload_large(
                file.path,
                { 
                  resource_type: resourceType,
                  public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
                },
                (error, result) => {
                  deleteFile(file.path);
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );
            });
            newMediaUrls.push(result.secure_url);
          } catch (uploadError) {
            console.error("Upload-Fehler:", uploadError);
          }
        }
      }
  
      let existingMedia = events[index].media || [];
      const removedFields = req.body.removedMedia || req.body['removedMedia[]'];
if (removedFields) {
  const removed = Array.isArray(removedFields)
    ? removedFields
    : [removedFields];
  existingMedia = existingMedia.filter(url => !removed.includes(url));
}
      const allMedia = [...existingMedia, ...newMediaUrls];
   
      events[index] = {
        ...events[index],
        title: req.body.title,
        content: req.body.content,
        date: req.body.date,
        time: req.body.time || "",
        location: req.body.location,
        media: allMedia,
        updatedAt: new Date().toLocaleDateString("de-DE")
      };
  
      await saveEvents(events);
      console.log("✅ Veranstaltung aktualisiert:", events[index]);
      res.json(events[index]);
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Veranstaltung:", error);
      res.status(500).json({ error: "Fehler beim Aktualisieren der Veranstaltung" });
    }
  });
  app.delete("/events/:id", async (req, res) => {
    let events = loadEvents();
    const eventToDelete = events.find(e => e.id == req.params.id);
    if (!eventToDelete) {
      return res.status(404).json({ error: "Veranstaltung nicht gefunden" });
    }
  
    if (eventToDelete.media && eventToDelete.media.length > 0) {
      await Promise.all(eventToDelete.media.map(async (url) => {
        const publicId = extractPublicId(url);
        const resourceType = extractResourceType(url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            console.log("Cloudinary deletion successful for:", publicId);
          } catch (error) {
            console.error("Fehler beim Löschen in Cloudinary:", error);
          }
        }
      }));
    }
  
    events = events.filter(e => e.id != req.params.id);
    await saveEvents(events);
    console.log("🗑 Veranstaltung gelöscht mit ID:", req.params.id);
    res.json({ message: "Veranstaltung gelöscht" });
  });
  app.delete("/events/:eventId/media/:mediaIndex", async (req, res) => {
    const { eventId, mediaIndex } = req.params;
    let events = loadEvents();
    const index = events.findIndex(e => e.id == eventId);
    if (index === -1) {
      return res.status(404).json({ error: "Veranstaltung nicht gefunden" });
    }
  
    if (!events[index].media || mediaIndex >= events[index].media.length) {
      return res.status(404).json({ error: "Medium nicht gefunden" });
    }
  
    const mediaToRemove = events[index].media[mediaIndex];
    if (!mediaToRemove) {
      return res.status(404).json({ error: "Medium nicht gefunden" });
    }
  
    try {
      const publicId = extractPublicId(mediaToRemove);
      const resourceType = extractResourceType(mediaToRemove);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log("Cloudinary deletion successful for:", publicId);
      }
    } catch (error) {
      console.error("Fehler beim Löschen des Mediums:", error);
    }
  
    events[index].media.splice(mediaIndex, 1);
    await saveEvents(events);
    console.log(`✅ Medium aus Veranstaltung (Index: ${mediaIndex}) gelöscht`);
    res.json({ success: true, message: "Medium gelöscht" });
  });
  
  
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.username === admin.username) {
        return next();
    }
    res.status(403).send({ message: 'Zugriff verweigert. Admin bitte einloggen.' });
}

app.post('/admin-logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Fehler beim Abmelden');
        }
        res.send({ message: 'Erfolgreich abgemeldet' });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/adminDashboard', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.use(express.json());

const newsFile = path.join(__dirname, "data", "news.json");

if (!fs.existsSync(path.dirname(newsFile))) {
    fs.mkdirSync(path.dirname(newsFile), { recursive: true });
}

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

app.get("/news", (req, res) => {
    res.json(loadNews());
});

// Hilfsfunktion zum Löschen von Dateien
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Fehler beim Löschen der temporären Datei:", err);
        } else {
            console.log("Temporäre Datei gelöscht:", filePath);
        }
    });
};

// Modified POST route for news with fixed upload handling
app.post("/news", upload.array("media", 10), async (req, res) => {
  console.log("📥 POST-Anfrage erhalten:", req.body);
  console.log("📂 Hochgeladene Dateien:", req.files ? req.files.map(file => file.originalname) : "Keine");

  if (!req.body.title || !req.body.content) {
      console.error("❌ Titel oder Inhalt fehlen!");
      return res.status(400).json({ error: "Titel und Inhalt sind erforderlich!" });
  }

  try {
      // Process files one by one to avoid duplicate uploads
      const mediaUrls = [];
      
      if (req.files && req.files.length > 0) {
          for (const file of req.files) {
              try {
                  // Use a Promise to handle each file upload
                  const result = await new Promise((resolve, reject) => {
                      // For large files, specify a resource_type based on mimetype
                      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
                      
                      cloudinary.uploader.upload_large(
                          file.path, 
                          { 
                              resource_type: resourceType,
                              // Optional: Add a unique public_id to prevent duplicates
                              public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}` 
                          }, 
                          (error, result) => {
                              // Delete temporary file regardless of upload success
                              deleteFile(file.path);
                              
                              if (error) {
                                  console.error("❌ Cloudinary Upload Error:", error);
                                  reject(error);
                              } else {
                                  resolve(result);
                              }
                          }
                      );
                  });
                  
                  mediaUrls.push(result.secure_url);
                  console.log(`✅ Uploaded: ${file.originalname} → ${result.secure_url}`);
              } catch (uploadError) {
                  console.error(`❌ Failed to upload ${file.originalname}:`, uploadError);
                  // Continue with other files even if one fails
              }
          }
      }

      let news = loadNews();
      const timestamp = new Date().toLocaleDateString("de-DE");
      const newArticle = {
          id: Date.now(),
          title: req.body.title,
          content: req.body.content,
          media: mediaUrls,
          createdAt: timestamp,
          updatedAt: timestamp // Standardmäßig gleich wie createdAt
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
function extractPublicId(url) {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;
    let pathPart = url.substring(uploadIndex + 8);
    const parts = pathPart.split("/");
    if (parts[0].startsWith("v")) {
        parts.shift();
    }
    let publicIdWithExt = parts.join("/");
    const dotIndex = publicIdWithExt.lastIndexOf(".");
    if (dotIndex !== -1) {
        return publicIdWithExt.substring(0, dotIndex);
    }
    return publicIdWithExt;
}

function extractResourceType(url) {
    if (url.includes("/video/upload/")) return "video";
    if (url.includes("/image/upload/")) return "image";
    return "image";
}

app.delete("/news/:id", async (req, res) => {
    let news = loadNews();
    const newsToDelete = news.find(n => n.id == req.params.id);
    if (!newsToDelete) {
        return res.status(404).json({ error: "Artikel nicht gefunden" });
    }

    if (newsToDelete.media && newsToDelete.media.length > 0) {
        await Promise.all(newsToDelete.media.map(async (url) => {
            const publicId = extractPublicId(url);
            const resourceType = extractResourceType(url);
            if (publicId) {
                try {
                    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                    console.log("Cloudinary deletion result:", result);
                } catch (error) {
                    console.error("Fehler beim Löschen der Datei in Cloudinary:", error);
                }
            }
        }));
    }

    const filteredNews = news.filter(n => n.id != req.params.id);
    await saveNews(filteredNews);

    console.log("🗑 News gelöscht mit ID:", req.params.id);
    res.json({ message: "News gelöscht" });
});

// Modified PUT route for news with fixed upload handling
app.put("/news/:id", upload.array("media", 10), async (req, res) => {
  console.log(`✏️ PUT-Anfrage erhalten für News-ID: ${req.params.id}`, req.body);
  console.log("📂 Hochgeladene Dateien:", req.files ? req.files.map(file => file.originalname) : "Keine");

  if (!req.body.title || !req.body.content) {
      return res.status(400).json({ error: "Titel und Inhalt sind erforderlich!" });
  }

  try {
      let news = loadNews();
      const index = news.findIndex(n => n.id == req.params.id);

      if (index === -1) {
          return res.status(404).json({ error: "Artikel nicht gefunden" });
      }

      // Process files one by one to avoid duplicate uploads
      const newMediaUrls = [];
      
      if (req.files && req.files.length > 0) {
          for (const file of req.files) {
              try {
                  // Use a Promise to handle each file upload
                  const result = await new Promise((resolve, reject) => {
                      // For large files, specify a resource_type based on mimetype
                      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
                      
                      cloudinary.uploader.upload_large(
                          file.path, 
                          { 
                              resource_type: resourceType,
                              // Optional: Add a unique public_id to prevent duplicates
                              public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}` 
                          }, 
                          (error, result) => {
                              // Delete temporary file regardless of upload success
                              deleteFile(file.path);
                              
                              if (error) {
                                  console.error("❌ Cloudinary Upload Error:", error);
                                  reject(error);
                              } else {
                                  resolve(result);
                              }
                          }
                      );
                  });
                  
                  newMediaUrls.push(result.secure_url);
                  console.log(`✅ Uploaded: ${file.originalname} → ${result.secure_url}`);
              } catch (uploadError) {
                  console.error(`❌ Failed to upload ${file.originalname}:`, uploadError);
                  // Continue with other files even if one fails
              }
          }
      }

      let existingMedia = news[index].media || [];
      const removedFields = req.body.removedMedia || req.body['removedMedia[]'];
if (removedFields) {
  const removed = Array.isArray(removedFields)
    ? removedFields
    : [removedFields];
  existingMedia = existingMedia.filter(url => !removed.includes(url));
}
      const allMedia = [...existingMedia, ...newMediaUrls];

      news[index] = {
          ...news[index],
          title: req.body.title,
          content: req.body.content,
          media: allMedia,
          updatedAt: new Date().toLocaleDateString("de-DE")
      };

      await saveNews(news);
      console.log("✅ News erfolgreich aktualisiert:", news[index]);
      res.json(news[index]);

  } catch (error) {
      console.error("❌ Fehler beim Aktualisieren der News:", error);
      res.status(500).json({ error: "Fehler beim Aktualisieren der News" });
  }
});

app.get("/news/:id", (req, res) => {
    const newsId = req.params.id;
    console.log(`🔎 GET-Anfrage erhalten für News-ID: ${newsId}`);

    let news = loadNews();
    const newsItem = news.find(n => n.id == newsId);

    if (!newsItem) {
        console.warn(`⚠ News mit ID ${newsId} nicht gefunden.`);
        return res.status(404).json({ error: "Artikel nicht gefunden" });
    }

    console.log("✅ News gefunden:", newsItem);
    res.json(newsItem);
});

app.delete("/news/:newsId/media/:mediaIndex", async (req, res) => {
  const { newsId, mediaIndex } = req.params;
  console.log(`🗑️  Lösche Medium mit Index ${mediaIndex} aus News-ID: ${newsId}`);

  try {
      let news = loadNews();
      const index = news.findIndex(n => n.id == newsId);

      if (index === -1) {
          return res.status(404).json({ error: "Artikel nicht gefunden" });
      }

      if (!news[index].media || mediaIndex >= news[index].media.length) {
          return res.status(404).json({ error: "Medium nicht gefunden" });
      }

      const mediaToRemove = news[index].media[mediaIndex];
      
      // Make sure we have a media URL to delete
      if (!mediaToRemove) {
          return res.status(404).json({ error: "Medium nicht gefunden" });
      }

      // Delete from Cloudinary (wrapped in try-catch to handle any errors)
      try {
          const publicId = extractPublicId(mediaToRemove);
          const resourceType = extractResourceType(mediaToRemove);
          
          if (publicId) {
              // Wait for the Cloudinary deletion to complete
              await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
              console.log("Cloudinary deletion successful for:", publicId);
          }
      } catch (cloudinaryError) {
          console.error("Fehler beim Löschen der Datei in Cloudinary:", cloudinaryError);
          // Continue with the function even if Cloudinary deletion fails
      }

      // Remove the media URL from the news object
      news[index].media.splice(mediaIndex, 1);

      // Save the updated news data
      await saveNews(news);
      
      console.log(`✅ Medium erfolgreich gelöscht (Index: ${mediaIndex})`);
      
      // Return a proper JSON response
      res.json({ success: true, message: "Medium gelöscht" });

  } catch (error) {
      console.error("❌ Fehler beim Löschen des Mediums:", error);
      res.status(500).json({ error: "Fehler beim Löschen des Mediums" });
  }
});
// ... (vorheriger Code) ...


/*
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
});*/

// Server starten 
/*
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
})/*/
const PORT = env.PORT || 45800;


app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
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