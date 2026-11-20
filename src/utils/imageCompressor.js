/**
 * Image compression utility for Wex Technology.
 * Downsamples high-resolution mobile camera screenshots/receipts
 * to maximum dimension of 1600px and 80% JPEG quality.
 * Handles EXIF orientation via createImageBitmap (with Image fallback).
 * Ensures files are always named with a .jpg extension.
 */

export function calculateDownscaledDimensions(width, height, maxDimension = 1600) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round((height * maxDimension) / width),
    };
  }

  return {
    width: Math.round((width * maxDimension) / height),
    height: maxDimension,
  };
}

/**
 * Normalizes file name so that it always ends in .jpg, even for nameless blobs or files without extensions.
 */
export function getJpegFilename(file) {
  if (!file || !file.name) {
    return `receipt-${Date.now()}.jpg`;
  }
  const rawName = file.name.trim();
  if (rawName === 'blob' || rawName === 'receipt' || !rawName.includes('.')) {
    return `${rawName || 'receipt'}.jpg`;
  }
  return rawName.replace(/\.[^.]+$/, '.jpg');
}

export const MAX_FALLBACK_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

export async function compressProofImage(file, maxDimension = 1600, quality = 0.8) {
  if (!file) {
    return file;
  }

  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  const outputName = getJpegFilename(file);

  try {
    // 1. Try modern createImageBitmap with EXIF orientation correction
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const { width, height } = calculateDownscaledDimensions(bitmap.width, bitmap.height, maxDimension);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          if (typeof bitmap.close === 'function') {
            bitmap.close();
          }
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
          if (blob) {
            return new File([blob], outputName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
          }
        }
      } catch {
        // Fall back to Image element below
      }
    }

    // 2. Fallback: Image element via FileReader
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Image decode error'));
        img.onload = () => {
          const { width, height } = calculateDownscaledDimensions(img.width, img.height, maxDimension);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
              }
              const compressedFile = new File([blob], outputName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  } catch {
    // Fallback: If compression fails/throws, send original ONLY if <= 4 MB
    if (file.size <= MAX_FALLBACK_FILE_SIZE) {
      if (file.name && !file.name.includes('.')) {
        return new File([file], outputName, { type: file.type || 'image/jpeg' });
      }
      return file;
    }
    throw new Error('حجم الصورة كبير جداً، يرجى اختيار صورة أصغر من 4 ميغابايت');
  }
}

export const compressImage = compressProofImage;
