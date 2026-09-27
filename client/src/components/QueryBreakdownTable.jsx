import React from 'react';
import VisibilityBadge from './VisibilityBadge';

/**
 * QueryBreakdownTable — Per-Query Results Breakdown Matrix (P1 #9)
 */
export default function QueryBreakdownTable({ data }) {
  if (!data || !data.perQuery) return null;

  const { brand, competitors = [], perQuery = [] } = data;

  return (
    <div className="matrix-card" style={{ marginTop: '24px' }}>
      <div style={{ padding: '20px 24px 16px 24px', borderBottom: '1px solid var(--outline-subtle)' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '20px', color: 'var(--on-surface)' }}>
          Per-Query Visibility Matrix
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
          Breakdown of AI Overview synthesis status across every target query.
        </p>
      </div>

      <table className="matrix-table">
        <thead>
          <tr>
            <th style={{ width: '35%' }}>Target Search Query</th>
            <th style={{ width: '20%' }}>
              {brand} <span className="you-pill">You</span>
            </th>
            {competitors.map((comp) => (
              <th key={comp} style={{ width: `${45 / (competitors.length || 1)}%` }}>
                {comp}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perQuery.map((row, idx) => (
            <tr key={idx}>
              <td>
                <strong style={{ color: 'var(--on-surface)', fontSize: '14px' }}>“{row.query}”</strong>
              </td>
              <td>
                <VisibilityBadge
                  found={row.brand.found}
                  foundInSources={row.brand.aiOverviewFound}
                />
              </td>
              {row.competitors.map((comp) => (
                <td key={comp.name}>
                  <VisibilityBadge
                    found={comp.found}
                    foundInSources={comp.aiOverviewFound}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
