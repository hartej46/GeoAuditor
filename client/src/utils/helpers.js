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
 * Highlight brand name occurrences in text with Sahara styled <mark> tags.
 * Returns raw HTML string — use with dangerouslySetInnerHTML.
 * @param {string} text - The snippet text
 * @param {string} brandName - The brand to highlight
 * @returns {string} HTML with <mark class="entity-highlight"> tags
 */
export function highlightBrand(text, brandName) {
  if (!text) return '';
  if (!brandName) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const pattern = escapeRegex(escapeHtml(brandName));
  const regex = new RegExp(`(${pattern})`, 'gi');
  return escaped.replace(regex, '<mark class="entity-highlight">$1</mark>');
}
