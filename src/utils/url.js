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

  // Must not contain control characters, or backslashes: browsers normalise '\' to '/',
  // so '/\evil.example' becomes the protocol-relative '//evil.example'.
  const hasControlChar = Array.from(trimmed).some((ch) => {
    const code = ch.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (hasControlChar || trimmed.includes('\\')) {
    return fallback;
  }

  // Encoded variants of the above ('/%5Cevil', '/%2F%2Fevil') decode to the same thing.
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }
  if (decoded.startsWith('//') || decoded.includes('\\') || decoded.includes('://')) {
    return fallback;
  }

  return trimmed;
}

export default safeReturnTo;
