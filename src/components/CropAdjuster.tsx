import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw, Sparkles, Maximize2, Crop } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  QuadCorners,
  Point,
  detectBookCorners,
  getDefaultCorners,
  warpPerspectiveImage,
} from '@/lib/documentScanner';
import { motion } from 'motion/react';

interface CropAdjusterProps {
  imageSrc: string;
  initialCorners?: QuadCorners | null;
  onConfirm: (croppedImageData: string) => void;
  onRetake: () => void;
}

export function CropAdjuster({
  imageSrc,
  initialCorners,
  onConfirm,
  onRetake,
}: CropAdjusterProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [imageSize, setImageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [corners, setCorners] = useState<QuadCorners>({
    tl: { x: 0, y: 0 },
    tr: { x: 100, y: 0 },
    br: { x: 100, y: 100 },
    bl: { x: 0, y: 100 },
  });
  const [activeCorner, setActiveCorner] = useState<keyof QuadCorners | null>(null);
  const [dragPos, setDragPos] = useState<Point | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize image and corners
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setImageSize({ w, h });

      if (initialCorners) {
        setCorners(initialCorners);
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const detected = detectBookCorners(ctx, w, h);
          if (detected) {
            setCorners(detected.corners);
          } else {
            setCorners(getDefaultCorners(w, h, 0.08));
          }
        } else {
          setCorners(getDefaultCorners(w, h, 0.08));
        }
      }
    };
    img.src = imageSrc;
  }, [imageSrc, initialCorners]);

  // Convert image coordinates (0..w, 0..h) to container relative percentages
  const toDisplayPoint = useCallback(
    (p: Point): Point => {
      if (!imageSize.w || !imageSize.h) return { x: 0, y: 0 };
      return {
        x: (p.x / imageSize.w) * 100,
        y: (p.y / imageSize.h) * 100,
      };
    },
    [imageSize]
  );

  // Convert container touch/mouse point to image coordinates (0..w, 0..h)
  const toImagePoint = useCallback(
    (clientPoint: Point): Point => {
      if (!containerRef.current || !imageSize.w || !imageSize.h) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(1, (clientPoint.x - rect.left) / rect.width));
      const yPct = Math.max(0, Math.min(1, (clientPoint.y - rect.top) / rect.height));
      return {
        x: Math.round(xPct * imageSize.w),
        y: Math.round(yPct * imageSize.h),
      };
    },
    [imageSize]
  );

  const handlePointerDown = (cornerKey: keyof QuadCorners, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveCorner(cornerKey);
    const p = toImagePoint({ x: e.clientX, y: e.clientY });
    setDragPos(p);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeCorner) return;
      const p = toImagePoint({ x: e.clientX, y: e.clientY });
      setDragPos(p);
      setCorners((prev) => ({
        ...prev,
        [activeCorner]: p,
      }));
    },
    [activeCorner, toImagePoint]
  );

  const handlePointerUp = useCallback(() => {
    setActiveCorner(null);
    setDragPos(null);
  }, []);

  useEffect(() => {
    if (activeCorner) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [activeCorner, handlePointerMove, handlePointerUp]);

  const handleAutoDetect = () => {
    if (!imageSize.w || !imageSize.h) return;
    const canvas = document.createElement('canvas');
    canvas.width = imageSize.w;
    canvas.height = imageSize.h;
    const ctx = canvas.getContext('2d');
    if (ctx && imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
      const detected = detectBookCorners(ctx, imageSize.w, imageSize.h);
      if (detected) {
        setCorners(detected.corners);
      } else {
        setCorners(getDefaultCorners(imageSize.w, imageSize.h, 0.08));
      }
    }
  };

  const handleResetFull = () => {
    if (!imageSize.w || !imageSize.h) return;
    setCorners({
      tl: { x: 0, y: 0 },
      tr: { x: imageSize.w, y: 0 },
      br: { x: imageSize.w, y: imageSize.h },
      bl: { x: 0, y: imageSize.h },
    });
  };

  const handleConfirmCrop = async () => {
    setIsProcessing(true);
    try {
      const cropped = await warpPerspectiveImage(imageSrc, corners);
      onConfirm(cropped);
    } catch (e) {
      console.error('Warp perspective failed:', e);
      onConfirm(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  const displayTL = toDisplayPoint(corners.tl);
  const displayTR = toDisplayPoint(corners.tr);
  const displayBR = toDisplayPoint(corners.br);
  const displayBL = toDisplayPoint(corners.bl);

  return (
    <div className="fixed inset-0 bg-black z-[70] flex flex-col justify-between select-none">
      {/* Header bar */}
      <div className="p-4 bg-black/80 backdrop-blur-md flex items-center justify-between z-20 text-white border-b border-white/10">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">
            {t('adjust_corners', { defaultValue: 'Adjust Corners & Crop' })}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            className="h-8 text-xs gap-1 text-white border-white/20 bg-white/10 hover:bg-white/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFull}
            className="h-8 text-xs gap-1 text-white border-white/20 bg-white/10 hover:bg-white/20"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full</span>
          </Button>
        </div>
      </div>

      {/* Main Image View & Interactive Polygon */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={containerRef}
          className="relative inline-block max-w-full max-h-[68vh] shadow-2xl rounded-sm overflow-hidden"
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Original"
            className="block max-w-full max-h-[68vh] w-auto h-auto object-contain pointer-events-none rounded-sm"
          />

          {/* SVG Overlay connecting 4 corners */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <mask id="crop-mask">
                <rect width="100%" height="100%" fill="white" />
                <polygon
                  points={`${displayTL.x}%,${displayTL.y}% ${displayTR.x}%,${displayTR.y}% ${displayBR.x}%,${displayBR.y}% ${displayBL.x}%,${displayBL.y}%`}
                  fill="black"
                />
              </mask>
            </defs>

            <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.55)" mask="url(#crop-mask)" />

            {/* Polygon Outline */}
            <polygon
              points={`${displayTL.x}%,${displayTL.y}% ${displayTR.x}%,${displayTR.y}% ${displayBR.x}%,${displayBR.y}% ${displayBL.x}%,${displayBL.y}%`}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />
          </svg>

          {/* Draggable Corner Handles */}
          {(['tl', 'tr', 'br', 'bl'] as const).map((key) => {
            const pt = toDisplayPoint(corners[key]);
            const isDragging = activeCorner === key;
            return (
              <div
                key={key}
                onPointerDown={(e) => handlePointerDown(key, e)}
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 z-20 cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform ${
                    isDragging ? 'bg-amber-400 scale-125' : 'bg-primary scale-100 hover:scale-110'
                  }`}
                />
              </div>
            );
          })}

          {/* Loupe / Magnifying Glass when dragging */}
          {activeCorner && dragPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                left: `${toDisplayPoint(dragPos).x}%`,
                top: `${toDisplayPoint(dragPos).y - 18}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-full w-24 h-24 rounded-full border-2 border-amber-400 shadow-2xl overflow-hidden bg-black z-30 pointer-events-none"
            >
              <img
                src={imageSrc}
                alt="Zoom"
                style={{
                  width: `${imageSize.w}px`,
                  height: `${imageSize.h}px`,
                  transform: `translate(-${dragPos.x}px, -${dragPos.y}px) scale(2.5)`,
                  transformOrigin: `${dragPos.x}px ${dragPos.y}px`,
                }}
                className="max-w-none"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3 h-3 border-t-2 border-l-2 border-amber-400" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-6 bg-black/95 backdrop-blur-md flex gap-4 max-w-md mx-auto w-full z-20">
        <Button
          variant="secondary"
          size="lg"
          onClick={onRetake}
          className="flex-1 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 border-none"
          disabled={isProcessing}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('retake', { defaultValue: 'Retake' })}
        </Button>

        <Button
          size="lg"
          onClick={handleConfirmCrop}
          className="flex-1 rounded-full bg-primary text-primary-foreground shadow-md font-semibold"
          disabled={isProcessing}
        >
          <Check className="w-4 h-4 mr-2" />
          {isProcessing ? t('processing', { defaultValue: 'Processing...' }) : t('use_photo', { defaultValue: 'Use Photo' })}
        </Button>
      </div>
    </div>
  );
}
