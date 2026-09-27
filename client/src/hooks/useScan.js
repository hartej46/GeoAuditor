import { useState, useCallback } from 'react';

/**
 * Custom hook for managing scan API calls and state.
 *
 * Encapsulates:
 *  - Loading state
 *  - Error state
 *  - Scan results
 *  - The fetch call to POST /api/scan
 *
 * Usage: const { results, loading, error, runScan } = useScan();
 */
export function useScan() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runScan = useCallback(async ({ brand, competitors, query }) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, competitors, query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }

      setResults(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const runMultiScan = useCallback(async ({ brand, competitors, queries }) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/scan/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, competitors, queries }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }

      setResults(data);
    } catch (err) {
      setError(err.message || 'Multi-query scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return { results, setResults, loading, error, runScan, runMultiScan, clearResults };
}

