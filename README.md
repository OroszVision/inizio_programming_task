# inizio_programming_task
This Node.js application allows users to search Google and retrieve organic search results, including title, link, and snippet. The results can be viewed directly on the webpage or downloaded in JSON or CSV format.

Features
1. Search Form
Users can submit a search query via a web form.
The form sends the query to the backend for processing.


2. Backend Search with Puppeteer
The backend (Node.js server) handles the user's search query.
If the query was previously searched, the results are returned from cache to speed up the process.
If the query is new, Puppeteer launches a headless browser, navigates to Google, and extracts organic search results (title, link, snippet) from the first page.


3. Displaying Results
Once results are fetched from Google, they are returned to the client.
JavaScript dynamically creates and displays each search result on the webpage (title, link, snippet).


4. Download Results (JSON/CSV)
Users can download the search results in either JSON or CSV format.
To download in a specific format, use the following:
For CSV: [https://inizio-programming-task-xviy.onrender.com/download?format=csv]
For JSON (default): [https://inizio-programming-task-xviy.onrender.com/download?format=json]
8. Performance Optimizations
Caching: Recently searched queries are stored in cache (for 1 hour). If the same query is repeated, the cached results are returned instantly.
Resource Blocking: Puppeteer is optimized to block unnecessary resources like images, stylesheets, and fonts, which speeds up page loading and search result extraction.
How to Run


Clone the repository:
git clone https://github.com/your-username/google-search-scraper.git
cd google-search-scraper


Install dependencies:
npm install


Start the server:
node server.js

Open your browser and navigate to http://localhost:3000.
