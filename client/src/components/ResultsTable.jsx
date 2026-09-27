import DataNotice from './DataNotice';
import VisibilityBadge from './VisibilityBadge';
import SnippetCard from './SnippetCard';
import ExportToolbar from './ExportToolbar';

/**
 * ResultsTable — Sahara Warm Minimalism Results Component
 *
 * Implements:
 *  - Metric stat summary cards (Brand status, AI overview, Total monitored)
 *  - Competitor comparison matrix table
 *  - Matching snippet cards with entity highlights
 *  - Data availability indicators
 *  - Export toolbar for Print/PDF and Markdown
 */
export default function ResultsTable({ data }) {
  const brand = data.brand;
  const competitors = data.competitors || [];

  const entities = [
    { name: brand.name, type: 'brand', aiOverview: brand.aiOverview, aiMode: brand.aiMode },
    ...competitors.map((c) => ({
      name: c.name,
      type: 'competitor',
      aiOverview: c.aiOverview,
      aiMode: c.aiMode,
    })),
  ];

  const brandFound = brand?.aiOverview?.found || brand?.aiMode?.found;

  return (
    <section className="results-section" id="results-section">
      {/* Executive Print-Only Header for PDF Exports */}
      <div className="print-executive-header print-only">
        <div className="print-executive-header__top">
          <div>
            <div className="print-executive-header__logo">⚡ GEO Auditor</div>
            <div className="print-executive-header__subtitle">Generative Engine Optimization — Executive Audit Report</div>
          </div>
          <div className="print-executive-header__meta-right">
            <div><strong>Audit Date:</strong> {new Date(data.timestamp || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            <div><strong>Engine:</strong> Google AI Overview & AI Mode via SerpApi</div>
            <div><strong>Environment:</strong> {data.demoMode ? 'Verified Sandbox Fixture' : 'Live SerpApi SERP Engine'}</div>
          </div>
        </div>
        <div className="print-executive-header__details">
          <div className="print-meta-pill"><strong>Target Brand:</strong> {brand?.name || 'Brand'}</div>
          <div className="print-meta-pill"><strong>Target Query:</strong> “{data.query}”</div>
          <div className="print-meta-pill"><strong>Location:</strong> {data.location || 'United States'}</div>
          <div className="print-meta-pill"><strong>Status:</strong> {brandFound ? 'VISIBLE IN AI SYNTHESIS' : 'NOT FOUND IN AI SYNTHESIS'}</div>
        </div>
      </div>

      {/* Header with Export Toolbar */}
      <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="results-header__eyebrow">Entity Landscape · SERP Target #1</div>
          <h2 className="results-header__title">Competitor Visibility Matrix</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>
            Evaluation of generative search answers for target query: <strong style={{ color: 'var(--on-surface)' }}>“{data.query}”</strong>
            <span className="you-pill" style={{ marginLeft: '10px', backgroundColor: 'var(--secondary-container)', color: 'var(--on-surface)' }}>
              📍 {data.location || 'United States'}
            </span>
          </p>
        </div>
        <ExportToolbar data={data} type="single" />
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card__label">Your Brand Status</div>
          <div className="metric-card__value" style={{ color: brandFound ? 'var(--primary)' : 'var(--danger-text)' }}>
            {brandFound ? 'VISIBLE' : 'MISSING'}
          </div>
          <div className="metric-card__desc">
            {brandFound ? 'Appears in Google AI synthesis answers' : 'Not synthesized in Google AI answers'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">AI Engine Response</div>
          <div className="metric-card__value" style={{ color: 'var(--on-surface)' }}>
            {data.dataAvailability?.aiOverview ? 'OVERVIEW ACTIVE' : 'STANDARD SERP'}
          </div>
          <div className="metric-card__desc">
            Google AI Overview & AI Mode synthesize blocks
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">Entities Monitored</div>
          <div className="metric-card__value" style={{ color: 'var(--on-surface)' }}>
            {entities.length} Brands
          </div>
          <div className="metric-card__desc">
            1 target brand vs {competitors.length} competitors
          </div>
        </div>
      </div>

      <DataNotice demoMode={data.demoMode} dataAvailability={data.dataAvailability} />

      {/* Comparison Matrix Table */}
      <div className="matrix-card">
        <table className="matrix-table" id="comparison-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Entity Name</th>
              <th style={{ width: '18%' }}>AI Overview</th>
              <th style={{ width: '18%' }}>AI Mode</th>
              <th style={{ width: '39%' }}>Matching Synthesized Snippet</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => (
              <tr key={`${entity.type}-${entity.name}`} className={entity.type === 'brand' ? 'brand-row' : ''}>
                <td>
                  <div className="entity-cell">
                    <strong style={{ color: 'var(--on-surface)', fontWeight: '600' }}>{entity.name}</strong>
                    {entity.type === 'brand' && <span className="you-pill">You</span>}
                  </div>
                </td>
                <td>
                  <VisibilityBadge
                    found={entity.aiOverview?.found}
                    foundInSources={entity.aiOverview?.foundInSources || entity.aiOverview?.inSources}
                  />
                </td>
                <td>
                  <VisibilityBadge
                    found={entity.aiMode?.found}
                    foundInSources={entity.aiMode?.foundInSources || entity.aiMode?.inSources}
                  />
                </td>
                <td>
                  <SnippetCard
                    entityName={entity.name}
                    aiOverview={entity.aiOverview}
                    aiMode={entity.aiMode}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Executive Print Footer for A4 */}
      <div className="print-footer print-only">
        <span>Generated by GEO Auditor · Powered by SerpApi (Google AI Overview & AI Mode)</span>
        <span>A4 Format · Confidential Audit Report</span>
      </div>
    </section>
  );
}
