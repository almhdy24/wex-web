import { useState, useEffect } from 'react';

/**
 * useMediaQuery hook
 * Listens to CSS media query changes.
 * In SSR / Node test environments (where window.matchMedia is undefined),
 * it returns `defaultMatches` (defaulting to false).
 */
export function useMediaQuery(query, defaultMatches = false) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return defaultMatches;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);

    setMatches(mql.matches);

    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } else if (mql.addListener) {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, [query]);

  return matches;
}

export default useMediaQuery;
