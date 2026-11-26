/** @vitest-environment jsdom */
import { describe, it, expect, afterEach } from 'vitest';
import { isDataSaver } from '../utils/dataSaver';

const set = (v) => Object.defineProperty(navigator, 'connection', { value: v, configurable: true });

describe('isDataSaver', () => {
  afterEach(() => { delete navigator.connection; });

  it('false when the browser exposes no connection info', () => {
    delete navigator.connection;
    expect(isDataSaver()).toBe(false);
  });
  it('true with Data Saver on', () => { set({ saveData: true, effectiveType: '4g' }); expect(isDataSaver()).toBe(true); });
  it('true on 2G-class connections', () => {
    set({ saveData: false, effectiveType: '2g' }); expect(isDataSaver()).toBe(true);
    set({ effectiveType: 'slow-2g' }); expect(isDataSaver()).toBe(true);
  });
  it('false on 3G/4G without Data Saver', () => { set({ saveData: false, effectiveType: '3g' }); expect(isDataSaver()).toBe(false); });
});
