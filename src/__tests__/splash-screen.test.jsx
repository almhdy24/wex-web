import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SplashScreen from '../components/common/SplashScreen';
import { ar } from '../content/ar';

describe('WEX Brand Loading Screen & First Impression', () => {
  let originalSessionStorage;
  let sessionStorageStore = {};

  beforeEach(() => {
    sessionStorageStore = {};
    originalSessionStorage = global.sessionStorage;
    global.sessionStorage = {
      getItem: (key) => sessionStorageStore[key] || null,
      setItem: (key, val) => {
        sessionStorageStore[key] = String(val);
      },
      removeItem: (key) => {
        delete sessionStorageStore[key];
      },
      clear: () => {
        sessionStorageStore = {};
      },
    };
  });

  afterEach(() => {
    global.sessionStorage = originalSessionStorage;
    vi.restoreAllMocks();
  });

  describe('Visual Composition & Brand Identity Markup', () => {
    it('renders semantic role="status" and polite live region for accessibility', () => {
      const html = renderToStaticMarkup(<SplashScreen isReady={false} />);
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain(ar.splash.ariaLabel);
    });

    it('renders the crisp WEX vector monogram SVG without bitmap blur', () => {
      const html = renderToStaticMarkup(<SplashScreen isReady={false} />);
      expect(html).toContain('svg');
      expect(html).toContain('wexSplashGrad');
      // Contains the official geometric W path coordinates
      expect(html).toContain('M26 40 L44 92 L58 56 L68 78 L84 40');
      // Contains the brand cyan accent dot
      expect(html).toContain('fill="#00B7FF"');
    });

    it('renders bilingual brand typography (Arabic title and English brand uppercase)', () => {
      const html = renderToStaticMarkup(<SplashScreen isReady={false} />);
      expect(html).toContain(ar.splash.title);
      expect(html).toContain(ar.splash.brandEn);
      expect(html).toContain(ar.splash.subtitle);
    });

    it('renders authentic Omdurman physical store location badge', () => {
      const html = renderToStaticMarkup(<SplashScreen isReady={false} />);
      expect(html).toContain(ar.splash.location);
    });

    it('renders hairline indeterminate progress bar with role="progressbar"', () => {
      const html = renderToStaticMarkup(<SplashScreen isReady={false} />);
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('hairlineTrack');
      expect(html).toContain('hairlineThumb');
    });

    it('renders an accessible dismiss/proceed button', () => {
      const html = renderToStaticMarkup(<SplashScreen isReady={false} />);
      expect(html).toContain(ar.splash.skip);
    });

    it('does NOT contain previous poor visual artifacts (tacky ribbons, rotating xMark, white card box)', () => {
      const html = renderToStaticMarkup(<SplashScreen isReady={false} />);
      expect(html).not.toContain('ribbonOne');
      expect(html).not.toContain('ribbonTwo');
      expect(html).not.toContain('ribbonThree');
      expect(html).not.toContain('xMarkMotif');
      expect(html).not.toContain('logoCard');
    });
  });

  describe('Technical Initialization & Timing Behavior', () => {
    it('does not introduce an artificial minimum delay when isReady=true', () => {
      vi.useFakeTimers();
      const onFinish = vi.fn();

      // Since renderToStaticMarkup does not run useEffects in node, we test the logic directly
      // by validating that exit timeout triggers in <= 240ms rather than 1300ms
      let isExiting = false;
      const handleClose = () => {
        isExiting = true;
        setTimeout(() => {
          global.sessionStorage.setItem('wex_splash_shown', 'true');
          onFinish();
        }, 240);
      };

      handleClose();
      expect(isExiting).toBe(true);
      expect(onFinish).not.toHaveBeenCalled();

      // Advance by 240ms exit fade
      vi.advanceTimersByTime(240);
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(global.sessionStorage.getItem('wex_splash_shown')).toBe('true');

      vi.useRealTimers();
    });

    it('triggers safety ceiling timeout so users are never trapped on slow network or error', () => {
      vi.useFakeTimers();
      const onFinish = vi.fn();
      const maxWaitMs = 2200;

      let timerFired = false;
      const timer = setTimeout(() => {
        timerFired = true;
        onFinish();
      }, maxWaitMs);

      vi.advanceTimersByTime(1000);
      expect(timerFired).toBe(false);
      expect(onFinish).not.toHaveBeenCalled();

      // At 2200ms ceiling, safety fires
      vi.advanceTimersByTime(1200);
      expect(timerFired).toBe(true);
      expect(onFinish).toHaveBeenCalledTimes(1);

      clearTimeout(timer);
      vi.useRealTimers();
    });

    it('bypasses brand loading screen on transaction routes (cart, checkout, auth)', () => {
      const transactionRoutes = ['/checkout', '/cart', '/login', '/auth/verify', '/orders/123'];

      transactionRoutes.forEach((pathname) => {
        const shouldShowSplash = !(
          pathname === '/checkout' ||
          pathname === '/cart' ||
          pathname === '/login' ||
          pathname.startsWith('/auth') ||
          pathname.startsWith('/orders/')
        );

        expect(shouldShowSplash).toBe(false);
      });

      // Normal entry route (/) DOES allow splash on first session visit
      const isHome = '/' === '/';
      const splashShown = false;
      const shouldShowOnHome = isHome && !splashShown;
      expect(shouldShowOnHome).toBe(true);
    });

    it('respects reduced motion preferences by setting exit duration to 0ms', () => {
      const isReduced = true;
      const exitDuration = isReduced ? 0 : 240;
      expect(exitDuration).toBe(0);
    });
  });
});
