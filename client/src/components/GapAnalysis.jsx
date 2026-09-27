import React from 'react';

/**
 * GapAnalysis — Sahara Warm Minimalism Gap Analysis Component (P1 #7)
 *
 * Displays structural gap analysis explaining why brand is missing from AI Overview.
 */
export default function GapAnalysis({ gapAnalysis, brandName, brandFound: _brandFound }) {
  if (!gapAnalysis) return null;

  const { brandOrganicPresence, citedSourceAnalysis, structuralGaps } = gapAnalysis;

  return (
    <section className="gap-analysis-section" id="gap-analysis-section" style={{ marginTop: '40px' }}>
      {/* Header */}
      <div className="results-header">
        <div className="results-header__eyebrow">P1 · Structural Analysis</div>
        <h2 className="results-header__title">Why You're Missing</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>
          Comparative structural gap analysis of <strong style={{ color: 'var(--on-surface)' }}>{brandName}</strong> organic presence vs. cited AI Overview sources.
        </p>
      </div>

      {/* Summary Cards Row */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-card__label">Organic Footprint</div>
          <div className="metric-card__value" style={{ color: brandOrganicPresence?.found ? 'var(--primary)' : 'var(--danger-text)' }}>
            {brandOrganicPresence?.found ? `RANK #${brandOrganicPresence.bestRank}` : 'UNRANKED'}
          </div>
          <div className="metric-card__desc">
            {brandOrganicPresence?.found
              ? `Found ${brandOrganicPresence.pages.length} organic result(s) in top 10`
              : 'No pages found in top 10 organic results'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">AI Cited Outlets</div>
          <div className="metric-card__value" style={{ color: 'var(--on-surface)' }}>
            {citedSourceAnalysis?.totalCited || 0} Sources
          </div>
          <div className="metric-card__desc">
            Primary reference links synthesized by Google AI
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">Structural Gaps</div>
          <div className="metric-card__value" style={{ color: structuralGaps?.length > 0 ? 'var(--warning-text, #d97706)' : 'var(--primary)' }}>
            {structuralGaps?.length || 0} Identified
          </div>
          <div className="metric-card__desc">
            Content & authority gaps impacting AI synthesis selection
          </div>
        </div>
      </div>

      {/* Gaps List */}
      {structuralGaps && structuralGaps.length > 0 ? (
        <div className="gaps-list">
          {structuralGaps.map((gap, idx) => (
            <div key={idx} className={`gap-card gap-card--${gap.severity}`}>
              <div className="gap-card__header">
                <span className={`severity-badge severity-badge--${gap.severity}`}>
                  {gap.severity.toUpperCase()} SEVERITY
                </span>
                <h3 className="gap-card__title">{gap.title}</h3>
              </div>
              <p className="gap-card__explanation">{gap.explanation}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="sahara-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          No major structural gaps detected! Your brand has solid organic search positioning.
        </div>
      )}

      {/* Cited Sources List */}
      {citedSourceAnalysis?.sources && citedSourceAnalysis.sources.length > 0 && (
        <div className="matrix-card" style={{ marginTop: '24px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--on-surface)' }}>
            Sources Cited in Google AI Overview:
          </h4>
          <ul className="cited-sources-list">
            {citedSourceAnalysis.sources.map((src, i) => (
              <li key={i} className="cited-source-item">
                <span className="cited-source-domain">{src.domain}</span>
                <a href={src.link} target="_blank" rel="noopener noreferrer" className="cited-source-link">
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
