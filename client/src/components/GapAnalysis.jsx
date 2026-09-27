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
    <section className="gap-analysis-section" id="gap-analysis-section">
      {/* Header */}
      <div className="results-header">
        <div className="results-header__eyebrow">P1 · Structural Analysis</div>
        <h2 className="results-header__title">Why You're Missing</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '6px', lineHeight: '1.5' }}>
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
          <div className="metric-card__label">Brand Citations in AI</div>
          <div className="metric-card__value" style={{ color: (gapAnalysis.overlap?.brandPagesCited?.length || 0) > 0 ? 'var(--primary)' : 'var(--danger-text)' }}>
            {(gapAnalysis.overlap?.brandPagesCited?.length || 0) > 0
              ? `${gapAnalysis.overlap.brandPagesCited.length} Cited Sources`
              : '0 sources cite your brand'}
          </div>
          <div className="metric-card__desc">
            {citedSourceAnalysis?.totalCited || 0} external media sources cited in AI answer
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

      {/* Cited Sources Showcase (Live SerpApi Citations) */}
      {citedSourceAnalysis?.sources && citedSourceAnalysis.sources.length > 0 && (
        <div className="matrix-card cited-sources-container" style={{ marginTop: '28px', padding: '24px' }}>
          <div className="cited-sources-header">
            <div>
              <h4 className="cited-sources-title">
                Sources Cited in Google AI Overview
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                Live reference network crawled by SerpApi. These {citedSourceAnalysis.sources.length} third-party review publications and media domains were cited by Google's generative AI engine for this search query.
              </p>
            </div>
            <div className="cited-sources-badge">
              <span>✓</span>
              <span>{citedSourceAnalysis.sources.length} Verified Live Citations</span>
            </div>
          </div>

          <div className="cited-sources-grid">
            {citedSourceAnalysis.sources.map((src, i) => (
              <div key={i} className="cited-source-card">
                <div>
                  <div className="cited-source-card__meta">
                    <span className="cited-source-card__source">{src.source || src.domain}</span>
                    <span className="cited-source-card__domain">{src.domain}</span>
                  </div>
                  <a
                    href={src.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cited-source-card__title"
                    title={src.title || src.link}
                  >
                    {src.title || `${src.source || src.domain} Article Reference`} ↗
                  </a>
                </div>
                {src.snippet && (
                  <div className="cited-source-card__snippet">
                    “{src.snippet}”
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
