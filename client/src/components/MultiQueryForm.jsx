import React, { useState } from 'react';

/**
 * MultiQueryForm — Multi-Query Audit Input Component (P1 #9)
 */
const LOCATION_OPTIONS = [
  { label: 'United States (Default)', location: 'United States', gl: 'us' },
  { label: 'Mumbai, Maharashtra, India', location: 'Mumbai, Maharashtra, India', gl: 'in' },
  { label: 'Delhi, India', location: 'Delhi, India', gl: 'in' },
  { label: 'London, England, United Kingdom', location: 'London, England, United Kingdom', gl: 'uk' },
  { label: 'Tokyo, Japan', location: 'Tokyo, Japan', gl: 'jp' },
];

export default function MultiQueryForm({ onScan, loading }) {
  const [brand, setBrand] = useState('Sony WH-1000XM5');
  const [selectedLocation, setSelectedLocation] = useState('United States');
  const [competitor1, setCompetitor1] = useState('Bose QuietComfort Ultra');
  const [competitor2, setCompetitor2] = useState('Apple AirPods Max');
  const [competitor3, setCompetitor3] = useState('Sennheiser Momentum 4');
  const [queriesText, setQueriesText] = useState(
    'best noise cancelling headphones 2026\n' +
    'best headphones for travel\n' +
    'sony wh 1000xm5 vs bose qc ultra\n' +
    'top wireless noise cancelling headphones'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryList = queriesText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    if (queryList.length < 2) {
      alert('Please enter at least 2 search queries.');
      return;
    }

    const competitors = [competitor1, competitor2, competitor3].filter(c => c.trim().length > 0);
    const locObj = LOCATION_OPTIONS.find(l => l.location === selectedLocation) || LOCATION_OPTIONS[0];

    onScan({
      brand: brand.trim(),
      competitors,
      queries: queryList,
      location: locObj.location,
      gl: locObj.gl,
    });
  };

  const handlePreFillSample = () => {
    setBrand('Sony WH-1000XM5');
    setCompetitor1('Bose QuietComfort Ultra');
    setCompetitor2('Apple AirPods Max');
    setCompetitor3('Sennheiser Momentum 4');
    setQueriesText(
      'best noise cancelling headphones 2026\n' +
      'best headphones for working from home\n' +
      'sony wh 1000xm5 vs bose quietcomfort ultra\n' +
      'top wireless noise cancelling headphones review\n' +
      'best bluetooth headphones with clear microphone'
    );
  };

  return (
    <div className="sahara-card" id="multi-query-card">
      <div className="sahara-card__header">
        <div>
          <span className="sahara-card__step">P1 · Multi-Query Audit Engine</span>
          <h2 className="sahara-card__title">Multi-Query Visibility Scanner</h2>
        </div>
        <button
          type="button"
          className="chip-btn chip-btn--active"
          onClick={handlePreFillSample}
        >
          Load 5-Query Sample
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Brand Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="multi-brand-input">
            Target Brand / Product Name
            <span className="form-label__sub">Primary entity to audit</span>
          </label>
          <div className="input-with-icon">
            <span className="material-symbols-outlined input-icon">verified</span>
            <input
              id="multi-brand-input"
              type="text"
              className="form-input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Target Location */}
        <div className="form-group">
          <label className="form-label" htmlFor="multi-location-select">
            Target Location & Market (P2 #12)
            <span className="form-label__sub">SerpApi location & gl parameter</span>
          </label>
          <div className="input-with-icon">
            <span className="material-symbols-outlined input-icon">location_on</span>
            <select
              id="multi-location-select"
              className="form-input"
              style={{ appearance: 'auto', cursor: 'pointer' }}
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {LOCATION_OPTIONS.map(opt => (
                <option key={opt.location} value={opt.location}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Competitors */}
        <div className="form-group">
          <label className="form-label">
            Competitor Entities (Up to 3)
            <span className="form-label__sub">Comparative benchmarks</span>
          </label>
          <div className="competitors-grid">
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon">store</span>
              <input
                type="text"
                className="form-input"
                value={competitor1}
                onChange={(e) => setCompetitor1(e.target.value)}
                placeholder="Competitor 1"
              />
            </div>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon">store</span>
              <input
                type="text"
                className="form-input"
                value={competitor2}
                onChange={(e) => setCompetitor2(e.target.value)}
                placeholder="Competitor 2"
              />
            </div>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon">store</span>
              <input
                type="text"
                className="form-input"
                value={competitor3}
                onChange={(e) => setCompetitor3(e.target.value)}
                placeholder="Competitor 3"
              />
            </div>
          </div>
        </div>

        {/* Queries Textarea */}
        <div className="form-group">
          <label className="form-label" htmlFor="queries-textarea">
            Target Search Queries (2 - 10, One Per Line)
            <span className="form-label__sub">Multi-keyword SERP corpus</span>
          </label>
          <textarea
            id="queries-textarea"
            className="form-input"
            rows={5}
            style={{ paddingLeft: '14px', height: 'auto', fontFamily: 'monospace', fontSize: '13px' }}
            value={queriesText}
            onChange={(e) => setQueriesText(e.target.value)}
            placeholder="Enter search queries, one per line..."
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" />
              <span>Scanning {queriesText.split('\n').filter(Boolean).length} SERP Targets...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              <span>Calculate Multi-Query Visibility Score</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
