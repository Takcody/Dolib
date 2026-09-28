import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, ScanLine, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  HTMLCanvasElementLuminanceSource,
} from '@zxing/library';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onScan?: (data: string) => void;
  onClose: () => void;
  mode?: 'photo' | 'scan';
  allowModeSwitch?: boolean;
}

export function CameraCapture({ onCapture, onScan, onClose, mode: initialMode = 'photo', allowModeSwitch = false }: CameraCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const zxingReaderRef = useRef<MultiFormatReader | null>(null);
  const nativeDetectorRef = useRef<any>(null);
  const hasScannedRef = useRef(false);

  const [mode, setMode] = useState<'photo' | 'scan'>(initialMode);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  // Initialize ZXing and Native BarcodeDetector engines
  useEffect(() => {
    try {
      const reader = new MultiFormatReader();
      const hints = new Map<DecodeHintType, any>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.ITF
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      reader.setHints(hints);
      zxingReaderRef.current = reader;
    } catch (e) {
      console.error("Error setting up ZXing reader:", e);
    }

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        nativeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'itf']
        });
      } catch (e) {
        console.warn("Native BarcodeDetector not initialized:", e);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check if torch/flashlight is supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() || {}) as any;
      if (capabilities.torch) {
        setHasTorch(true);
      }
    } catch (err) {
      console.warn("Retrying camera with basic constraints...", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        streamRef.current = fallbackStream;
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (e) {
        console.error("Camera access failed completely:", e);
        setError(t('camera_error'));
      }
    }
  }, [stopCamera, t]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && (track.getCapabilities?.() as any)?.torch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.error("Error toggling torch:", e);
      }
    }
  };

  const handleScanSuccess = useCallback((code: string) => {
    setDetectedCode(code);
    try {
      navigator.vibrate?.([60, 40, 60]);
    } catch {}
    toast.success(`Scanned: ${code}`);
    setTimeout(() => {
      if (onScan) {
        onScan(code);
      }
      stopCamera();
      onClose();
    }, 400);
  }, [onScan, stopCamera, onClose]);

  // Barcode scanning processing loop
  useEffect(() => {
    if (mode !== 'scan') return;

    let isMounted = true;
    let timeoutId: any = null;

    const processScan = async () => {
      if (!isMounted || hasScannedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const rotCanvas = rotCanvasRef.current;
      const zxing = zxingReaderRef.current;

      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        // 1. Try Native BarcodeDetector first (fastest and hardware-accelerated)
        if (nativeDetectorRef.current) {
          try {
            const barcodes = await nativeDetectorRef.current.detect(video);
            if (barcodes && barcodes.length > 0) {
              for (const bc of barcodes) {
                if (bc.rawValue && bc.rawValue.trim()) {
                  hasScannedRef.current = true;
                  handleScanSuccess(bc.rawValue.trim());
                  return;
                }
              }
            }
          } catch {
            // continue to ZXing fallback
          }
        }

        // 2. ZXing MultiFormatReader fallback
        if (canvas && rotCanvas && zxing) {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // A. Focus on center crop (where reticle points on the book/barcode)
            const cropW = Math.round(vw * 0.7);
            const cropH = Math.round(vh * 0.7);
            const cropX = Math.round((vw - cropW) / 2);
            const cropY = Math.round((vh - cropH) / 2);

            canvas.width = cropW;
            canvas.height = cropH;
            ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            try {
              const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
              const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
              const result = zxing.decodeWithState(binaryBitmap);
              zxing.reset();
              if (result && result.getText()) {
                hasScannedRef.current = true;
                handleScanSuccess(result.getText());
                return;
              }
            } catch {
              zxing.reset();
            }

            // B. 90-degree rotated crop (supports barcodes in landscape/portrait sensor disparity)
            const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });
            if (rotCtx) {
              rotCanvas.width = cropH;
              rotCanvas.height = cropW;
              rotCtx.save();
              rotCtx.translate(cropH / 2, cropW / 2);
              rotCtx.rotate(Math.PI / 2);
              rotCtx.drawImage(canvas, -cropW / 2, -cropH / 2);
              rotCtx.restore();

              try {
                const luminanceSource = new HTMLCanvasElementLuminanceSource(rotCanvas);
                const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
                const result = zxing.decodeWithState(binaryBitmap);
                zxing.reset();
                if (result && result.getText()) {
                  hasScannedRef.current = true;
                  handleScanSuccess(result.getText());
                  return;
                }
              } catch {
                zxing.reset();
              }
            }

            // C. Full-frame decode
            const maxW = 1280;
            const fullW = Math.min(vw, maxW);
            const fullH = Math.round((fullW / vw) * vh);
            canvas.width = fullW;
            canvas.height = fullH;
            ctx.drawImage(video, 0, 0, vw, vh, 0, 0, fullW, fullH);

            try {
              const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
              const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
              const result = zxing.decodeWithState(binaryBitmap);
              zxing.reset();
              if (result && result.getText()) {
                hasScannedRef.current = true;
                handleScanSuccess(result.getText());
                return;
              }
            } catch {
              zxing.reset();
            }
          }
        }
      }

      if (isMounted && !hasScannedRef.current) {
        timeoutId = setTimeout(processScan, 90);
      }
    };

    processScan();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mode, handleScanSuccess]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[60] flex flex-col"
    >
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        {error ? (
          <div className="text-white text-center p-6 max-w-xs">
            <p className="mb-4 text-sm">{error}</p>
            <Button variant="outline" className="text-white border-white" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        ) : (
          <>
            {/* Unified Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                capturedImage ? "hidden" : "block"
              )}
            />

            {/* Photo Captured Still Preview */}
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}

            {/* Scan Reticle & Viewfinder Overlay */}
            {mode === 'scan' && !capturedImage && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                <div
                  className={cn(
                    "relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]",
                    detectedCode ? "border-emerald-400 bg-emerald-500/20 scale-105" : "border-white/80"
                  )}
                >
                  {/* Corner Reticle Accents */}
                  <div className={cn("absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors", detectedCode ? "border-emerald-400" : "border-primary")} />
                  <div className={cn("absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors", detectedCode ? "border-emerald-400" : "border-primary")} />
                  <div className={cn("absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors", detectedCode ? "border-emerald-400" : "border-primary")} />
                  <div className={cn("absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors", detectedCode ? "border-emerald-400" : "border-primary")} />

                  {detectedCode && (
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-black/70 backdrop-blur-xs text-white">
                      <Check className="w-8 h-8 text-emerald-400" />
                      <span className="text-xs font-mono font-bold tracking-wider">{detectedCode}</span>
                    </div>
                  )}
                </div>

                <p className="mt-5 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xs tracking-wide">
                  {detectedCode ? `Scanned: ${detectedCode}` : t('scan_hint', { defaultValue: 'Align barcode within the frame' })}
                </p>
              </div>
            )}
          </>
        )}
        
        {/* Offscreen canvases for image processing */}
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={rotCanvasRef} className="hidden" />

        {/* Top Controls: Mode Switcher (only if allowModeSwitch is enabled) */}
        {allowModeSwitch && (
          <div className="absolute top-4 left-4 flex gap-2 z-20 pt-[env(safe-area-inset-top)]">
            <Button
              variant={mode === 'photo' ? 'default' : 'secondary'}
              size="sm"
              className="rounded-full shadow-md"
              onClick={() => {
                setMode('photo');
                setCapturedImage(null);
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              {t('photo')}
            </Button>
            <Button
              variant={mode === 'scan' ? 'default' : 'secondary'}
              size="sm"
              className="rounded-full shadow-md"
              onClick={() => {
                setMode('scan');
                setCapturedImage(null);
              }}
            >
              <ScanLine className="w-4 h-4 mr-2" />
              {t('scan')}
            </Button>
          </div>
        )}

        {/* Top Right Controls: Torch & Close */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20 pt-[env(safe-area-inset-top)]">
          {hasTorch && (
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "rounded-full shadow-md transition-colors",
                torchOn ? "bg-amber-400 text-black hover:bg-amber-300" : "bg-white/20 text-white hover:bg-white/30"
              )}
              onClick={toggleTorch}
              title="Flashlight"
            >
              {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full shadow-md"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Bottom Shutter / Action Controls */}
      <div className="bg-black/95 p-6 pb-8 flex items-center justify-center">
        {mode === 'photo' && (
          !capturedImage ? (
            <Button
              size="lg"
              className="w-18 h-18 rounded-full bg-white text-black hover:bg-zinc-200 shadow-lg active:scale-95 transition-transform"
              onClick={capture}
            >
              <Camera className="w-8 h-8" />
            </Button>
          ) : (
            <div className="flex gap-4 w-full max-w-xs">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 border-none"
                onClick={retake}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('retake')}
              </Button>
              <Button
                size="lg"
                className="flex-1 rounded-full bg-primary text-primary-foreground shadow-md"
                onClick={confirm}
              >
                <Check className="w-4 h-4 mr-2" />
                {t('use_photo')}
              </Button>
            </div>
          )
        )}
        {mode === 'scan' && (
          <div className="flex items-center gap-2.5 text-white/90 text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>{detectedCode ? `Detected ${detectedCode}` : t('scan_hint', { defaultValue: 'Align barcode or QR code inside the frame' })}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

