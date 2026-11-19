import { describe, it, expect } from 'vitest';
import { calculateDownscaledDimensions, compressProofImage } from '../utils/imageCompressor';

describe('Receipt Image Compression Math & Rules', () => {
  it('does not downscale images that are already below 1600px', () => {
    const dims = calculateDownscaledDimensions(800, 600, 1600);
    expect(dims.width).toBe(800);
    expect(dims.height).toBe(600);
  });

  it('downscales wide landscape images while preserving aspect ratio', () => {
    // 3200 x 2400 (4:3) -> 1600 x 1200
    const dims = calculateDownscaledDimensions(3200, 2400, 1600);
    expect(dims.width).toBe(1600);
    expect(dims.height).toBe(1200);
  });

  it('downscales tall portrait phone screenshots while preserving aspect ratio', () => {
    // 1080 x 2400 (19.5:9 mobile screenshot) -> 720 x 1600
    const dims = calculateDownscaledDimensions(1080, 2400, 1600);
    expect(dims.height).toBe(1600);
    expect(dims.width).toBe(720);
  });

  it('downscales square images accurately', () => {
    const dims = calculateDownscaledDimensions(2000, 2000, 1600);
    expect(dims.width).toBe(1600);
    expect(dims.height).toBe(1600);
  });

  it('gracefully returns non-image files unmodified without throwing', async () => {
    const textFile = new File(['sample content'], 'notes.txt', { type: 'text/plain' });
    const result = await compressProofImage(textFile);
    expect(result).toBe(textFile);
  });

  it('gracefully handles null or undefined file input', async () => {
    expect(await compressProofImage(null)).toBeNull();
    expect(await compressProofImage(undefined)).toBeUndefined();
  });
});
