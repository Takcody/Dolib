import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw, Maximize2, Crop, Square, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cropImageToBox } from '@/lib/documentScanner';

interface CropBox {
  xPct: number; // 0 to 1
  yPct: number; // 0 to 1
  wPct: number; // 0 to 1
  hPct: number; // 0 to 1
}

interface CropAdjusterProps {
  imageSrc: string;
  onConfirm: (croppedImageData: string) => void;
  onRetake: () => void;
}

// Japanese Industrial Standard JIS B5 aspect ratio (182mm x 257mm)
const JIS_B5_ASPECT = 182 / 257; // ~0.70817

const getAspectCropBox = (targetAspect: number, imgW: number, imgH: number): CropBox => {
  if (!imgW || !imgH) return { xPct: 0.1, yPct: 0.1, wPct: 0.8, hPct: 0.8 };

  const imgAspect = imgW / imgH;
  let wPct = 0.80;
  let hPct = (imgAspect * wPct) / targetAspect;

  if (hPct > 0.90) {
    hPct = 0.90;
    wPct = (targetAspect * hPct) / imgAspect;
  }

  const xPct = Math.max(0, (1 - wPct) / 2);
  const yPct = Math.max(0, (1 - hPct) / 2);

  return { xPct, yPct, wPct, hPct };
};

