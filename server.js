const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache'); // Adding node-cache
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('public'));

// Create cache with a longer TTL (e.g., 1 hour)
const cache = new NodeCache({ stdTTL: 3600 });
let latestResults = []; // Globally accessible for download

let browser; // Globally declare browser instance

// Pre-launch Puppeteer instance
(async () => {
    browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/opt/render/project/.render/chrome/opt/google/chrome/chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-images', 
            '--disable-css',
            '--disable-web-security',
            '--single-process',
            '--no-zygote',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-default-apps',
            '--enable-features=NetworkService,NetworkServiceInProcess',
        ],
    });
})();

// Search route
app.post('/search', async (req, res) => {
    const query = req.body.query;

    try {
        // Check if results for the query are in cache
        const cachedResults = cache.get(query);
        if (cachedResults) {
            console.log('Serving results from cache');
            latestResults = cachedResults;
            return res.json(cachedResults);
        }

        const page = await browser.newPage();

        // Block unnecessary resources (images, styles, fonts, etc.)
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            const url = req.url();
            if (['image', 'stylesheet', 'font', 'media', 'script', 'xhr', 'fetch'].includes(resourceType) || url.includes('google-analytics') || url.includes('gstatic')) {
                req.abort(); // Block these resource types and analytics requests
            } else {
                req.continue(); // Allow only necessary resources
            }
        });

        // Load Google Search results page with basic HTML only
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
               waitUntil: 'networkidle2'
        });

        // Extract search results (title, link, snippet)
        const data = await page.evaluate(() => {
            const items = [];
            const results = document.querySelectorAll('.g'); // Organic search results
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

        await page.close(); // Close the page after scraping

        // Cache the results for faster future queries
        cache.set(query, data);
        latestResults = data; // Update global latest results for download
        res.json(data); // Send results back to the client
    } catch (error) {
        console.error('Error fetching Google results:', error);
        res.status(500).send('Error fetching results');
    }
});

// Download route (JSON or CSV)
app.get('/download', (req, res) => {
    const format = req.query.format || 'json';
    const filePath = path.join(__dirname, `results.${format}`);

    try {
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
            fs.unlinkSync(filePath); // Remove the file after download
        });
    } catch (error) {
        console.error('Error during file generation or download:', error);
        res.status(500).send('Error generating or downloading file');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
