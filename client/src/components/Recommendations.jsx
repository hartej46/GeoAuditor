import React from 'react';

/**
 * Recommendations — Sahara Warm Minimalism Actionable Recommendations Component (P1 #8)
 *
 * Displays prioritized recommendations list to improve AI visibility.
 */
export default function Recommendations({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="recommendations-section" id="recommendations-section" style={{ marginTop: '40px' }}>
      {/* Header */}
      <div className="results-header">
        <div className="results-header__eyebrow">P1 · Action Plan</div>
        <h2 className="results-header__title">Actionable GEO Recommendations</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>
          Prioritized strategy to optimize content structure, authority, and organic search presence for AI Overview inclusion.
        </p>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((rec) => (
          <div key={rec.priority} className="recommendation-card">
            <div className="rec-priority-badge">{rec.priority}</div>
            <div className="rec-content">
              <div className="rec-header">
                <h3 className="rec-action">{rec.action}</h3>
                <div className="rec-tags">
                  <span className={`tag tag--impact-${rec.impact}`}>
                    Impact: {rec.impact.toUpperCase()}
                  </span>
                  <span className={`tag tag--effort-${rec.effort}`}>
                    Effort: {rec.effort.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="rec-detail">{rec.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
