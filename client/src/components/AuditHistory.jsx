import React, { useState, useEffect } from 'react';
import VisibilityBadge from './VisibilityBadge';
import { apiUrl } from '../utils/api';

/**
 * AuditHistory — P1 #10 Historical Audit Log & Trend Analysis Component
 *
 * Renders:
 *  - Metric cards: Total Audits, Average Score, Monitored Scope
 *  - SVG Visibility Trend Sparkline
 *  - Audit log table with "Load Audit" & "Re-run Now" actions
 */
export default function AuditHistory({ onLoadAudit, onReRunAudit }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/scans?limit=25'));
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('[AuditHistory] Fetch error:', err.message);
      setError('Failed to load audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl('/api/scans?limit=25'))
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!ignore) {
          setHistory(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!ignore) {
          console.error('[AuditHistory] Fetch error:', err.message);
          setError('Failed to load audit history.');
          setLoading(false);
        }
      });
    return () => { ignore = true; };
  }, []);

  const totalAudits = history.length;
  const avgScore = totalAudits > 0
    ? Math.round(history.reduce((acc, curr) => acc + (curr.visibilityScore || 0), 0) / totalAudits)
    : 0;

  // Chronological order for trend line (oldest to newest)
  const chronological = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Generate SVG path points for sparkline
  const generateSparklinePoints = () => {
    if (chronological.length < 2) return '';
    const width = 500;
    const height = 60;
    const padding = 10;

    return chronological.map((item, idx) => {
      const x = padding + (idx / (chronological.length - 1)) * (width - 2 * padding);
      const score = item.visibilityScore ?? 0;
      const y = height - padding - (score / 100) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  };

  const sparklinePoints = generateSparklinePoints();

  return (
    <section className="audit-history-section" id="audit-history-section">
      {/* Header */}
      <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="results-header__eyebrow">P1 · Historical Tracking</div>
          <h2 className="results-header__title">Audit History & Visibility Drift</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>
            Historical record of Generative Engine Optimization scans and visibility performance metrics over time.
          </p>
        </div>
        <button
          type="button"
          className="chip-btn"
          onClick={fetchHistory}
          disabled={loading}
        >
          <span className="material-symbols-outlined text-[14px]" style={{ marginRight: '4px' }}>refresh</span>
          {loading ? 'Refreshing...' : 'Refresh History'}
        </button>
      </div>

      {/* High Level Metrics & Trend Line */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-card__label">Total Audits Recorded</div>
          <div className="metric-card__value" style={{ color: 'var(--on-surface)' }}>
            {totalAudits} Scans
          </div>
          <div className="metric-card__desc">Historical search evaluations</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">Average GEO Score</div>
          <div
            className="metric-card__value"
            style={{ color: avgScore >= 70 ? 'var(--success-text)' : avgScore >= 40 ? 'var(--primary)' : 'var(--danger-text)' }}
          >
            {avgScore}%
          </div>
          <div className="metric-card__desc">Mean score across all scans</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">Visibility Trend (Sparkline)</div>
          <div style={{ height: '50px', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
            {chronological.length >= 2 ? (
              <svg width="100%" height="45" viewBox="0 0 500 60" style={{ overflow: 'visible' }}>
                <polyline
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePoints}
                />
                {chronological.map((item, idx) => {
                  const width = 500;
                  const height = 60;
                  const padding = 10;
                  const x = padding + (idx / (chronological.length - 1)) * (width - 2 * padding);
                  const y = height - padding - ((item.visibilityScore ?? 0) / 100) * (height - 2 * padding);
                  return (
                    <circle
                      key={item.id}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="var(--primary)"
                      stroke="var(--surface-container-lowest)"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                Run at least 2 scans to render trend line
              </span>
            )}
          </div>
          <div className="metric-card__desc">Chronological score trajectory</div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="matrix-card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            Loading historical scans...
          </div>
        ) : error ? (
          <div className="error-notice" style={{ margin: '20px' }}>{error}</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            No scans recorded yet. Run your first audit using the scanner!
          </div>
        ) : (
          <table className="matrix-table" id="history-table">
            <thead>
              <tr>
                <th style={{ width: '16%' }}>Date & Time</th>
                <th style={{ width: '18%' }}>Brand Entity</th>
                <th style={{ width: '28%' }}>Query / Scope</th>
                <th style={{ width: '14%' }}>AI Status</th>
                <th style={{ width: '12%' }}>GEO Score</th>
                <th style={{ width: '12%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--on-surface)' }}>
                      {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--on-surface)' }}>{item.brand}</strong>
                    {item.type === 'multi' && (
                      <span className="you-pill" style={{ marginLeft: '6px', backgroundColor: 'var(--secondary-container)', color: 'var(--on-surface)' }}>
                        Multi
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                      {item.query}
                    </span>
                  </td>
                  <td>
                    <VisibilityBadge
                      found={item.aiOverviewFound || item.aiModeFound}
                      foundInSources={item.aiOverviewFound}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: item.visibilityScore >= 70 ? 'var(--success-text)' : 'var(--primary)' }}>
                        {item.visibilityScore}%
                      </strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="chip-btn"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => onLoadAudit(item)}
                        title="Load this audit into scanner view"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        className="chip-btn chip-btn--active"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => onReRunAudit(item)}
                        title="Re-run fresh scan for this brand & query"
                      >
                        Re-run
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
