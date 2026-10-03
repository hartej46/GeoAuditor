/**
 * Webhook / Callback Delivery Service
 *
 * Implements fire-and-forget asynchronous callback delivery for GEO Auditor.
 * Spec ref: GEO_Auditor_Webhook_Callback_Spec.md
 *
 * Features:
 *  - P0 #4: Outgoing POST with standard JSON visibility result payload
 *  - P1 #6: Retry once after short delay (1500ms) on delivery failure
 *  - P1 #8: Delivery logging without logging API keys or credentials
 */

const crypto = require('crypto');

/**
 * Deliver a scan result payload to a callback URL with one retry on failure.
 *
 * @param {string} callbackUrl - Target destination URL
 * @param {object} payload - Scan visibility result JSON
 * @returns {Promise<boolean>} True if delivered successfully, false if both attempts failed
 */
async function deliverCallback(callbackUrl, payload) {
  const deliveryId = crypto.randomUUID();
  const timeoutMs = 8000; // 8s timeout per attempt

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'GEO-Auditor-Webhook/1.0 (+https://github.com/hartej46/GeoAuditor)',
      'X-GEO-Auditor-Delivery': deliveryId,
      'X-GEO-Auditor-Timestamp': new Date().toISOString(),
      'X-GEO-Auditor-Event': 'visibility.completed'
    },
    body: JSON.stringify(payload)
  };

  // Attempt 1
  const attemptStart = Date.now();
  console.log(`[callback] [${deliveryId}] Sending webhook POST to ${callbackUrl} (scanId: ${payload.scanId})...`);

  try {
    const res = await fetch(callbackUrl, {
      ...requestOptions,
      signal: AbortSignal.timeout(timeoutMs)
    });

    const elapsed = Date.now() - attemptStart;
    if (res.ok) {
      console.log(`[callback] [${deliveryId}] Delivered successfully to ${callbackUrl} in ${elapsed}ms (HTTP ${res.status})`);
      return true;
    }

    console.warn(`[callback] [${deliveryId}] Attempt 1 returned HTTP ${res.status} from ${callbackUrl}. Retrying in 1.5s...`);
  } catch (err) {
    const elapsed = Date.now() - attemptStart;
    console.warn(`[callback] [${deliveryId}] Attempt 1 failed to ${callbackUrl} after ${elapsed}ms: ${err.message}. Retrying in 1.5s...`);
  }

  // Wait 1.5 seconds before single retry (P1 #6)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Attempt 2 (Final retry)
  const retryStart = Date.now();
  try {
    const retryRes = await fetch(callbackUrl, {
      ...requestOptions,
      signal: AbortSignal.timeout(timeoutMs)
    });

    const retryElapsed = Date.now() - retryStart;
    if (retryRes.ok) {
      console.log(`[callback] [${deliveryId}] Delivered on retry (attempt 2) to ${callbackUrl} in ${retryElapsed}ms (HTTP ${retryRes.status})`);
      return true;
    }

    console.error(`[callback] [${deliveryId}] Attempt 2 failed with HTTP ${retryRes.status} from ${callbackUrl}. Giving up silently.`);
    return false;
  } catch (retryErr) {
    const retryElapsed = Date.now() - retryStart;
    console.error(`[callback] [${deliveryId}] Attempt 2 failed after ${retryElapsed}ms: ${retryErr.message}. Giving up silently.`);
    return false;
  }
}

/**
 * Validate that a callback URL is a syntactically valid HTTP or HTTPS URL.
 *
 * @param {string} urlString
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCallbackUrl(urlString) {
  if (!urlString || typeof urlString !== 'string' || !urlString.trim()) {
    return { valid: false, error: 'callback_url must be a non-empty string' };
  }

  try {
    const parsed = new URL(urlString.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'callback_url must use http or https protocol' };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'callback_url is not a well-formed URL' };
  }
}

module.exports = {
  deliverCallback,
  validateCallbackUrl
};
