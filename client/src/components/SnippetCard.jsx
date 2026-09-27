import { highlightBrand, normalizeEntityTitle } from '../utils/helpers';

/**
 * SnippetCard — Displays matching snippets and cited sources in Sahara design.
 */
export default function SnippetCard({ entityName, aiOverview, aiMode }) {
  const allSnippets = [
    ...(aiOverview?.snippets || []).map((text) => ({ source: 'AI Overview', text })),
    ...(aiMode?.snippets || []).map((text) => ({ source: 'AI Mode', text })),
  ];

  const allSources = [
    ...(aiOverview?.matchedSources || []).map((title) => ({ source: 'AI Overview', title })),
    ...(aiMode?.matchedSources || []).map((title) => ({ source: 'AI Mode', title })),
  ];

  if (allSnippets.length === 0 && allSources.length === 0) {
    return <span style={{ color: 'var(--outline)', fontSize: '13px' }}>Not mentioned in AI answers</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {allSnippets.slice(0, 2).map((snippet, i) => (
        <div
          key={i}
          style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: 'var(--on-surface-variant)',
            backgroundColor: 'var(--surface-container-low)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '2px solid var(--primary)',
          }}
          dangerouslySetInnerHTML={{ __html: highlightBrand(snippet.text, entityName) }}
        />
      ))}

      {allSources.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
          {allSources.map((source, i) => (
            <span
              key={i}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-container)',
                color: 'var(--on-surface-variant)',
                border: '1px solid var(--outline-variant)',
              }}
            >
              🔗 {normalizeEntityTitle(source.title, entityName)} ({source.source})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
