/**
 * @vitest-environment jsdom
 *
 * Mobile: the lightbox opened inside the app shell's transformed screen container, which
 * is the containing block for position:fixed, so the overlay covered the tall page rather
 * than the screen and no image was visible. It must render on <body>.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import Lightbox from '../components/common/Lightbox';

describe('Lightbox', () => {
  it('renders its overlay on <body>, outside any transformed page container', () => {
    const { container } = render(
      <div style={{ transform: 'translate3d(0,0,0)' }} data-testid="screen">
        <Lightbox isOpen images={[{ url: '/uploads/products/a.jpg', alt: 'جهاز' }]} initialIndex={0} onClose={() => {}} />
      </div>
    );
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.parentElement).toBe(document.body);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(dialog.querySelector('img').getAttribute('src')).toBe('/uploads/products/a.jpg');
  });
});
