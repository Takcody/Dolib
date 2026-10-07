import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, ScanLine, Zap, ZapOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CropAdjuster } from './CropAdjuster';
import {
  QuadCorners,
  detectBookCorners,
  isCornersStable,
  getDefaultCorners,
} from '@/lib/documentScanner';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  HTMLCanvasElementLuminanceSource,
} from '@zxing/library';

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
  onScan?: (data: string) => void;
  onClose: () => void;
  mode?: 'photo' | 'scan';
  allowModeSwitch?: boolean;
}

export function CameraCapture({
  onCapture,
  onScan,
  onClose,
  mode: initialMode = 'photo',
  allowModeSwitch = false,
}: CameraCaptureProps) {
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

  // Auto-Crop & Book Corner Detection state
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [detectedCorners, setDetectedCorners] = useState<QuadCorners | null>(null);
  const [stableProgress, setStableProgress] = useState(0); // 0.0 to 1.0
  const [showCropAdjuster, setShowCropAdjuster] = useState(false);

  const prevCornersRef = useRef<QuadCorners | null>(null);
  const steadyTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(Date.now());

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
        BarcodeFormat.ITF,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      reader.setHints(hints);
      zxingReaderRef.current = reader;
    } catch (e) {
      console.error('Error setting up ZXing reader:', e);
    }

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        nativeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'itf'],
        });
      } catch (e) {
        console.warn('Native BarcodeDetector not initialized:', e);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
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
        videoRef.current.play().catch(() => {});
      }

      const track = mediaStream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() || {}) as any;
      if (capabilities.torch) {
        setHasTorch(true);
      }
    } catch (err) {
      console.warn('Retrying camera with basic constraints...', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        streamRef.current = fallbackStream;
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.error('Camera access failed completely:', e);
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
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.error('Error toggling torch:', e);
      }
    }
  };

  const handleScanSuccess = useCallback(
    (code: string) => {
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
    },
    [onScan, stopCamera, onClose]
  );

  // Barcode scanning loop
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
          } catch {}
        }

        if (canvas && rotCanvas && zxing) {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
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

  // Capture frame function with corner support
  const captureWithCorners = useCallback((overrideCorners?: QuadCorners) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

        const cornersToUse =
          overrideCorners ||
          detectedCorners ||
          getDefaultCorners(canvas.width, canvas.height, 0.18);

        setCapturedImage(dataUrl);
        setDetectedCorners(cornersToUse);
        setShowCropAdjuster(true);
      }
    }
  }, [detectedCorners]);

  // Live Real-Time Corner Detection & 1-Second Auto-Capture Loop
  useEffect(() => {
    if (mode !== 'photo' || capturedImage || showCropAdjuster) return;

    let isMounted = true;
    let timeoutId: any = null;

    const processPhotoCorners = () => {
      if (!isMounted) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (canvas) {
          const procW = 360;
          const procH = Math.round((procW / vw) * vh);
          canvas.width = procW;
          canvas.height = procH;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, vw, vh, 0, 0, procW, procH);
            const detected = detectBookCorners(ctx, procW, procH);

            const now = Date.now();
            const dt = Math.min(200, now - lastFrameTimeRef.current);
            lastFrameTimeRef.current = now;

            if (detected) {
              const scaleX = vw / procW;
              const scaleY = vh / procH;
              const fullCorners: QuadCorners = {
                tl: { x: detected.corners.tl.x * scaleX, y: detected.corners.tl.y * scaleY },
                tr: { x: detected.corners.tr.x * scaleX, y: detected.corners.tr.y * scaleY },
                br: { x: detected.corners.br.x * scaleX, y: detected.corners.br.y * scaleY },
                bl: { x: detected.corners.bl.x * scaleX, y: detected.corners.bl.y * scaleY },
              };

              setDetectedCorners(fullCorners);

              if (isCornersStable(prevCornersRef.current, fullCorners, vw, vh)) {
                steadyTimeRef.current += dt;
                const progress = Math.min(1.0, steadyTimeRef.current / 1000);
                setStableProgress(progress);

                if (steadyTimeRef.current >= 1000 && autoCaptureEnabled) {
                  try {
                    navigator.vibrate?.([50, 30, 50]);
                  } catch {}
                  toast.success(t('auto_captured', { defaultValue: 'Book detected! Auto-captured' }));
                  captureWithCorners(fullCorners);
                  return;
                }
              } else {
                steadyTimeRef.current = 0;
                setStableProgress(0);
              }

              prevCornersRef.current = fullCorners;
            } else {
              setDetectedCorners(null);
              prevCornersRef.current = null;
              steadyTimeRef.current = 0;
              setStableProgress(0);
            }
          }
        }
      }

      if (isMounted) {
        timeoutId = setTimeout(processPhotoCorners, 100);
      }
    };

    processPhotoCorners();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mode, capturedImage, showCropAdjuster, autoCaptureEnabled, captureWithCorners, t]);

  const handleCroppedConfirm = (croppedDataUrl: string) => {
    if (onCapture) {
      onCapture(croppedDataUrl);
    }
    stopCamera();
    onClose();
  };

  const handleRetakePhoto = useCallback(() => {
    setCapturedImage(null);
    setShowCropAdjuster(false);
    setStableProgress(0);
    steadyTimeRef.current = 0;
    prevCornersRef.current = null;

    // Re-initialize camera stream on retake so video element never gets paused
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        startCamera();
      });
    } else {
      startCamera();
    }
  }, [startCamera]);

  // Convert full video coordinates to percentage for overlay rendering
  const getDisplayPoint = (p: { x: number; y: number }) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return { x: 0, y: 0 };
    return {
      x: (p.x / video.videoWidth) * 100,
      y: (p.y / video.videoHeight) * 100,
    };
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
          <div className="text-white text-center p-6 max-w-xs z-20">
            <p className="mb-4 text-sm">{error}</p>
            <Button variant="outline" className="text-white border-white" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        ) : (
          <>
            {/* Live Video Stream ALWAYS kept in DOM */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                videoRef.current?.play().catch(() => {});
              }}
              className={cn(
                'w-full h-full object-cover',
                showCropAdjuster ? 'hidden' : 'block'
              )}
            />

            {/* Detected Corners & Stability Countdown Overlay */}
            {mode === 'photo' && detectedCorners && !showCropAdjuster && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <polygon
                  points={`${getDisplayPoint(detectedCorners.tl).x}%,${getDisplayPoint(detectedCorners.tl).y}% ${getDisplayPoint(detectedCorners.tr).x}%,${getDisplayPoint(detectedCorners.tr).y}% ${getDisplayPoint(detectedCorners.br).x}%,${getDisplayPoint(detectedCorners.br).y}% ${getDisplayPoint(detectedCorners.bl).x}%,${getDisplayPoint(detectedCorners.bl).y}%`}
                  fill={stableProgress > 0.5 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.15)'}
                  stroke={stableProgress > 0.5 ? '#22c55e' : '#3b82f6'}
                  strokeWidth="3"
                />
              </svg>
            )}

            {/* 1-Second Countdown Visual Ring */}
            {mode === 'photo' && stableProgress > 0 && !showCropAdjuster && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-15">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="5"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#22c55e"
                      strokeWidth="5"
                      fill="none"
                      strokeDasharray="213.6"
                      strokeDashoffset={213.6 * (1 - stableProgress)}
                      className="transition-all duration-75"
                    />
                  </svg>
                  <span className="absolute text-white font-bold text-xs">
                    {Math.ceil((1 - stableProgress) * 100) / 100}s
                  </span>
                </div>
                <p className="mt-3 text-emerald-400 font-semibold text-xs bg-black/70 px-3 py-1 rounded-full backdrop-blur-xs">
                  {t('hold_steady', { defaultValue: 'Hold steady to capture...' })}
                </p>
              </div>
            )}

            {/* Scan Reticle Overlay for Barcode Scan Mode */}
            {mode === 'scan' && !showCropAdjuster && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                <div
                  className={cn(
                    'relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]',
                    detectedCode ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-white/80'
                  )}
                >
                  <div className={cn('absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors', detectedCode ? 'border-emerald-400' : 'border-primary')} />
                  <div className={cn('absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors', detectedCode ? 'border-emerald-400' : 'border-primary')} />
                  <div className={cn('absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors', detectedCode ? 'border-emerald-400' : 'border-primary')} />
                  <div className={cn('absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors', detectedCode ? 'border-emerald-400' : 'border-primary')} />

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

        {/* Top Controls: Mode Switcher */}
        {allowModeSwitch && !showCropAdjuster && (
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

        {/* Top Right Controls: Auto-Capture Toggle, Torch & Close */}
        {!showCropAdjuster && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20 pt-[env(safe-area-inset-top)]">
            {mode === 'photo' && (
              <Button
                variant="secondary"
                size="sm"
                className={cn(
                  'rounded-full shadow-md text-xs h-8 px-2.5 gap-1 transition-colors',
                  autoCaptureEnabled ? 'bg-amber-400 text-black font-semibold' : 'bg-white/20 text-white'
                )}
                onClick={() => setAutoCaptureEnabled(!autoCaptureEnabled)}
                title="Toggle Auto-Capture"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{autoCaptureEnabled ? 'Auto 1s' : 'Manual'}</span>
              </Button>
            )}

            {hasTorch && (
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  'rounded-full shadow-md transition-colors w-8 h-8',
                  torchOn ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-white/20 text-white hover:bg-white/30'
                )}
                onClick={toggleTorch}
                title="Flashlight"
              >
                {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full shadow-md w-8 h-8"
              onClick={() => {
                stopCamera();
                onClose();
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* CropAdjuster Overlay */}
      {showCropAdjuster && capturedImage && (
        <CropAdjuster
          imageSrc={capturedImage}
          initialCorners={detectedCorners}
          onConfirm={handleCroppedConfirm}
          onRetake={handleRetakePhoto}
        />
      )}

      {/* Bottom Shutter Controls for Photo Mode */}
      {!showCropAdjuster && (
        <div className="bg-black/95 p-6 pb-8 flex flex-col items-center justify-center gap-2 z-20">
          {mode === 'photo' && (
            <>
              <Button
                size="lg"
                className="w-18 h-18 rounded-full bg-white text-black hover:bg-zinc-200 shadow-lg active:scale-95 transition-transform"
                onClick={() => captureWithCorners()}
              >
                <Camera className="w-8 h-8" />
              </Button>
              <p className="text-[11px] text-white/60">
                {autoCaptureEnabled
                  ? t('auto_capture_hint', { defaultValue: 'Auto-captures when book corners are stable for 1s' })
                  : t('manual_capture_hint', { defaultValue: 'Tap shutter to take photo and crop' })}
              </p>
            </>
          )}

          {mode === 'scan' && (
            <div className="flex items-center gap-2.5 text-white/90 text-sm font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>
                {detectedCode
                  ? `Detected ${detectedCode}`
                  : t('scan_hint', { defaultValue: 'Align barcode or QR code inside the frame' })}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
