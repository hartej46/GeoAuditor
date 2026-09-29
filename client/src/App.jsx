import { useState, useEffect } from 'react';
import ScanForm from './components/ScanForm';
import ResultsTable from './components/ResultsTable';
import GapAnalysis from './components/GapAnalysis';
import Recommendations from './components/Recommendations';
import MultiQueryForm from './components/MultiQueryForm';
import VisibilityScoreCard from './components/VisibilityScoreCard';
import QueryBreakdownTable from './components/QueryBreakdownTable';
import AuditHistory from './components/AuditHistory';
import ShareOfVoiceChart from './components/ShareOfVoiceChart';
import GeoComparisonChart from './components/GeoComparisonChart';
import { useScan } from './hooks/useScan';
import { apiUrl } from './utils/api';
import './App.css';

/**
 * App — Root Application with Stitch Sahara Warm Minimalism Shell & Navigation Tabs
 */
export default function App() {
  const { results, loading, error, runScan, setResults } = useScan();
  const [activeTab, setActiveTab] = useState('audit-scanner');
  const [showVisualSummary, setShowVisualSummary] = useState(false);
  const [multiResults, setMultiResults] = useState(null);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError, setMultiError] = useState(null);
  const [isLiveApi, setIsLiveApi] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/health'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.serpApiKeySet) {
          setIsLiveApi(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (results && results.demoMode !== undefined) {
      setIsLiveApi(!results.demoMode);
    } else if (multiResults && multiResults.demoMode !== undefined) {
      setIsLiveApi(!multiResults.demoMode);
    }
  }, [results, multiResults]);

  const handleMultiScan = async (params) => {
    setMultiLoading(true);
    setMultiError(null);
    try {
      const response = await fetch(apiUrl('/api/scan/multi'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Multi scan failed');
      setMultiResults(data);
    } catch (err) {
      setMultiError(err.message);
    } finally {
      setMultiLoading(false);
    }
  };

  const handleLoadAudit = async (item) => {
    let payload = item.fullData;
    if (!payload && item.id) {
      try {
        const res = await fetch(apiUrl(`/api/scans/${item.id}`));
        if (res.ok) payload = await res.json();
      } catch (err) {
        console.error('[App] Failed to load scan payload:', err.message);
      }
    }
    if (payload) {
      if (item.type === 'multi' || payload.perQuery) {
        setMultiResults(payload);
        setActiveTab('multi-query-score');
      } else {
        setResults(payload);
        setActiveTab('audit-scanner');
      }
    }
  };

  const handleReRunAudit = (item) => {
    if (item.type === 'multi') {
      setActiveTab('multi-query-score');
      const queries = item.fullData?.perQuery?.map(q => q.query) || ['best noise cancelling headphones 2026', 'best headphones for travel'];
      const competitors = item.fullData?.competitors || ['Bose QuietComfort Ultra', 'Apple AirPods Max'];
      handleMultiScan({
        brand: item.brand,
        competitors,
        queries
      });
    } else {
      setActiveTab('audit-scanner');
      const competitors = item.fullData?.competitors?.map(c => c.name) || ['Bose QuietComfort Ultra', 'Apple AirPods Max'];
      runScan({
        brand: item.brand,
        competitors,
        query: item.query
      });
    }
  };

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="top-nav__container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="/" className="top-nav__brand">
              <div className="top-nav__logo-icon">⚡</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="top-nav__title">GEO Auditor</span>
                  <span className="top-nav__badge">BETA · SerpApi</span>
                </div>
              </div>
            </a>

            {/* Nav Tabs */}
            <nav className="top-nav__tabs">
              <button
                type="button"
                className={`nav-tab ${activeTab === 'audit-scanner' ? 'nav-tab--active' : ''}`}
                onClick={() => setActiveTab('audit-scanner')}
              >
                Audit Scanner
              </button>
              <button
                type="button"
                className={`nav-tab ${activeTab === 'competitor-matrix' ? 'nav-tab--active' : ''}`}
                onClick={() => setActiveTab('competitor-matrix')}
              >
                Competitor Matrix
              </button>
              <button
                type="button"
                className={`nav-tab ${activeTab === 'gap-analysis' ? 'nav-tab--active' : ''}`}
                onClick={() => setActiveTab('gap-analysis')}
              >
                Gap Analysis
              </button>
              <button
                type="button"
                className={`nav-tab ${activeTab === 'multi-query-score' ? 'nav-tab--active' : ''}`}
                onClick={() => setActiveTab('multi-query-score')}
              >
                Multi-Query Score
              </button>
              <button
                type="button"
                className={`nav-tab ${activeTab === 'audit-history' ? 'nav-tab--active' : ''}`}
                onClick={() => setActiveTab('audit-history')}
              >
                Audit History
              </button>
            </nav>
          </div>

          {/* Right Status — Strictly Mutually Exclusive */}
          <div className="top-nav__status">
            {isLiveApi ? (
              <div className="status-chip status-chip--live">
                <span className="status-chip__dot status-chip__dot--live" />
                <span>Live SerpApi Engine</span>
              </div>
            ) : (
              <div className="demo-chip">
                <span className="status-chip__dot" style={{ backgroundColor: 'var(--outline)' }} />
                <span>Demo Sandbox Mode</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Notification Banner */}
        <section className={`notification-banner ${isLiveApi ? 'notification-banner--live' : ''}`}>
          <div className="notification-banner__left">
            <div className="notification-banner__icon">
              <span className="material-symbols-outlined text-[18px]">
                {isLiveApi ? 'bolt' : 'verified_user'}
              </span>
            </div>
            <div className="notification-banner__text">
              {isLiveApi ? (
                <>
                  <strong>Live SerpApi Connected</strong> • Real-time Google AI Overview & AI Mode query synthesis active.
                </>
              ) : (
                <>
                  <strong>Demo Sandbox Active</strong> • Running on verified Google AI Overview benchmarks (Add SERPAPI_KEY to .env for live scans).
                </>
              )}
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            Google AI Overview & AI Mode Engine
          </span>
        </section>

        {/* Hero Header */}
        <section className="hero">
          <div className="hero__eyebrow">
            <span className="material-symbols-outlined text-xs">bolt</span>
            <span>Generative Engine Optimization · Live SERP Engine</span>
          </div>
          <h1 className="hero__title">
            Discover if your brand appears in Google’s AI answers <em>vs competitors</em>
          </h1>
          <p className="hero__subtitle">
            Real-time audit across Google AI Overview, AI Mode synthesize blocks, and authoritative source citation networks via SerpApi.
          </p>
        </section>

        {/* Tab 1: Audit Scanner */}
        {activeTab === 'audit-scanner' && (
          <>
            <ScanForm onScan={runScan} loading={loading} />
            {error && <div className="error-notice" id="error-message">{error}</div>}
            {results && (
              <>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 0 20px 0' }}>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => setShowVisualSummary(!showVisualSummary)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bar_chart</span>
                    {showVisualSummary ? 'Hide Visual Summary' : 'Show Visual Summary'}
                  </button>
                </div>
                {showVisualSummary && (
                  <div className="chart-dashboard-grid">
                    <ShareOfVoiceChart results={results} />
                    <GeoComparisonChart results={results} />
                  </div>
                )}
                <ResultsTable data={results} />
              </>
            )}
            {results?.gapAnalysis && (
              <GapAnalysis
                gapAnalysis={results.gapAnalysis}
                brandName={results.brand?.name}
                brandFound={results.brand?.aiOverview?.found || results.brand?.aiMode?.found}
              />
            )}
            {results?.recommendations && results.recommendations.length > 0 && (
              <Recommendations recommendations={results.recommendations} />
            )}
          </>
        )}

        {/* Tab 2: Competitor Matrix */}
        {activeTab === 'competitor-matrix' && (
          <>
            {!results && <ScanForm onScan={runScan} loading={loading} />}
            {error && <div className="error-notice">{error}</div>}
            {results ? (
              <>
                <div className="chart-dashboard-grid">
                  <ShareOfVoiceChart results={results} />
                  <GeoComparisonChart results={results} />
                </div>
                <ResultsTable data={results} />
              </>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                Run an audit scan above to generate the side-by-side Competitor Matrix.
              </div>
            )}
          </>
        )}

        {/* Tab 3: Gap Analysis */}
        {activeTab === 'gap-analysis' && (
          <>
            {!results && <ScanForm onScan={runScan} loading={loading} />}
            {error && <div className="error-notice">{error}</div>}
            {results ? (
              <>
                <GapAnalysis
                  gapAnalysis={results.gapAnalysis}
                  brandName={results.brand?.name}
                  brandFound={results.brand?.aiOverview?.found || results.brand?.aiMode?.found}
                />
                {results?.recommendations && (
                  <Recommendations recommendations={results.recommendations} />
                )}
              </>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                Run an audit scan above to perform the Structural Gap Analysis.
              </div>
            )}
          </>
        )}

        {/* Tab 4: Multi-Query Score */}
        {activeTab === 'multi-query-score' && (
          <>
            <MultiQueryForm onScan={handleMultiScan} loading={multiLoading} />
            {multiError && <div className="error-notice" style={{ marginTop: '20px' }}>{multiError}</div>}
            {multiResults && (
              <>
                <VisibilityScoreCard data={multiResults} />
                <QueryBreakdownTable data={multiResults} />
              </>
            )}
          </>
        )}

        {/* Tab 5: Audit History */}
        {activeTab === 'audit-history' && (
          <AuditHistory
            onLoadAudit={handleLoadAudit}
            onReRunAudit={handleReRunAudit}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built for SerpApi Hackathon with{' '}
          <a href="https://serpapi.com/" target="_blank" rel="noopener noreferrer">
            SerpApi
          </a>{' '}
          — AI Overview API · AI Mode API · Google Organic Search API
        </p>
      </footer>
    </div>
  );
}
