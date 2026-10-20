import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, ScanLine, Zap, ZapOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CropAdjuster } from './CropAdjuster';
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
  const prevFramePixelsRef = useRef<Uint8ClampedArray | null>(null);
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

  // Auto-Capture & Motion Stability state
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [stableProgress, setStableProgress] = useState(0); // 0.0 to 1.0

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

  // Capture full uncropped video frame
  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (vw <= 0 || vh <= 0) return;

      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, vw, vh);
        const fullDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedImage(fullDataUrl);
      }
    }
  }, []);

  // Motion Stability Detection Loop for Photo Mode
  useEffect(() => {
    if (mode !== 'photo' || capturedImage) return;

    let isMounted = true;
    let timeoutId: any = null;

    const processMotionDetection = () => {
      if (!isMounted) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (canvas) {
          const sampleW = 120;
          const sampleH = 160;
          canvas.width = sampleW;
          canvas.height = sampleH;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            const cropX = Math.round(vw * 0.15);
            const cropY = Math.round(vh * 0.20);
            const cropW = Math.round(vw * 0.70);
            const cropH = Math.round(vh * 0.60);

            ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, sampleW, sampleH);
            const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
            const currPixels = imageData.data;

            const now = Date.now();
            const dt = Math.min(200, now - lastFrameTimeRef.current);
            lastFrameTimeRef.current = now;

            if (prevFramePixelsRef.current && prevFramePixelsRef.current.length === currPixels.length) {
              const prevPixels = prevFramePixelsRef.current;
              let totalDiff = 0;
              const sampleCount = (sampleW * sampleH) / 4;

              for (let i = 0; i < currPixels.length; i += 16) {
                totalDiff += Math.abs(currPixels[i] - prevPixels[i]);
                totalDiff += Math.abs(currPixels[i + 1] - prevPixels[i + 1]);
                totalDiff += Math.abs(currPixels[i + 2] - prevPixels[i + 2]);
              }

              const avgDiff = totalDiff / sampleCount;

              // Camera is held steady over book if avg motion < 32.0
              if (avgDiff < 32.0 && autoCaptureEnabled) {
                steadyTimeRef.current += dt;
                const progress = Math.min(1.0, steadyTimeRef.current / 1000);
                setStableProgress(progress);

                if (steadyTimeRef.current >= 1000) {
                  try {
                    navigator.vibrate?.([50, 30, 50]);
                  } catch {}
                  toast.success(t('auto_captured', { defaultValue: 'Hold still! Photo snapped' }));
                  captureFrame();
                  return;
                }
              } else {
                steadyTimeRef.current = Math.max(0, steadyTimeRef.current - dt * 1.5);
                setStableProgress(Math.min(1.0, steadyTimeRef.current / 1000));
              }
            }

            prevFramePixelsRef.current = currPixels;
          }
        }
      }

      if (isMounted) {
        timeoutId = setTimeout(processMotionDetection, 100);
      }
    };

    processMotionDetection();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mode, capturedImage, autoCaptureEnabled, captureFrame, t]);

  const handleConfirmCropped = (croppedDataUrl: string) => {
    if (onCapture) {
      onCapture(croppedDataUrl);
    }
    stopCamera();
    onClose();
  };

  const handleRetakePhoto = useCallback(() => {
    setCapturedImage(null);
    setStableProgress(0);
    steadyTimeRef.current = 0;
    lastFrameTimeRef.current = Date.now();
    prevFramePixelsRef.current = null;

    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => startCamera());
    } else {
      startCamera();
    }
  }, [startCamera]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[60] flex flex-col justify-between"
    >
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        {error ? (
          <div className="text-white text-center p-6 max-w-xs z-20">
            <p className="mb-4 text-sm">{error}</p>
            <Button variant="outline" className="text-white border-white" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        ) : capturedImage ? (
          /* Flexible Rectangular Crop Adjuster */
          <CropAdjuster
            imageSrc={capturedImage}
            onConfirm={handleConfirmCropped}
            onRetake={handleRetakePhoto}
          />
        ) : (
          /* Live Camera Stream with Framing Guide Reticle */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                videoRef.current?.play().catch(() => {});
              }}
              className="w-full h-full object-cover"
            />

            {/* Book Framing Guide Box */}
            {mode === 'photo' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 pt-8">
                <div
                  className={cn(
                    'relative w-[65vw] max-w-xs max-h-[46vh] aspect-[1/1.414] mt-6 rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden bg-black/10 backdrop-blur-[1px]',
                    stableProgress > 0.5 ? 'border-emerald-400 bg-emerald-500/20' : 'border-white/80'
                  )}
                >
                  <div className={cn('absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors', stableProgress > 0.5 ? 'border-emerald-400' : 'border-primary')} />
                  <div className={cn('absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors', stableProgress > 0.5 ? 'border-emerald-400' : 'border-primary')} />
                  <div className={cn('absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors', stableProgress > 0.5 ? 'border-emerald-400' : 'border-primary')} />
                  <div className={cn('absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors', stableProgress > 0.5 ? 'border-emerald-400' : 'border-primary')} />

                  {/* 1-Second Motion Stability Ring */}
                  {stableProgress > 0 && (
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                      <svg className="w-16 h-16 -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="#22c55e"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="163.3"
                          strokeDashoffset={163.3 * (1 - stableProgress)}
                          className="transition-all duration-75"
                        />
                      </svg>
                      <span className="absolute text-white font-bold text-xs">
                        {Math.ceil((1 - stableProgress) * 100) / 100}s
                      </span>
                    </div>
                  )}
                </div>

                <p className="mt-5 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-xs tracking-wide">
                  {stableProgress > 0
                    ? t('hold_steady', { defaultValue: 'Hold still to snap...' })
                    : t('align_book_hint', { defaultValue: 'Center book cover inside frame' })}
                </p>
              </div>
            )}

            {/* Scan Reticle for Barcode Mode */}
            {mode === 'scan' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                <div
                  className={cn(
                    'relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]',
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
                  {detectedCode ? `Scanned: ${detectedCode}` : t('scan_hint', { defaultValue: 'Align barcode inside frame' })}
                </p>
              </div>
            )}
          </>
        )}

        {/* Offscreen canvases */}
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={rotCanvasRef} className="hidden" />

        {/* Top Controls Header Bar */}
        {!capturedImage && (
          <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] flex items-center justify-between z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {allowModeSwitch ? (
              <div className="flex gap-2">
                <Button
                  variant={mode === 'photo' ? 'default' : 'secondary'}
                  size="sm"
                  className="rounded-full shadow-md text-xs h-8"
                  onClick={() => setMode('photo')}
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  {t('photo')}
                </Button>
                <Button
                  variant={mode === 'scan' ? 'default' : 'secondary'}
                  size="sm"
                  className="rounded-full shadow-md text-xs h-8"
                  onClick={() => setMode('scan')}
                >
                  <ScanLine className="w-3.5 h-3.5 mr-1.5" />
                  {t('scan')}
                </Button>
              </div>
            ) : <div />}

            <div className="flex items-center gap-2">
              {mode === 'photo' && (
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    'rounded-full shadow-md text-xs h-8 px-2.5 gap-1 transition-colors',
                    autoCaptureEnabled ? 'bg-amber-400 text-black font-semibold' : 'bg-white/20 text-white'
                  )}
                  onClick={() => setAutoCaptureEnabled(!autoCaptureEnabled)}
                  title="Toggle Motion Auto-Snap"
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
          </div>
        )}
      </div>

      {/* Bottom Shutter Controls */}
      {!capturedImage && (
        <div className="bg-black/95 p-6 pb-8 flex flex-col items-center justify-center gap-2 z-20 border-t border-white/10">
          {mode === 'photo' && (
            <>
              <Button
                size="lg"
                className="w-18 h-18 rounded-full bg-white text-black hover:bg-zinc-200 shadow-lg active:scale-95 transition-transform"
                onClick={() => captureFrame()}
              >
                <Camera className="w-8 h-8" />
              </Button>
              <p className="text-[11px] text-white/60 mt-1">
                {autoCaptureEnabled
                  ? t('auto_snap_hint', { defaultValue: 'Hold still for 1s inside frame to auto-snap' })
                  : t('manual_snap_hint', { defaultValue: 'Tap shutter to take photo' })}
              </p>
            </>
          )}

          {mode === 'scan' && (
            <div className="flex items-center gap-2.5 text-white/90 text-sm font-medium py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>
                {detectedCode
                  ? `Detected ${detectedCode}`
                  : t('scan_hint', { defaultValue: 'Align barcode inside frame' })}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
