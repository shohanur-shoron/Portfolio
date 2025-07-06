// static/js/theme_manager.js

const THEMES = ['matrix', 'solarized', 'amber', 'retro', 'vaporwave', 'light', 'monokai', 'dracula', 'high-contrast'];
const LOCAL_STORAGE_THEME_KEY = 'terminal-theme';

/**
 * Applies the specified theme to the document body.
 * Saves the theme preference to local storage.
 * @param {string} themeName - The name of the theme to apply (e.g., 'matrix', 'solarized').
 */
export function applyTheme(themeName) {
    if (!THEMES.includes(themeName)) {
        console.warn(`Theme "${themeName}" not found. Applying default 'matrix' theme.`);
        themeName = 'matrix'; // Fallback to default
    }
    document.body.className = `theme-${themeName}`;
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, `theme-${themeName}`);
}

/**
 * Loads the saved theme from local storage and applies it.
 * If no theme is saved, applies the default 'matrix' theme.
 */
export function loadSavedTheme() {
    const savedThemeClass = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    if (savedThemeClass) {
        // Extract theme name from class (e.g., 'theme-matrix' -> 'matrix')
        const themeName = savedThemeClass.replace('theme-', '');
        applyTheme(themeName);
    } else {
        applyTheme('matrix'); // Apply default theme if none saved
    }
}

/**
 * Returns an HTML string listing all available themes.
 * @returns {string} HTML string for displaying themes.
 */
export function getThemeListHtml() {
    let outputHtml = 'Available themes:<br><ul>';
    THEMES.forEach(theme => {
        outputHtml += `<li>${theme}</li>`;
    });
    outputHtml += '</ul>';
    return outputHtml;
}

/**
 * Returns the list of available theme names.
 * @returns {string[]} An array of theme names.
 */
export function getAvailableThemes() {
    return THEMES;
}
