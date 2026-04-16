# FRU Parts Database – ThinkPad X240/X250/X260/X270

A web‑based search tool for FRU (Field Replaceable Unit) parts of Lenovo ThinkPad X240, X250, X260, and X270 laptops. The application loads a JSON dataset, allows filtering by model and category, and provides a search‑as‑you‑type field. It is fully client‑side, uses local storage for caching, and respects the system’s light/dark theme preference.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
  - [Searching](#searching)
  - [Filtering](#filtering)
  - [Results Display](#results-display)
- [Project Structure](#project-structure)
- [Data Format](#data-format)
- [Customisation](#customisation)
  - [Adding New Models](#adding-new-models)
  - [Updating Categories](#updating-categories)
  - [Styling](#styling)
- [Browser Support](#browser-support)
- [Troubleshooting & Debugging](#troubleshooting--debugging)
- [Developer Notes](#developer-notes)
- [License](#license)

## Overview

The FRU database tool helps technicians, system administrators, and ThinkPad enthusiasts quickly locate the correct FRU part number, CRU ID, and description for components of X240, X250, X260, and X270 laptops. The interface is minimal, keyboard‑friendly, and works offline after the first successful data load (thanks to `localStorage` caching).

## Features

- **Model dropdown** – filter parts by X240, X250, X260, X270, or view all models.
- **Category dropdown** – narrow results by part type (e.g. AC Adapters, Keyboards, LCD Panels, Planars).
- **Search field** – instant (debounced) search across FRU part number, CRU ID, description, model and category.
- **Local storage caching** – after the first load, the JSON data is stored in the browser to reduce network requests.
- **Responsive layout** – works on desktop, tablet and mobile screens.
- **Dark mode support** – automatically adapts to the user’s operating system preference.
- **Accessibility** – semantic HTML, keyboard navigation, and focus outlines.

## Installation & Setup

1. **Clone or download** the project files to a web server or local folder.
2. **Prepare the data** – place a valid `fru_parts.json` file inside the `data/` directory.  
   (See [Data Format](#data-format) for the required structure.)
3. **Serve the files** – any static web server works:
   - Use `python -m http.server 8000` in the project root.
   - Or open `index.html` directly in a browser (may cause CORS issues with `fetch` if not served over HTTP).
4. **Verify** – open the application in a browser. The console will log the number of loaded parts.

## Usage

### Searching

- Type any keyword (e.g., “keyboard”, “45N0254”, “SSD”) into the search box.
- Results update automatically while you type (300 ms debounce).
- Press the **Search** button or hit **Enter** for an immediate search (useful if you prefer explicit actions).

### Filtering

- **Model** – select a specific ThinkPad model from the dropdown. Choose “All Models” to see parts from every supported model.
- **Category** – select a part category (e.g., “BATTERIES”, “PLANARS”). Choose “All Categories” to disable category filtering.

Filters are combined with the search term using **AND** logic.  
Example: “X240” + “BATTERIES” + search for “45N” → only X240 batteries that contain “45N” in any field.

### Results Display

- Each result card shows:
  - **Description** (title)
  - **FRU part number**
  - **CRU ID** (1 = user replaceable, N = not user replaceable)
  - **Model** and **Category** as badges.
- The header displays the number of results and the active model/category.

## Project Structure

```
project/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── utils.js
├── data/
│   └── fru_parts.json
└── README.md
```

- `index.html` – main page structure and dropdown options.
- `css/style.css` – all styling, including light/dark themes and responsive behaviour.
- `js/app.js` – application logic: data loading, filtering, event handling, and rendering.
- `js/utils.js` – helper functions (`escapeHtml`, `debounce`).
- `data/fru_parts.json` – the FRU dataset (must be provided by the user).

## UI Screenshot
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/fb5b080c-bbd3-4069-8b67-749b23e8fb81" />


## Data Format

The JSON file must contain an array of objects, each with the following properties:

| Property      | Type   | Description                                           |
|---------------|--------|-------------------------------------------------------|
| `fru_pn`      | string | FRU part number (e.g. `"45N0254"`)                   |
| `cru_id`      | string | CRU identifier (`"1"`, `"2"`, `"N"`, etc.)           |
| `description` | string | Human‑readable description of the part               |
| `category`    | string | Exact category name (must match dropdown options)    |
| `model`       | string | Model name (`"X240"`, `"X250"`, `"X260"`, `"X270"`) |

Example entry:

```json
{
  "fru_pn": "45N0254",
  "cru_id": "1",
  "description": "Common Delta 65W 3pin AC Adapter",
  "category": "AC ADAPTERS",
  "model": "X240"
}
```

> The category values in the JSON **must exactly match** the `<option>` values in `index.html`. The provided HTML already lists all categories found in the original data. If you add new categories, update the dropdown accordingly.

## Customisation

### Adding New Models

1. Edit `index.html` – add a new `<option value="X280">X280</option>` inside the model `<select>`.
2. Ensure your JSON data includes parts with `"model": "X280"`.
3. No further code changes are required – the filtering logic is generic.

### Updating Categories

- **Add a category** – insert a new `<option value="NEW CATEGORY">New Category</option>` in the category dropdown.
- **Remove a category** – delete the corresponding `<option>`. The script will still filter parts that have that category, but users will not be able to select it. To avoid confusion, either keep the dropdown synchronised with the data or use the “All Categories” option.

### Styling

- All CSS variables are defined in the `:root` selector. Modify colours, borders, or spacing there.
- Dark mode variables are inside `@media (prefers-color-scheme: dark)`. Override them to change the dark theme.
- The `.filter-select` class controls the dropdown appearance.

## Browser Support

The application works in all modern browsers that support:

- ES6 (JavaScript modules, `fetch`, `localStorage`)
- CSS custom properties
- Dark mode media query

Tested in:
- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Troubleshooting & Debugging

### Data does not load

- **Check the console** (F12 → Console). Look for “Failed to load data” or HTTP errors.
- **Verify the JSON path** – `DATA_URL` in `app.js` is `'data/fru_parts.json'`. Ensure the file exists and is valid JSON.
- **CORS issue** – if you open `index.html` directly from the file system (`file://` protocol), the `fetch` may be blocked. Use a local web server.
- **Clear local storage** – if an old or corrupt cache prevents reload, open DevTools → Application → Local Storage → delete the `fru_data` entry, then refresh.

### Filters or search don’t work

- **Confirm that the data loaded** – look for the console message “Loaded X parts from cache”.
- **Check category matching** – category names in the JSON must be identical to the `<option>` values (case‑sensitive). For example, `"AC ADAPTERS"` in JSON and `"AC ADAPTERS"` in the dropdown.
- **Model filtering** – the script uses `part.model === currentModel`. Ensure the model strings in the JSON match the dropdown values (`X240`, `X250`, etc.).

### Search is slow

- The dataset size is moderate (a few thousand entries). The debounced search (300 ms) prevents excessive re‑renders. If you experience lag with a very large dataset, consider increasing the debounce delay or moving filtering to a Web Worker.

### No dark mode

- The system dark mode is detected automatically. To force a theme, override the CSS variables in a custom class (not provided by default).

## Developer Notes

- **`debounce` function** – imported from `utils.js` and applied to the search input `input` event. The delay is 300 milliseconds.
- **Local storage cache** – stored under the key `fru_data`. The cache is used only if the `fetch` fails (e.g., offline). To force a refresh, call `localStorage.removeItem('fru_data')` before loading the page.
- **Rendering** – results are built using `document.createDocumentFragment` for performance.
- **HTML escaping** – all user‑supplied data (from JSON) is escaped via `escapeHtml` to prevent XSS.

## License

This project is provided as‑is for internal or educational use. No warranty is expressed or implied. The data (FRU part information) is property of Lenovo and its suppliers; ensure you have the right to use and distribute it. The code itself is free to use under the MIT License.

---

For further questions or contributions, please refer to the inline comments in `app.js` and `utils.js`.
