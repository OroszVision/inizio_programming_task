const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

let latestResults = [];

// Search route
app.post('/search', async (req, res) => {
    const query = req.body.query;

    // Launch Puppeteer in Render environment
    const browser = await puppeteer.launch({
        headless: "new", // Use the new Headless mode for Puppeteer
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for cloud environments like Render
        executablePath: '/usr/bin/google-chrome-stable' // Path to Chrome installed by render-build.sh
    });

    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });

    const data = await page.evaluate(() => {
        const items = [];
        const results = document.querySelectorAll('.g');
        results.forEach(item => {
            const title = item.querySelector('h3')?.innerText;
            const link = item.querySelector('a')?.href;
            const snippet = item.querySelector('.VwiC3b')?.innerText || "No snippet available";

            if (title && link) {
                items.push({ title, link, snippet });
            }
        });
        return items;
    });

    await browser.close();

    latestResults = data;
    res.json(data);
});

// Download route
app.get('/download', (req, res) => {
    const format = req.query.format || 'json';
    const filePath = path.join(__dirname, `results.${format}`);

    if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(latestResults, null, 2));
    } else if (format === 'csv') {
        const csvContent = "Title,Link,Snippet\n" +
            latestResults.map(result => `${result.title},${result.link},"${result.snippet.replace(/"/g, '""')}"`).join('\n');
        fs.writeFileSync(filePath, csvContent);
    }

    res.download(filePath, err => {
        if (err) {
            console.error('Error while sending file:', err);
        }
        fs.unlinkSync(filePath);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
