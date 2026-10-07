export interface Point {
  x: number;
  y: number;
}

export interface QuadCorners {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
}

export interface DetectionResult {
  corners: QuadCorners;
  confidence: number; // 0 to 1
}

/**
 * Solve linear system A * x = B using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = B.length;
  const M = A.map((row, i) => [...row, B[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }
    [M[i], M[maxRow]] = [M[maxRow], M[i]];

    if (Math.abs(M[i][i]) < 1e-10) continue;

    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        M[k][j] -= factor * M[i][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = M[i][i] !== 0 ? sum / M[i][i] : 0;
  }
  return x;
}

/**
 * Computes 3x3 Homography Matrix mapping srcPts to dstPts.
 */
export function getHomographyMatrix(srcPts: Point[], dstPts: Point[]): number[] {
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const u = srcPts[i].x;
    const v = srcPts[i].y;
    const x = dstPts[i].x;
    const y = dstPts[i].y;

    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    B.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    B.push(y);
  }

  const h = solveLinearSystem(A, B);
  return [...h, 1];
}

/**
 * Default fallback corners (8% inset from borders).
 */
export function getDefaultCorners(width: number, height: number, insetPct = 0.08): QuadCorners {
  const padX = width * insetPct;
  const padY = height * insetPct;
  return {
    tl: { x: padX, y: padY },
    tr: { x: width - padX, y: padY },
    br: { x: width - padX, y: height - padY },
    bl: { x: padX, y: height - padY },
  };
}

/**
 * Fits a constrained Rectangle / Mild Trapezoid model over the image to favor
 * clean, realistic book geometry and prevent degenerate or collapsed corners.
 */
export function fitBookTrapezoid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): QuadCorners {
  if (width <= 0 || height <= 0) return getDefaultCorners(width, height, 0.08);

  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const cx = width / 2;
    const cy = height / 2;

    const lineScore = (x1: number, y1: number, x2: number, y2: number) => {
      const steps = 20;
      let totalGrad = 0;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = Math.round(x1 + (x2 - x1) * t);
        const py = Math.round(y1 + (y2 - y1) * t);

        if (px >= 1 && px < width - 1 && py >= 1 && py < height - 1) {
          const idx = (py * width + px) * 4;
          const idxRight = (py * width + (px + 1)) * 4;
          const idxDown = ((py + 1) * width + px) * 4;

          const dxR = Math.abs(data[idx] - data[idxRight]);
          const dyD = Math.abs(data[idx] - data[idxDown]);
          totalGrad += dxR + dyD;
        }
      }
      return totalGrad / steps;
    };

    let bestScore = -1;
    let bestCorners = getDefaultCorners(width, height, 0.08);

    // Grid of candidate book proportions, sizes, and mild key-stoning/trapezoid ratios
    const aspectRatios = [0.70, 0.78, 0.85, 1.0, 1.30];
    const scales = [0.55, 0.68, 0.78, 0.86];
    const topScales = [0.92, 0.96, 1.0, 1.04, 1.08];

    for (const scale of scales) {
      for (const ar of aspectRatios) {
        for (const topK of topScales) {
          let h = height * scale;
          let w = h * ar;
          if (w > width * 0.90) {
            w = width * 0.90;
            h = w / ar;
          }

          const halfH = h / 2;
          const halfBotW = w / 2;
          const halfTopW = halfBotW * topK;

          const candTL = { x: Math.max(0, cx - halfTopW), y: Math.max(0, cy - halfH) };
          const candTR = { x: Math.min(width, cx + halfTopW), y: Math.max(0, cy - halfH) };
          const candBR = { x: Math.min(width, cx + halfBotW), y: Math.min(height, cy + halfH) };
          const candBL = { x: Math.max(0, cx - halfBotW), y: Math.min(height, cy + halfH) };

          const topScore = lineScore(candTL.x, candTL.y, candTR.x, candTR.y);
          const rightScore = lineScore(candTR.x, candTR.y, candBR.x, candBR.y);
          const botScore = lineScore(candBR.x, candBR.y, candBL.x, candBL.y);
          const leftScore = lineScore(candBL.x, candBL.y, candBL.x, candBL.y);

          const totalScore = topScore + rightScore + botScore + leftScore;

          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestCorners = { tl: candTL, tr: candTR, br: candBR, bl: candBL };
          }
        }
      }
    }

    return bestCorners;
  } catch (e) {
    console.error('fitBookTrapezoid error:', e);
    return getDefaultCorners(width, height, 0.08);
  }
}

/**
 * Detect book corners using constrained rectangle/trapezoid fitting model.
 */
