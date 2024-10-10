const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Pro servírování HTML souborů

// Uložení výsledků pro konkrétní dotaz
let latestResults = []; 

// Endpoint pro vyhledávání
app.post('/search', async (req, res) => {
    const query = req.body.query;

    // Spuštění Puppeteer pro scraping
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });

    // Extrakce dat z výsledků
    const data = await page.evaluate(() => {
        const items = [];
        const results = document.querySelectorAll('.g'); // Výsledky vyhledávání
        results.forEach(item => {
            const title = item.querySelector('h3')?.innerText; // Titulek
            const link = item.querySelector('a')?.href; // Odkaz
            const snippet = item.querySelector('.VwiC3b')?.innerText || "No snippet available"; // Úryvek (s výchozí hodnotou)

            if (title && link) {
                items.push({ title, link, snippet });
            }
        });
        return items;
    });

    await browser.close(); // Zavření prohlížeče

    latestResults = data; // Uložení výsledků pro pozdější stažení
    res.json(data); // Odeslání výsledků jako JSON
});

// Endpoint pro stažení výsledků jako JSON nebo CSV
app.get('/download', (req, res) => {
    const format = req.query.format || 'json'; // Volitelný formát (JSON nebo CSV)
    const filePath = path.join(__dirname, `results.${format}`);

    // Uložení dat jako JSON nebo CSV
    if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(latestResults, null, 2));
    } else if (format === 'csv') {
        const csvContent = latestResults.map(result => `${result.title},${result.link},${result.snippet}`).join('\n');
        fs.writeFileSync(filePath, csvContent);
    }

    res.download(filePath, err => {
        if (err) {
            console.error('Error while sending file:', err);
        }
        fs.unlinkSync(filePath); // Odstranění souboru po odeslání
    });
});

// Spuštění serveru na portu 3000
app.listen(3000, () => {
    console.log('Server běží na http://localhost:3000');
});
