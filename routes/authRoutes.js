const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const adminUser = process.env.ADMIN_USERNAME;
const adminPass = process.env.ADMIN_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;

// Login-Route
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username !== adminUser) {
        return res.status(401).json({ message: 'Falscher Benutzername' });
    }

    if (!bcrypt.compareSync(password, adminPass)) {
        return res.status(401).json({ message: 'Falsches Passwort' });
    }

    // JWT-Token erstellen
    const token = jwt.sign({ username }, jwtSecret, { expiresIn: '1h' });

    res.json({ token });
});

// Middleware für geschützte Routen
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Kein Token vorhanden' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Ungültiger Token' });
        }
        req.user = decoded;
        next();
    });
}

module.exports = { router, verifyToken };
