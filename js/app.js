import { debounce } from './utils.js';

const DATA_URL = 'data/fru_parts.json';
let allParts = [];

async function loadData() {
    try {
        const cached = localStorage.getItem('fru_data');
        if (cached) {
            allParts = JSON.parse(cached);
            console.log(`Loaded ${allParts.length} parts from cache`);
            return true;
        }
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        allParts = await response.json();
        localStorage.setItem('fru_data', JSON.stringify(allParts));
        console.log(`Fetched and cached ${allParts.length} parts`);
        return true;
    } catch (err) {
        console.error('Failed to load data:', err);
        return false;
    }
}

function search(query) {
    if (!query.trim()) return allParts;
    const lowerQuery = query.toLowerCase();
    return allParts.filter(part => {
        return part.fru_pn.toLowerCase().includes(lowerQuery) ||
               part.cru_id.toLowerCase().includes(lowerQuery) ||
               part.description.toLowerCase().includes(lowerQuery) ||
               part.model.toLowerCase().includes(lowerQuery) ||
               part.category.toLowerCase().includes(lowerQuery);
    });
}

function renderResults(results) {
    const container = document.getElementById('results');
    const countSpan = document.getElementById('resultsCount');
    countSpan.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">🔍 No matching parts found. Try a different keyword.</div>';
        return;
    }
    container.innerHTML = results.map(part => `
        <div class="result-card">
            <h3>${escapeHtml(part.description)}</h3>
            <div class="fru">FRU P/N: ${escapeHtml(part.fru_pn)}</div>
            <div class="desc">${escapeHtml(part.description)}</div>
            <div class="meta">
                <span>CRU ID: ${escapeHtml(part.cru_id)}</span>
                <span>Model: ${escapeHtml(part.model)}</span>
                <span>Category: ${escapeHtml(part.category)}</span>
            </div>
        </div>
    `).join('');
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const success = await loadData();
    if (!success || allParts.length === 0) {
        document.getElementById('results').innerHTML = '<div class="no-results" style="color:red;">❌ Error loading FRU data. Please refresh the page.</div>';
        return;
    }

    const searchInput = document.getElementById('searchInput');
    const handleSearch = () => renderResults(search(searchInput.value));
    const debouncedSearch = debounce(handleSearch, 200);
    searchInput.addEventListener('input', debouncedSearch);
    renderResults(allParts);
});