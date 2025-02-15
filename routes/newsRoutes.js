const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { verifyToken } = require('./authRoutes');

const router = express.Router();
const newsFile = path.join(__dirname, '../data/news.json');

// News lesen
router.get('/', async (req, res) => {
    const news = await fs.readJson(newsFile);
    res.json(news);
});

// News hinzufügen (geschützt)
router.post('/', verifyToken, async (req, res) => {
    const news = await fs.readJson(newsFile);
    news.push(req.body);
    await fs.writeJson(newsFile, news);
    res.json({ message: 'News hinzugefügt' });
});

module.exports = router;
