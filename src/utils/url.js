/**
 * safeReturnTo
 * Validates returnTo redirect URLs to prevent open-redirect vulnerabilities.
 * A safe URL must start with a single '/' and not with '//', and must not contain '://'.
 *
 * @param {string|null|undefined} value
 * @param {string} fallback
 * @returns {string}
 */
export function safeReturnTo(value, fallback = '/') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();

  // Must start with '/' but not '//' (protocol-relative URL)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Must not contain protocol schemes (e.g. 'https://', 'javascript://')
  if (trimmed.includes('://')) {
    return fallback;
  }

  // Must not contain control characters or newlines
  if (/[\r\n\t]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

export default safeReturnTo;
