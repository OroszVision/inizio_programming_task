const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for the port
app.use(express.json());
app.use(express.static('public')); // Serve HTML files

// Store latest results for a specific query
let latestResults = []; 

// Search endpoint
app.post('/search', async (req, res) => {
    const query = req.body.query;

    // Launch Puppeteer for scraping
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });

    // Extract data from results
    const data = await page.evaluate(() => {
        const items = [];
        const results = document.querySelectorAll('.g'); // Search results
        results.forEach(item => {
            const title = item.querySelector('h3')?.innerText; // Title
            const link = item.querySelector('a')?.href; // Link
            const snippet = item.querySelector('.VwiC3b')?.innerText || "No snippet available"; // Snippet

            if (title && link) {
                items.push({ title, link, snippet });
            }
        });
        return items;
    });

    await browser.close(); // Close the browser

    latestResults = data; // Store results for later download
    res.json(data); // Send results as JSON
});

// Download endpoint for results as JSON or CSV
app.get('/download', (req, res) => {
    const format = req.query.format || 'json'; // Optional format (JSON or CSV)
    const filePath = path.join(__dirname, `results.${format}`);

    // Save data as JSON or CSV
    if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(latestResults, null, 2));
    } else if (format === 'csv') {
        const csvContent = "Title,Link,Snippet\n" + // Add headers
            latestResults.map(result => `${result.title},${result.link},"${result.snippet.replace(/"/g, '""')}"`).join('\n');
        fs.writeFileSync(filePath, csvContent);
    }

    res.download(filePath, err => {
        if (err) {
            console.error('Error while sending file:', err);
        }
        fs.unlinkSync(filePath); // Delete file after sending
    });
});

// Start server on specified port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
