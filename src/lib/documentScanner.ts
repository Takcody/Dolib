/**
 * Crops an image to a specified bounding box percentage (0..1).
 */
export async function cropImageToBox(
  imageSrc: string,
  box: { xPct: number; yPct: number; wPct: number; hPct: number }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;

      const cropX = Math.max(0, Math.round(srcW * box.xPct));
      const cropY = Math.max(0, Math.round(srcH * box.yPct));
      const cropW = Math.min(srcW - cropX, Math.round(srcW * box.wPct));
      const cropH = Math.min(srcH - cropY, Math.round(srcH * box.hPct));

      if (cropW <= 0 || cropH <= 0) {
        resolve(imageSrc);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } else {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