export function detectBookCorners(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): DetectionResult | null {
  if (width <= 0 || height <= 0) return null;

  try {
    const corners = fitBookTrapezoid(ctx, width, height);
    return {
      corners,
      confidence: 0.85,
    };
  } catch (e) {
    console.error('Corner detection error:', e);
    return {
      corners: getDefaultCorners(width, height, 0.08),
      confidence: 0.5,
    };
  }
}

/**
 * Checks if corners are stable between frames for auto-capture.
 */
export function isCornersStable(
  prev: QuadCorners | null,
  curr: QuadCorners,
  width: number,
  height: number,
  thresholdPct = 0.04
): boolean {
  if (!prev) return false;

  const maxDist = Math.hypot(width, height) * thresholdPct;

  const distTL = Math.hypot(curr.tl.x - prev.tl.x, curr.tl.y - prev.tl.y);
  const distTR = Math.hypot(curr.tr.x - prev.tr.x, curr.tr.y - prev.tr.y);
  const distBR = Math.hypot(curr.br.x - prev.br.x, curr.br.y - prev.br.y);
  const distBL = Math.hypot(curr.bl.x - prev.bl.x, curr.bl.y - prev.bl.y);

  return (
    distTL <= maxDist &&
    distTR <= maxDist &&
    distBR <= maxDist &&
    distBL <= maxDist
  );
}

/**
 * Performs perspective warp transform from quadrilateral corners to flat rectangle.
 */
export async function warpPerspectiveImage(
  imageSrc: string,
  corners: QuadCorners,
  targetWidth?: number,
  targetHeight?: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const srcWidth = img.naturalWidth || img.width;
      const srcHeight = img.naturalHeight || img.height;

      const topW = Math.hypot(corners.tr.x - corners.tl.x, corners.tr.y - corners.tl.y);
      const botW = Math.hypot(corners.br.x - corners.bl.x, corners.br.y - corners.bl.y);
      const leftH = Math.hypot(corners.bl.x - corners.tl.x, corners.bl.y - corners.tl.y);
      const rightH = Math.hypot(corners.br.x - corners.tr.x, corners.br.y - corners.tr.y);

      const outW = targetWidth || Math.round(Math.max(topW, botW));
      const outH = targetHeight || Math.round(Math.max(leftH, rightH));

      if (outW <= 0 || outH <= 0) {
        resolve(imageSrc);
        return;
      }

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = srcWidth;
      srcCanvas.height = srcHeight;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) {
        resolve(imageSrc);
        return;
      }
      srcCtx.drawImage(img, 0, 0);

      const dstCanvas = document.createElement('canvas');
      dstCanvas.width = outW;
      dstCanvas.height = outH;
      const dstCtx = dstCanvas.getContext('2d');
      if (!dstCtx) {
        resolve(imageSrc);
        return;
      }

      const srcData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
      const dstData = dstCtx.createImageData(outW, outH);

      const dstPts = [
        { x: 0, y: 0 },
        { x: outW, y: 0 },
        { x: outW, y: outH },
        { x: 0, y: outH },
      ];

      const srcCornerPts = [corners.tl, corners.tr, corners.br, corners.bl];

      const H = getHomographyMatrix(dstPts, srcCornerPts);

      for (let v = 0; v < outH; v++) {
        for (let u = 0; u < outW; u++) {
          const idx = (v * outW + u) * 4;
          const denom = H[6] * u + H[7] * v + H[8];
          if (Math.abs(denom) < 1e-6) continue;

          const sx = (H[0] * u + H[1] * v + H[2]) / denom;
          const sy = (H[3] * u + H[4] * v + H[5]) / denom;

          if (sx >= 0 && sx < srcWidth - 1 && sy >= 0 && sy < srcHeight - 1) {
            const x0 = Math.floor(sx);
            const y0 = Math.floor(sy);
            const x1 = x0 + 1;
            const y1 = y0 + 1;

            const dx = sx - x0;
            const dy = sy - y0;

            const i00 = (y0 * srcWidth + x0) * 4;
            const i10 = (y0 * srcWidth + x1) * 4;
            const i01 = (y1 * srcWidth + x0) * 4;
            const i11 = (y1 * srcWidth + x1) * 4;

            for (let c = 0; c < 4; c++) {
              const top = srcData.data[i00 + c] * (1 - dx) + srcData.data[i10 + c] * dx;
              const bot = srcData.data[i01 + c] * (1 - dx) + srcData.data[i11 + c] * dx;
              dstData.data[idx + c] = Math.round(top * (1 - dy) + bot * dy);
            }
          }
        }
      }

      dstCtx.putImageData(dstData, 0, 0);
      resolve(dstCanvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
