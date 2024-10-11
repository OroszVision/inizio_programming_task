const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache'); // Adding node-cache
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('public'));

// Create cache with a TTL of 10 minutes (600 seconds)
const cache = new NodeCache({ stdTTL: 600 });
let latestResults = [];  // Make sure this is globally accessible

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

        const browser = await puppeteer.launch({
            headless: true,
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
                '--enable-features=NetworkService,NetworkServiceInProcess'
            ],
        });
        
        const page = await browser.newPage();

        // Intercept and block unnecessary resources like images, stylesheets, fonts, and media
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort(); // Block these resource types
            } else {
                req.continue(); // Continue loading other necessary resources
            }
        });
        
        // Load the search page
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
            waitUntil: 'domcontentloaded' // Only wait for the basic HTML to load
        });
        
        // Extract the search results
        const data = await page.evaluate(() => {
            const items = [];
            const results = document.querySelectorAll('.g'); // Select the organic results
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

        // Cache the results for future requests
        cache.set(query, data);

        latestResults = data;  // Update latestResults for download
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
