import React from 'react';

/**
 * ShareOfVoiceChart — P2 #13 Pure React SVG Donut / Ring Chart
 *
 * Visualizes competitive Share of Voice (AI answer synthesis mentions & citations)
 * between the target brand and competitors without external library dependencies.
 */
export default function ShareOfVoiceChart({ results }) {
  if (!results) return null;

  const isMulti = !!results.perQuery;
  const brandName = typeof results.brand === 'string' ? results.brand : (results.brand?.name || 'Your Brand');
  const competitors = results.competitors || [];

  // Calculate mention / citation share
  let entities = [];

  if (isMulti) {
    const brandScore = results.summary?.brandScore ?? results.overallScore?.brand ?? 0;
    const compScores = results.overallScore?.competitors || [];

    entities.push({
      name: brandName,
      type: 'brand',
      score: brandScore,
      count: results.summary?.brandVisibleIn || 0,
      color: 'var(--primary)',
    });

    const palette = ['#5c6b73', '#8d99ae', '#d4a373'];
    compScores.forEach((c, i) => {
      entities.push({
        name: c.name,
        type: 'competitor',
        score: c.score,
        count: c.visibleIn || 0,
        color: palette[i % palette.length],
      });
    });
  } else {
    const brandObj = results.brand || {};
    const brandCount = (brandObj.aiOverview?.found ? 2 : 0) + (brandObj.aiMode?.found ? 2 : 0) + (brandObj.aiOverview?.snippets?.length || 0);

    entities.push({
      name: brandName,
      type: 'brand',
      score: brandCount,
      count: brandCount,
      color: 'var(--primary)',
    });

    const palette = ['#5c6b73', '#8d99ae', '#d4a373'];
    competitors.forEach((c, i) => {
      const cCount = (c.aiOverview?.found ? 2 : 0) + (c.aiMode?.found ? 2 : 0) + (c.aiOverview?.snippets?.length || 0);
      entities.push({
        name: c.name,
        type: 'competitor',
        score: cCount,
        count: cCount,
        color: palette[i % palette.length],
      });
    });
  }

  const totalScore = entities.reduce((acc, curr) => acc + curr.score, 0);

  // Compute percentage shares
  const slices = entities.map(e => {
    const percent = totalScore > 0 ? Math.round((e.score / totalScore) * 100) : Math.round(100 / entities.length);
    return { ...e, percent };
  });

  // SVG Donut Calculations
  const radius = 65;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="sahara-card chart-card" id="share-of-voice-chart">
      <div className="chart-card__header">
        <div>
          <span className="sahara-card__step">P2 · Visual Intelligence</span>
          <h3 className="chart-title">AI Share of Voice</h3>
        </div>
        <span className="sahara-card__tag">Synthesis Mention Share</span>
      </div>

      <div className="donut-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', marginTop: '16px' }}>
        {/* SVG Donut Ring */}
        <div style={{ position: 'relative', width: '160px', height: '160px' }}>
          <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="var(--surface-container)"
              strokeWidth={strokeWidth}
            />
            {slices.map((slice, idx) => {
              const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += slice.percent;

              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              );
            })}
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '24px', fontWeight: '600', color: 'var(--on-surface)', lineHeight: 1 }}>
              {slices[0]?.percent || 0}%
            </span>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
              Brand Share
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="donut-legend" style={{ flex: '1', minWidth: '160px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {slices.map((slice, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: slice.color, display: 'inline-block' }} />
                  <strong style={{ color: 'var(--on-surface)', fontWeight: '500' }}>{slice.name}</strong>
                  {slice.type === 'brand' && <span className="you-pill" style={{ fontSize: '9px', padding: '1px 5px' }}>You</span>}
                </div>
                <span style={{ fontWeight: '600', color: 'var(--on-surface-variant)', fontFamily: 'monospace' }}>
                  {slice.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
