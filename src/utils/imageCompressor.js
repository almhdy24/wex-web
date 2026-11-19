/**
 * Image compression utility for Wex Technology.
 * Downsamples high-resolution mobile camera screenshots/receipts
 * to maximum dimension of 1600px and 80% JPEG quality.
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

export async function compressProofImage(file, maxDimension = 1600, quality = 0.8) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        const { width, height } = calculateDownscaledDimensions(img.width, img.height, maxDimension);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name ? file.name.replace(/\.[^.]+$/, '.jpg') : 'receipt.jpg';
            const compressedFile = new File([blob], cleanName, {
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
}
