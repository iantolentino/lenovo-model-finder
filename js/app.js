import { debounce, escapeHtml } from './utils.js';

const DATA_URL = 'data/fru_parts.json';
let allParts = [];
let currentSearchTerm = '';
let currentCategory = 'all';
let currentModel = 'all';

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

function search() {
    let results = allParts;
    
    // Apply category filter
    if (currentCategory !== 'all') {
        results = results.filter(part => part.category === currentCategory);
    }
    
    // Apply model filter
    if (currentModel !== 'all') {
        results = results.filter(part => part.model === currentModel);
    }
    
    // Apply search term filter
    if (currentSearchTerm.trim()) {
        const lowerQuery = currentSearchTerm.toLowerCase().trim();
        results = results.filter(part => {
            return part.fru_pn.toLowerCase().includes(lowerQuery) ||
                   part.cru_id.toLowerCase().includes(lowerQuery) ||
                   part.description.toLowerCase().includes(lowerQuery) ||
                   part.model.toLowerCase().includes(lowerQuery) ||
                   part.category.toLowerCase().includes(lowerQuery);
        });
    }
    
    return results;
}

function renderResults(results) {
    const container = document.getElementById('results');
    const countSpan = document.getElementById('resultsCount');
    
    let modelText = currentModel === 'all' ? 'All Models' : currentModel;
    let categoryText = currentCategory === 'all' ? 'All Categories' : currentCategory;
    countSpan.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} · ${modelText} · ${categoryText}`;
    
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">No parts found. Try different filters or search term.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < results.length; i++) {
        const part = results[i];
        const div = document.createElement('div');
        div.className = 'result-card';
        div.innerHTML = `
            <h3>${escapeHtml(part.description)}</h3>
            <div class="fru">FRU: ${escapeHtml(part.fru_pn)}</div>
            <div class="desc">${escapeHtml(part.description)}</div>
            <div class="meta">
                <span>CRU: ${escapeHtml(part.cru_id)}</span>
                <span>Model: ${escapeHtml(part.model)}</span>
                <span>${escapeHtml(part.category)}</span>
            </div>
        `;
        fragment.appendChild(div);
    }
    
    container.innerHTML = '';
    container.appendChild(fragment);
}

function updateResults() {
    const results = search();
    renderResults(results);
}

function setupDropdownFilters() {
    // Setup Model Dropdown
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            currentModel = e.target.value;
            console.log(`Model changed to: ${currentModel}`);
            updateResults();
        });
    }
    
    // Setup Category Dropdown
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            console.log(`Category changed to: ${currentCategory}`);
            updateResults();
        });
    }
}

function setupSearchButton() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    const performSearch = () => {
        currentSearchTerm = searchInput.value;
        updateResults();
    };
    
    // Immediate search on button click
    searchButton.addEventListener('click', performSearch);
    
    // Immediate search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Debounced search while typing (300ms delay)
    searchInput.addEventListener('input', debounce(() => {
        currentSearchTerm = searchInput.value;
        updateResults();
    }, 300));
}

document.addEventListener('DOMContentLoaded', async () => {
    const success = await loadData();
    if (!success || allParts.length === 0) {
        document.getElementById('results').innerHTML = '<div class="no-results">Error loading FRU data. Please refresh the page.</div>';
        return;
    }

    setupDropdownFilters();
    setupSearchButton();
    
    // Initial render
    updateResults();
});