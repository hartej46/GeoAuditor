/**
 * Shared Utility Functions
 *
 * Centralized helpers used across components.
 * Import from here to avoid duplicating logic.
 */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Clean snippet text of raw ARIA UI labels, escaped markdown, and broken URLs.
 * @param {string} text
 * @returns {string}
 */
export function cleanSnippet(text) {
  if (!text) return '';
  return text
    .replace(/Go to product viewer dialog for this item\.?/gi, '')
    .replace(/Go to product viewer\.?/gi, '')
    .replace(/View product details\.?/gi, '')
    .replace(/Product viewer dialog\.?/gi, '')
    .replace(/\\([()[\]"'*_{}])/g, '$1')
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    .replace(/\(https?:\/\/[^\s)]+\)/g, '')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\(\s*\)/g, '')
    .trim();
}

/**
 * Reconciles brand name casing in source titles (e.g. MOMENTUM 4 -> Momentum 4)
 * @param {string} title
 * @param {string} entityName
 * @returns {string}
 */
export function normalizeEntityTitle(title, entityName) {
  if (!title || !entityName) return title || '';
  const regex = new RegExp(`(${escapeRegex(entityName)})`, 'i');
  return title.replace(regex, entityName);
}

/**
 * Highlight brand name occurrences in text with Sahara styled <mark> tags.
 * Returns raw HTML string — use with dangerouslySetInnerHTML.
 * @param {string} text - The snippet text
 * @param {string} brandName - The brand to highlight
 * @returns {string} HTML with <mark class="entity-highlight"> tags
 */
export function highlightBrand(text, brandName) {
  if (!text) return '';
  const cleaned = cleanSnippet(text);
  if (!brandName) return escapeHtml(cleaned);
  const escaped = escapeHtml(cleaned);
  const pattern = escapeRegex(escapeHtml(brandName));
  const regex = new RegExp(`(${pattern})`, 'gi');
  return escaped.replace(regex, '<mark class="entity-highlight">$1</mark>');
}
