import React from 'react';
import ExportToolbar from './ExportToolbar';

/**
 * VisibilityScoreCard — Large Prominent Score Gauge & Competitor Scores (P1 #9)
 */
export default function VisibilityScoreCard({ data }) {
  if (!data || !data.summary) return null;

  const { brandScore, totalQueries, brandVisibleIn, bestCompetitor } = data.summary;
  const brandName = data.brand;
  const competitorScores = data.overallScore?.competitors || [];

  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--success-text)';
    if (score >= 40) return 'var(--primary)';
    return 'var(--danger-text)';
  };

  return (
    <div className="visibility-score-card" style={{ marginBottom: '32px' }}>
      <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="results-header__eyebrow">P1 · Aggregate Benchmark</div>
          <h2 className="results-header__title">Multi-Query Visibility Score</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>
            Overall AI synthesis presence score across {totalQueries} monitored target search queries.
          </p>
        </div>
        <ExportToolbar data={data} type="multi" />
      </div>

      <div className="score-hero-grid">
        {/* Main Brand Score Card */}
        <div className="score-main-box">
          <div className="score-badge-label">{brandName ? `${brandName} GEO Score` : 'Target Brand GEO Score'}</div>
          <div className="score-number-display" style={{ color: getScoreColor(brandScore) }}>
            {brandScore}%
          </div>
          <div className="score-status-text">
            Visible in <strong>{brandVisibleIn} of {totalQueries}</strong> AI answer summaries
          </div>
        </div>

        {/* Competitor Benchmark Column */}
        <div className="score-competitors-box">
          <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)' }}>
            Competitor Visibility Benchmark
          </h4>
          <div className="competitor-score-list">
            {competitorScores.map((comp) => (
              <div key={comp.name} className="competitor-score-row">
                <div className="comp-score-info">
                  <span className="comp-name">{comp.name}</span>
                  <span className="comp-visible-count">{comp.visibleIn}/{totalQueries} queries</span>
                </div>
                <div className="comp-bar-wrapper">
                  <div
                    className="comp-bar-fill"
                    style={{
                      width: `${comp.score}%`,
                      backgroundColor: comp.name === bestCompetitor ? 'var(--primary)' : 'var(--outline)'
                    }}
                  />
                </div>
                <span className="comp-score-percent">{comp.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
