document.getElementById('search-form').addEventListener('submit', async function (event) {
    event.preventDefault(); 
    const query = document.getElementById('search-input').value; 

    try {
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            console.error('Error fetching search results:', response.statusText);
            return;
        }

        const results = await response.json();
        displayResults(results);

        const downloadButton = document.getElementById('download-results');
        downloadButton.style.display = 'block';
        downloadButton.onclick = () => downloadResults();
    } catch (error) {
        console.error('Error occurred during search request:', error);
    }
});

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; 

    results.forEach(result => {
        const div = document.createElement('div');
        div.classList.add('result');

        const url = new URL(result.link);
        const domain = url.hostname; 

        div.innerHTML = `
            <h3><a href="${result.link}" target="_blank">${result.title}</a></h3>
            <p><a href="${result.link}" target="_blank">${domain}</a></p>
            <p>${result.snippet}</p>
        `;
        resultsDiv.appendChild(div);
    });
}

async function downloadResults() {
    try {
        const response = await fetch(`/download?format=json`);
        if (!response.ok) {
            console.error('Download failed:', response.statusText);
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'results.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        console.error('Error downloading results:', error);
    }
}
