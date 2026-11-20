import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motionTokens } from '../motion/motionTokens';
import { detectDefaultMotionMode } from '../motion/useMotionMode';
import Reveal from '../motion/Reveal';
import Stagger from '../motion/Stagger';

describe('Motion System Foundation Tests', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('defines required motion tokens with strict timing', () => {
    expect(motionTokens.duration.fast).toBe(150);
    expect(motionTokens.duration.base).toBe(250);
    expect(motionTokens.duration.slow).toBe(450);
    expect(motionTokens.duration.hero).toBe(800);
    expect(motionTokens.duration.stagger).toBe(60);
    expect(motionTokens.easing.standard).toContain('cubic-bezier');
  });

  it('detects default motion mode gracefully in node/test environment', () => {
    const mode = detectDefaultMotionMode();
    expect(['full', 'lite', 'reduced']).toContain(mode);
  });

  it('renders <Reveal> component with semantic markup and classes', () => {
    const html = renderToStaticMarkup(
      <Reveal as="section" className="test-class">
        <span>محتوى الحركة</span>
      </Reveal>
    );
    expect(html).toContain('محتوى الحركة');
    expect(html).toContain('test-class');
    expect(html).toContain('reveal');
  });

  it('renders <Stagger> injecting --i custom variable into children', () => {
    const html = renderToStaticMarkup(
      <Stagger>
        <div key="1">عنصر 1</div>
        <div key="2">عنصر 2</div>
      </Stagger>
    );
    expect(html).toContain('عنصر 1');
    expect(html).toContain('عنصر 2');
    expect(html).toContain('--i:0');
    expect(html).toContain('--i:1');
  });
});
