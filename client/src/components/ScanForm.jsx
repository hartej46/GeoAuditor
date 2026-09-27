import { useState } from 'react';

/**
 * ScanForm — Sahara Warm Minimalism Form Component
 *
 * Implements:
 *  - Target search query with preset suggestion chips
 *  - Target brand input
 *  - Up to 3 competitor inputs
 *  - Demo fill presets
 *  - Primary burnt sienna CTA
 */
export default function ScanForm({ onScan, loading }) {
  const [query, setQuery] = useState('best noise cancelling headphones');
  const [brand, setBrand] = useState('Sony WH-1000XM5');
  const [competitors, setCompetitors] = useState([
    'Bose QuietComfort Ultra',
    'Apple AirPods Max',
    'Sennheiser Momentum 4',
  ]);

  function handleCompetitorChange(index, value) {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  }

  function handleDemoFill(type) {
    if (type === 'crm') {
      setQuery('best crm for small business');
      setBrand('HubSpot');
      setCompetitors(['Salesforce', 'Zoho CRM', 'Pipedrive']);
    } else {
      setQuery('best noise cancelling headphones');
      setBrand('Sony WH-1000XM5');
      setCompetitors([
        'Bose QuietComfort Ultra',
        'Apple AirPods Max',
        'Sennheiser Momentum 4',
      ]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!brand.trim() || !query.trim()) return;

    const filteredCompetitors = competitors
      .map((c) => c.trim())
      .filter(Boolean);

    onScan({
      brand: brand.trim(),
      competitors: filteredCompetitors,
      query: query.trim(),
    });
  }

  return (
    <div className="sahara-card">
      <div className="sahara-card__header">
        <div>
          <span className="sahara-card__step">Step 01 / Parameters</span>
          <h2 className="sahara-card__title">Audit Configuration</h2>
        </div>
        <span className="sahara-card__tag">Live SerpApi v2.4</span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Target Query */}
        <div className="form-group">
          <label className="form-label" htmlFor="query-input">
            <span>Target Query or Topic *</span>
            <span className="form-label__sub">Google US • en-US</span>
          </label>
          <div className="input-with-icon">
            <span className="material-symbols-outlined input-icon">travel_explore</span>
            <input
              id="query-input"
              type="text"
              className="form-input"
              placeholder="e.g., best noise cancelling headphones"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>

          {/* Suggestion Chips */}
          <div className="suggestion-chips">
            <span className="suggestion-label">Try:</span>
            <button
              type="button"
              className={`chip-btn ${query === 'best noise cancelling headphones' ? 'chip-btn--active' : ''}`}
              onClick={() => handleDemoFill('audio')}
            >
              "best noise cancelling headphones"
            </button>
            <button
              type="button"
              className={`chip-btn ${query === 'best crm for small business' ? 'chip-btn--active' : ''}`}
              onClick={() => handleDemoFill('crm')}
            >
              "best crm for small business"
            </button>
          </div>
        </div>

        {/* Your Brand */}
        <div className="form-group">
          <label className="form-label" htmlFor="brand-input">
            <span>Your Brand / Product Name *</span>
          </label>
          <div className="input-with-icon">
            <span className="material-symbols-outlined input-icon">domain</span>
            <input
              id="brand-input"
              type="text"
              className="form-input"
              placeholder="e.g., Sony WH-1000XM5 or HubSpot"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Competitors */}
        <div className="form-group">
          <label className="form-label">
            <span>Competitors (up to 3)</span>
            <span className="form-label__sub">Benchmarked in AI overview</span>
          </label>
          <div className="competitors-grid">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="input-with-icon">
                <span className="material-symbols-outlined input-icon">storefront</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Competitor ${idx + 1}`}
                  value={competitors[idx] || ''}
                  onChange={(e) => handleCompetitorChange(idx, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          id="btn-scan"
        >
          <span className="material-symbols-outlined text-[18px]">
            {loading ? 'progress_activity' : 'bolt'}
          </span>
          <span>{loading ? 'Analyzing AI Overview...' : 'Run Generative Audit'}</span>
        </button>
      </form>
    </div>
  );
}
