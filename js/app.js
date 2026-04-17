import { debounce, escapeHtml } from './utils.js';

const DATA_URL = 'data/fru_parts.json';
let allParts = [];
let currentSearchTerm = '';
let currentCategory = 'all';
let currentModel = 'all';

const CACHE_KEY = 'fru_data_v1';

async function loadData() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            allParts = JSON.parse(cached);
            console.log(`Loaded ${allParts.length} parts from cache`);
            return true;
        }

        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        allParts = await response.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify(allParts));
        console.log(`Fetched and cached ${allParts.length} parts`);
        return true;
    } catch (err) {
        console.error('Failed to load data:', err);
        return false;
    }
}

async function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    allParts = [];
    currentSearchTerm = '';
    currentModel = 'all';
    currentCategory = 'all';

    document.getElementById('searchInput').value = '';
    document.getElementById('results').innerHTML = '';
    document.getElementById('resultsCount').textContent = '';

    const btn = document.getElementById('clearCacheBtn');
    btn.textContent = 'Refreshing…';
    btn.disabled = true;

    const success = await loadData();
    if (!success || allParts.length === 0) {
        document.getElementById('results').innerHTML =
            '<div class="no-results">Error reloading data. Please refresh the page.</div>';
    } else {
        updateAll();
    }

    btn.textContent = 'Clear Cache';
    btn.disabled = false;
}

// Parts matching only the search term — used to compute available dropdown options.
function getSearchMatchedParts() {
    if (!currentSearchTerm.trim()) return allParts;
    const q = currentSearchTerm.toLowerCase().trim();
    return allParts.filter(p =>
        p.fru_pn.toLowerCase().includes(q) ||
        p.cru_id.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
}

// Full pipeline used for rendering results.
function getFilteredParts() {
    let results = allParts;

    if (currentModel !== 'all') {
        results = results.filter(p => p.model === currentModel);
    }
    if (currentCategory !== 'all') {
        results = results.filter(p => p.category === currentCategory);
    }
    if (currentSearchTerm.trim()) {
        const q = currentSearchTerm.toLowerCase().trim();
        results = results.filter(p =>
            p.fru_pn.toLowerCase().includes(q) ||
            p.cru_id.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.model.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
    }

    return results;
}

// Rebuild dropdowns based on current state.
// Key rule: category list is always scoped to the selected model (or all models).
// Model list is always scoped to the selected category (or all categories).
// Both are further narrowed by the active search term.
// Returns {validModel, validCategory} — the sanitised values to use.
function refreshDropdowns() {
    const pool = getSearchMatchedParts();

    // ── Category dropdown ───────────────────────────────────────────────────
    // Show only categories that exist in the selected model (or all models).
    const catPool = currentModel !== 'all'
        ? pool.filter(p => p.model === currentModel)
        : pool;

    const availableCategories = [...new Set(catPool.map(p => p.category))].sort();

    // If current selection no longer valid, fall back to 'all'
    const validCategory = availableCategories.includes(currentCategory)
        ? currentCategory
        : 'all';

    const categorySelect = document.getElementById('categorySelect');
    categorySelect.innerHTML =
        `<option value="all">All Categories (${availableCategories.length})</option>` +
        availableCategories.map(c =>
            `<option value="${c}"${c === validCategory ? ' selected' : ''}>${c}</option>`
        ).join('');

    // ── Model dropdown ──────────────────────────────────────────────────────
    // Show only models that have the selected category (or all categories).
    const modelPool = validCategory !== 'all'
        ? pool.filter(p => p.category === validCategory)
        : pool;

    const availableModels = [...new Set(modelPool.map(p => p.model))].sort();

    const validModel = availableModels.includes(currentModel)
        ? currentModel
        : 'all';

    const modelSelect = document.getElementById('modelSelect');
    modelSelect.innerHTML =
        `<option value="all">All Models (${availableModels.length})</option>` +
        availableModels.map(m =>
            `<option value="${m}"${m === validModel ? ' selected' : ''}>${m}</option>`
        ).join('');

    return { validModel, validCategory };
}

function renderResults(results) {
    const container = document.getElementById('results');
    const countSpan  = document.getElementById('resultsCount');

    const modelText    = currentModel    === 'all' ? 'All Models'     : currentModel;
    const categoryText = currentCategory === 'all' ? 'All Categories' : currentCategory;
    countSpan.textContent =
        `${results.length} result${results.length !== 1 ? 's' : ''} · ${modelText} · ${categoryText}`;

    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">No parts found. Try adjusting your filters or search term.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    for (const part of results) {
        const div = document.createElement('div');
        div.className = 'result-card';
        div.innerHTML = `
            <h3>${escapeHtml(part.description)}</h3>
            <div class="fru">FRU: ${escapeHtml(part.fru_pn)}</div>
            <div class="meta">
                <span>CRU: ${escapeHtml(part.cru_id)}</span>
                <span class="tag-model">Model: ${escapeHtml(part.model)}</span>
                <span class="tag-cat">${escapeHtml(part.category)}</span>
            </div>
        `;
        fragment.appendChild(div);
    }

    container.innerHTML = '';
    container.appendChild(fragment);
}

function updateAll() {
    // 1. Rebuild dropdowns and get sanitised current values
    const { validModel, validCategory } = refreshDropdowns();

    // 2. Commit sanitised values so getFilteredParts() uses them
    currentModel    = validModel;
    currentCategory = validCategory;

    // 3. Render with the now-correct filter state
    renderResults(getFilteredParts());
}

function setupDropdownFilters() {
    document.getElementById('modelSelect').addEventListener('change', e => {
        currentModel = e.target.value;
        // When model changes, reset category so we don't keep a category
        // that doesn't exist in the new model
        currentCategory = 'all';
        updateAll();
    });

    document.getElementById('categorySelect').addEventListener('change', e => {
        currentCategory = e.target.value;
        updateAll();
    });
}

function setupSearchButton() {
    const searchInput  = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    const performSearch = () => {
        currentSearchTerm = searchInput.value;
        updateAll();
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') performSearch();
    });
    searchInput.addEventListener('input', debounce(() => {
        currentSearchTerm = searchInput.value;
        updateAll();
    }, 250));
}

document.addEventListener('DOMContentLoaded', async () => {
    const success = await loadData();
    if (!success || allParts.length === 0) {
        document.getElementById('results').innerHTML =
            '<div class="no-results">Error loading FRU data. Please refresh the page.</div>';
        return;
    }

    setupDropdownFilters();
    setupSearchButton();
    document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
    updateAll();
});
