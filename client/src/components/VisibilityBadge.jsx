/**
 * VisibilityBadge — Status pill for brand/competitor presence in AI answers.
 */
export default function VisibilityBadge({ found, foundInSources }) {
  if (found) {
    return (
      <span className="status-badge status-badge--visible">
        <span className="status-badge__dot" />
        <span>Found in AI Answer</span>
      </span>
    );
  }

  if (foundInSources) {
    return (
      <span className="status-badge status-badge--visible" style={{ color: 'var(--primary)', borderColor: 'var(--primary-fixed)' }}>
        <span className="status-badge__dot" />
        <span>Cited in Sources</span>
      </span>
    );
  }

  return (
    <span className="status-badge status-badge--missing">
      <span className="status-badge__dot" />
      <span>Not Found</span>
    </span>
  );
}
