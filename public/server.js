/**const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { parse } = require("dotenv");

const env = parse(readFileSync(resolve(process.cwd(), "process.env")));
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

//const newsFile = resolve("news.json");

// Sicherheits-Header aktivieren mit spezifischen Richtlinien
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "trusted-scripts.com"],
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

const fs = require("fs");


const newsFile = path.join(__dirname, 'data', 'news.json');

function loadNews() {
    try {
        if (fs.existsSync(newsFile)) {
            return JSON.parse(fs.readFileSync(newsFile, "utf8"));
        } else {
            return [];
        }
    } catch (err) {
        console.error("Fehler beim Laden der News:", err);
        return [];
    }
}

function saveNews(news) {
    try {
        fs.writeFileSync(newsFile, JSON.stringify(news, null, 2));
    } catch (err) {
        console.error("Fehler beim Speichern der News:", err);
    }
}


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