export function CropAdjuster({
  imageSrc,
  onConfirm,
  onRetake,
}: CropAdjusterProps) {
  const { t } = useTranslation();
  const imageRef = useRef<HTMLImageElement>(null);

  const [imageSize, setImageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [renderedSize, setRenderedSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [cropBox, setCropBox] = useState<CropBox>({
    xPct: 0.10,
    yPct: 0.10,
    wPct: 0.80,
    hPct: 0.80,
  });

  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startBox, setStartBox] = useState<CropBox>(cropBox);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateRenderedSize = useCallback(() => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setRenderedSize({ w: rect.width, h: rect.height });
      }
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setImageSize({ w, h });
      setCropBox(getAspectCropBox(JIS_B5_ASPECT, w, h));
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    window.addEventListener('resize', updateRenderedSize);
    return () => window.removeEventListener('resize', updateRenderedSize);
  }, [updateRenderedSize]);

  const handlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handle);
    setStartPoint({ x: e.clientX, y: e.clientY });
    setStartBox({ ...cropBox });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeHandle || !imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = (e.clientX - startPoint.x) / rect.width;
      const dyPct = (e.clientY - startPoint.y) / rect.height;

      let newBox = { ...startBox };

      if (activeHandle === 'move') {
        newBox.xPct = Math.max(0, Math.min(1 - startBox.wPct, startBox.xPct + dxPct));
        newBox.yPct = Math.max(0, Math.min(1 - startBox.hPct, startBox.yPct + dyPct));
      } else {
        if (activeHandle.includes('l')) {
          const newX = Math.max(0, Math.min(startBox.xPct + startBox.wPct - 0.1, startBox.xPct + dxPct));
          newBox.wPct = startBox.wPct + (startBox.xPct - newX);
          newBox.xPct = newX;
        }
        if (activeHandle.includes('r')) {
          newBox.wPct = Math.max(0.1, Math.min(1 - startBox.xPct, startBox.wPct + dxPct));
        }
        if (activeHandle.includes('t')) {
          const newY = Math.max(0, Math.min(startBox.yPct + startBox.hPct - 0.1, startBox.yPct + dyPct));
          newBox.hPct = startBox.hPct + (startBox.yPct - newY);
          newBox.yPct = newY;
        }
        if (activeHandle.includes('b')) {
          newBox.hPct = Math.max(0.1, Math.min(1 - startBox.yPct, startBox.hPct + dyPct));
        }
      }

      setCropBox(newBox);
    },
    [activeHandle, startPoint, startBox]
  );

  const handlePointerUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [activeHandle, handlePointerMove, handlePointerUp]);

  const handleResetFull = () => {
    setCropBox({ xPct: 0, yPct: 0, wPct: 1, hPct: 1 });
  };

  const handlePresetB5 = () => {
    setCropBox(getAspectCropBox(JIS_B5_ASPECT, imageSize.w, imageSize.h));
  };

  const handlePresetSquare = () => {
    setCropBox(getAspectCropBox(1.0, imageSize.w, imageSize.h));
  };

  const handleConfirmCrop = async () => {
    setIsProcessing(true);
    try {
      const cropped = await cropImageToBox(imageSrc, cropBox);
      onConfirm(cropped);
    } catch (e) {
      console.error('Crop failed:', e);
      onConfirm(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[70] flex flex-col justify-between select-none">
      {/* Header bar */}
      <div className="p-4 bg-black/80 backdrop-blur-md flex items-center justify-between z-20 text-white border-b border-white/10">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">
            {t('adjust_crop', { defaultValue: 'Crop Book Cover' })}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePresetB5}
            className="h-8 text-xs gap-1 text-white border-white/20 bg-white/10 hover:bg-white/20"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>JIS B5</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePresetSquare}
            className="h-8 text-xs gap-1 text-white border-white/20 bg-white/10 hover:bg-white/20"
          >
            <Square className="w-3.5 h-3.5" />
            <span>1:1</span>
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

      {/* Interactive Rectangular Crop View */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="relative max-w-full max-h-[68vh] shadow-2xl rounded-sm overflow-hidden select-none flex items-center justify-center">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Original"
            onLoad={updateRenderedSize}
            className="block max-w-full max-h-[68vh] w-auto h-auto object-contain pointer-events-none rounded-sm"
          />

          {/* SVG Dimming Overlay Strictly Bounded to Rendered Image Dimensions */}
          {renderedSize.w > 0 && renderedSize.h > 0 && (
            <div
              style={{ width: `${renderedSize.w}px`, height: `${renderedSize.h}px` }}
              className="absolute inset-0 m-auto pointer-events-none z-10"
            >
              <svg className="w-full h-full pointer-events-none">
                <defs>
                  <mask id="crop-box-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={`${cropBox.xPct * 100}%`}
                      y={`${cropBox.yPct * 100}%`}
                      width={`${cropBox.wPct * 100}%`}
                      height={`${cropBox.hPct * 100}%`}
                      fill="black"
                    />
                  </mask>
                </defs>

                <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.65)" mask="url(#crop-box-mask)" />
              </svg>

              {/* Interactive Crop Rectangle */}
              <div
                onPointerDown={(e) => handlePointerDown('move', e)}
                style={{
                  left: `${cropBox.xPct * 100}%`,
                  top: `${cropBox.yPct * 100}%`,
                  width: `${cropBox.wPct * 100}%`,
                  height: `${cropBox.hPct * 100}%`,
                }}
                className="absolute z-20 border-2 border-amber-400 bg-amber-400/10 cursor-move pointer-events-auto touch-none flex flex-col justify-between"
              >
                {/* Grid Lines */}
                <div className="w-full h-full border-t border-b border-white/30 border-dashed pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                </div>

                {/* Corner Drag Handles */}
                <div
                  onPointerDown={(e) => handlePointerDown('tl', e)}
                  className="absolute -top-3 -left-3 w-7 h-7 bg-amber-400 border-2 border-white rounded-full shadow-lg cursor-nwse-resize z-30"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('tr', e)}
                  className="absolute -top-3 -right-3 w-7 h-7 bg-amber-400 border-2 border-white rounded-full shadow-lg cursor-nesw-resize z-30"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('bl', e)}
                  className="absolute -bottom-3 -left-3 w-7 h-7 bg-amber-400 border-2 border-white rounded-full shadow-lg cursor-nesw-resize z-30"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('br', e)}
                  className="absolute -bottom-3 -right-3 w-7 h-7 bg-amber-400 border-2 border-white rounded-full shadow-lg cursor-nwse-resize z-30"
                />

                {/* Side Drag Handles */}
                <div
                  onPointerDown={(e) => handlePointerDown('t', e)}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-amber-400 border border-white rounded-full cursor-ns-resize z-30"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('b', e)}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-amber-400 border border-white rounded-full cursor-ns-resize z-30"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('l', e)}
                  className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-10 bg-amber-400 border border-white rounded-full cursor-ew-resize z-30"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('r', e)}
                  className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-10 bg-amber-400 border border-white rounded-full cursor-ew-resize z-30"
                />
              </div>
            </div>
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
