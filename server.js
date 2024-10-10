const express = require('express');
const puppeteer = require('puppeteer');
const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const searchCache = new NodeCache({ stdTTL: 600 }); // Cache TTL set to 10 minutes

app.use(express.json());
app.use(express.static('public'));

let browser; // Declare the browser instance

// Initialize the browser (reuse the same instance across requests)
async function initializeBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/opt/render/project/.render/chrome/opt/google/chrome/chrome', // Adjust path based on Render installation
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }
}

// Close the browser when the process exits
process.on('exit', async () => {
    if (browser) await browser.close();
});

// Search route
app.post('/search', async (req, res) => {
    const query = req.body.query;

    // Check if the query exists in the cache
    const cachedResults = searchCache.get(query);
    if (cachedResults) {
        return res.json(cachedResults);
    }

    try {
        await initializeBrowser(); // Ensure browser is initialized

        const page = await browser.newPage();

        // Block unnecessary resources like images, CSS, and fonts
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
            waitUntil: 'domcontentloaded',
        });

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

        await page.close(); // Close the page (but keep the browser open)

        searchCache.set(query, data); // Cache the results for future requests

        res.json(data);
    } catch (error) {
        console.error('Error fetching Google results:', error);
        res.status(500).send('Error fetching results');
    }
});

// Download route
app.get('/download', (req, res) => {
    const format = req.query.format || 'json';
    const filePath = path.join(__dirname, `results.${format}`);

    if (!latestResults || latestResults.length === 0) {
        return res.status(404).send('No search results available to download');
    }

    if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(latestResults, null, 2));
    } else if (format === 'csv') {
        const csvContent = "Title,Link,Snippet\n" +
            latestResults.map(result => `${result.title},${result.link},"${result.snippet.replace(/"/g, '""')}"`).join('\n');
        fs.writeFileSync(filePath, csvContent);
    }

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error while sending file:', err);
        }
        fs.unlinkSync(filePath); // Clean up the file after download
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
