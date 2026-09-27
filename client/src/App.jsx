import { useState } from 'react';
import ScanForm from './components/ScanForm';
import ResultsTable from './components/ResultsTable';
import { useScan } from './hooks/useScan';
import './App.css';

/**
 * App — Root Application with Stitch Sahara Warm Minimalism Shell
 */
export default function App() {
  const { results, loading, error, runScan } = useScan();
  const [activeTab, setActiveTab] = useState('audit-scanner');

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

          {/* Right Status */}
          <div className="top-nav__status">
            <div className="status-chip">
              <span className="status-chip__dot" />
              <span>SerpApi Active</span>
            </div>
            <div className="demo-chip">
              Demo Sandbox Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Notification Banner */}
        <section className="notification-banner">
          <div className="notification-banner__left">
            <div className="notification-banner__icon">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div className="notification-banner__text">
              <strong>Demo Sandbox Active</strong> • SerpApi connected • Verified Google AI Overview benchmarks for instant audit.
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

        {/* Scan Parameters Card */}
        <ScanForm onScan={runScan} loading={loading} />

        {/* Error Notification */}
        {error && (
          <div className="error-notice" id="error-message">
            {error}
          </div>
        )}

        {/* Results Presentation */}
        {results && <ResultsTable data={results} />}
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
