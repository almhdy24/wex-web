import { useState, useEffect } from 'react';

/**
 * Three-tier viewport detection hook
 * - Phone: < 640px
 * - Tablet: 640px - 1023px
 * - Desktop: >= 1024px
 */
export function useViewport() {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        tier: 'mobile',
      };
    }

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const isTablet = !isDesktop && window.matchMedia('(min-width: 640px)').matches;
    const isMobile = !isDesktop && !isTablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      tier: isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile',
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const desktopMql = window.matchMedia('(min-width: 1024px)');
    const tabletMql = window.matchMedia('(min-width: 640px) and (max-width: 1023px)');

    const updateMatches = () => {
      const isDesktop = desktopMql.matches;
      const isTablet = tabletMql.matches;
      const isMobile = !isDesktop && !isTablet;
      const tier = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';

      setViewport((prev) => {
        if (prev.tier === tier) return prev;
        return { isMobile, isTablet, isDesktop, tier };
      });
    };

    updateMatches();

    if (desktopMql.addEventListener) {
      desktopMql.addEventListener('change', updateMatches);
      tabletMql.addEventListener('change', updateMatches);
      return () => {
        desktopMql.removeEventListener('change', updateMatches);
        tabletMql.removeEventListener('change', updateMatches);
      };
    } else if (desktopMql.addListener) {
      // Fallback for older Safari/WebKit
      desktopMql.addListener(updateMatches);
      tabletMql.addListener(updateMatches);
      return () => {
        desktopMql.removeListener(updateMatches);
        tabletMql.removeListener(updateMatches);
      };
    }
  }, []);

  return viewport;
}

export default useViewport;
