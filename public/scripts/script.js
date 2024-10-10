document.getElementById('search-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Zabraňuje standardnímu odeslání formuláře
    const query = document.getElementById('search-input').value; // Získání klíčového slova

    // Odeslání požadavku na server
    const response = await fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });

    // Zpracování odpovědi ze serveru
    const results = await response.json();
    displayResults(results); // Zobraz výsledky

    // Zobrazení tlačítka pro stažení
    const downloadButton = document.getElementById('download-results');
    downloadButton.style.display = 'block';
    downloadButton.onclick = () => downloadResults();
});

// Funkce pro zobrazení výsledků na stránce
function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Vymaž předchozí výsledky

    results.forEach(result => {
        const div = document.createElement('div');
        div.classList.add('result');
        
        // Získání domény z URL
        const url = new URL(result.link);
        const domain = url.hostname; // Získá doménu (např. www.example.com)

        div.innerHTML = `
            <h3><a href="${result.link}" target="_blank">${result.title}</a></h3>
            <p><a href="${result.link}" target="_blank">${domain}</a></p> <!-- Zobraz doménu jako odkaz -->
            <p>${result.snippet}</p> <!-- Zobraz úryvek -->
        `;
        resultsDiv.appendChild(div);
    });
}

// Funkce pro stažení výsledků
async function downloadResults() {
    // Zde se volá endpoint pro stažení výsledků
    const response = await fetch(`/download?format=json`); // Můžeš změnit na 'csv', pokud potřebuješ CSV
    if (!response.ok) {
        // Ošetření chyby
        console.error('Download failed:', response.statusText);
        return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.json'; // Zde lze změnit formát na .csv, pokud potřebuješ CSV
    document.body.appendChild(a);
    a.click();
    a.remove();
}

