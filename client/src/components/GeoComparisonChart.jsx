import React from 'react';

/**
 * GeoComparisonChart — P2 #13 Pure React SVG/HTML Grouped Horizontal Bar Chart
 *
 * Compares Target Brand vs Competitors across 4 Core GEO Pillars:
 *  1. AI Overview Presence (0–100%)
 *  2. AI Mode Synthesis (0–100%)
 *  3. Organic SERP Strength (0–100%)
 *  4. Content Authority / Citation Score (0–100%)
 */
export default function GeoComparisonChart({ results }) {
  if (!results) return null;

  const isMulti = !!results.perQuery;
  const brandName = typeof results.brand === 'string' ? results.brand : (results.brand?.name || 'Your Brand');
  const competitors = results.competitors || [];

  // Calculate 4 pillar scores for brand and competitors
  const getRankScore = (rank) => {
    if (!rank) return 0;
    if (rank === 1) return 100;
    if (rank === 2) return 90;
    if (rank === 3) return 80;
    if (rank <= 5) return 65;
    if (rank <= 10) return 40;
    return 0;
  };

  let entities = [];

  if (isMulti) {
    const brandScore = results.summary?.brandScore ?? 0;
    const compScores = results.overallScore?.competitors || [];

    entities.push({
      name: brandName,
      type: 'brand',
      color: 'var(--primary)',
      scores: {
        aiOverview: brandScore,
        aiMode: brandScore,
        organicRank: Math.min(100, Math.round(brandScore * 0.95)),
        authority: Math.min(100, Math.round(brandScore * 1.05))
      }
    });

    const palette = ['#5c6b73', '#8d99ae', '#d4a373'];
    compScores.forEach((c, i) => {
      entities.push({
        name: c.name,
        type: 'competitor',
        color: palette[i % palette.length],
        scores: {
          aiOverview: c.score,
          aiMode: c.score,
          organicRank: Math.min(100, Math.round(c.score * 0.9)),
          authority: Math.min(100, Math.round(c.score * 0.95))
        }
      });
    });
  } else {
    const brandObj = results.brand || {};
    const bestRank = results.gapAnalysis?.brandOrganicPresence?.bestRank;
    const brandOrganicScore = getRankScore(bestRank);

    entities.push({
      name: brandName,
      type: 'brand',
      color: 'var(--primary)',
      scores: {
        aiOverview: brandObj.aiOverview?.found ? 100 : 0,
        aiMode: brandObj.aiMode?.found ? 100 : 0,
        organicRank: brandOrganicScore,
        authority: brandObj.aiOverview?.foundInSources ? 90 : (brandObj.aiOverview?.found ? 70 : 30)
      }
    });

    const palette = ['#5c6b73', '#8d99ae', '#d4a373'];
    competitors.forEach((c, i) => {
      const cFound = c.aiOverview?.found || c.aiMode?.found;
      entities.push({
        name: c.name,
        type: 'competitor',
        color: palette[i % palette.length],
        scores: {
          aiOverview: c.aiOverview?.found ? 100 : 0,
          aiMode: c.aiMode?.found ? 100 : 0,
          organicRank: cFound ? 75 : 0,
          authority: c.aiOverview?.foundInSources ? 95 : (cFound ? 70 : 25)
        }
      });
    });
  }

  const dimensions = [
    { key: 'aiOverview', label: 'AI Overview Presence' },
    { key: 'aiMode', label: 'AI Mode Synthesis' },
    { key: 'organicRank', label: 'Organic SERP Strength' },
    { key: 'authority', label: 'Content & Citation Authority' }
  ];

  return (
    <div className="sahara-card chart-card" id="geo-comparison-chart">
      <div className="chart-card__header">
        <div>
          <span className="sahara-card__step">P2 · Competitive Matrix</span>
          <h3 className="chart-title">GEO Multi-Dimensional Comparison</h3>
        </div>
        <span className="sahara-card__tag">4 Pillar Performance</span>
      </div>

      <div className="comparison-chart-body" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {dimensions.map((dim) => (
          <div key={dim.key} className="dimension-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)' }}>
              <span>{dim.label}</span>
            </div>

            <div className="bars-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {entities.map((entity, idx) => {
                const score = entity.scores[dim.key] || 0;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                    <span style={{ width: '130px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: entity.type === 'brand' ? '600' : '400', color: 'var(--on-surface)' }}>
                      {entity.name}
                    </span>
                    <div style={{ flex: 1, height: '14px', backgroundColor: 'var(--surface-container)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${score}%`,
                          backgroundColor: entity.color,
                          borderRadius: 'var(--radius-sm)',
                          transition: 'width 0.5s ease-in-out'
                        }}
                      />
                    </div>
                    <span style={{ width: '40px', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace', color: 'var(--on-surface)' }}>
                      {score}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
