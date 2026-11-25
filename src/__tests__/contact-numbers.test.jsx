import { describe, it, expect, vi } from 'vitest';

vi.mock('../context/CartContext', () => ({ useCart: () => ({ totalItems: 0 }) }));
vi.mock('../context/FavoritesContext', () => ({ useFavorites: () => ({ favoriteCount: 0 }) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null, isAuthenticated: false, logout: () => {} }) }));
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import DesktopHeader from '../components/desktop/DesktopHeader';
import { normalizeShopInfo, buildTelLink } from '../utils/shopSettings';

// WEB-CONTACT-01: customer-facing contact links used hard-coded placeholder numbers
// (wa.me/249912345678, tel:+249912345678, 249912300000) instead of admin settings.
const PLACEHOLDERS = ['249912345678', '249912300000', '0912300000'];

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (f === '__tests__') continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(f)) out.push(p);
  }
  return out;
}

describe('contact numbers', () => {
  it('no placeholder phone number is hard-coded in src', () => {
    const hits = walk(new URL('..', import.meta.url).pathname)
      .filter((f) => !f.endsWith('formatters.js'))
      .filter((f) => PLACEHOLDERS.some((n) => readFileSync(f, 'utf8').includes(n)));
    expect(hits).toEqual([]);
  });

  it('missing settings produce no contact links; real settings produce them', () => {
    const none = renderToStaticMarkup(<MemoryRouter><DesktopHeader onOpenCart={() => {}} shopInfo={normalizeShopInfo({})} /></MemoryRouter>);
    expect(none).not.toContain('wa.me');
    expect(none).not.toContain('tel:');

    const real = renderToStaticMarkup(<MemoryRouter><DesktopHeader onOpenCart={() => {}} shopInfo={normalizeShopInfo({ shop_whatsapp: '0911111111', shop_phone: '0122222222' })} /></MemoryRouter>);
    expect(real).toContain('https://wa.me/249911111111');
    expect(real).toContain('tel:+249122222222');
    expect(buildTelLink('')).toBeNull();
  });
});
