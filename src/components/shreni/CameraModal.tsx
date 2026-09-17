import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Upload, X, Check } from "lucide-react";
import { useShreni } from "@/context/ShreniContext";

export function CameraModal() {
  const { cameraOpen, closeCamera, onPhotoCaptured } = useShreni();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!cameraOpen) {
      cleanupStream();
      setCapturedPreview(null);
      return;
    }

    startCamera(facingMode);

    return () => {
      cleanupStream();
    };
  }, [cameraOpen, facingMode]);

  function cleanupStream() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }

  async function startCamera(mode: "environment" | "user") {
    cleanupStream();
    setErrorMsg(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setErrorMsg("Direct camera API not supported on this browser. Please upload a photo.");
      }
    } catch (err: any) {
      console.warn("[Camera Start Error]", err);
      setErrorMsg("Camera access denied or unavailable. Use the upload button below.");
    }
  }

  function handleCapture() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPreview(dataUrl);
    cleanupStream();
  }

  function handleConfirmPhoto() {
    if (capturedPreview) {
      onPhotoCaptured(capturedPreview);
      setCapturedPreview(null);
    }
  }

  function handleRetake() {
    setCapturedPreview(null);
    startCamera(facingMode);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedPreview(result);
      cleanupStream();
    };
    reader.readAsDataURL(file);
  }

  if (!cameraOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              {capturedPreview ? "Confirm Craft Photo" : "Photograph Your Craft"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Step 1 of 5: Shreni AI analyzes your creation
            </p>
          </div>
          <button
            type="button"
            onClick={closeCamera}
            className="rounded-full bg-secondary p-2 text-secondary-foreground hover:bg-secondary/80"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-black">
          {capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Captured craft"
              className="size-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-cover"
              />
              {/* Framing overlay */}
              <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-amber-400/70" />
              <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center">
                <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                  Align your craft within frame
                </span>
              </div>
            </>
          )}

          {errorMsg && !capturedPreview ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center text-white">
              <Camera className="size-10 text-amber-400 mb-2" />
              <p className="text-xs">{errorMsg}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Upload className="size-4" /> Choose from Gallery
              </button>
            </div>
          ) : null}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 bg-card p-5">
          {capturedPreview ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
              >
                <RefreshCw className="size-4" /> Retake
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-warm py-3 text-sm font-bold text-primary-foreground shadow-card"
              >
                <Check className="size-4" /> Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-2xl border border-border bg-secondary px-4 py-3 text-xs font-semibold text-secondary-foreground"
              >
                <Upload className="size-4 text-primary" /> Gallery
              </button>

              <button
                type="button"
                onClick={handleCapture}
                className="group relative flex size-16 items-center justify-center rounded-full bg-gradient-warm shadow-float transition-transform active:scale-95"
              >
                <div className="size-13 rounded-full border-2 border-white/80" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                }
                className="flex items-center gap-1.5 rounded-2xl border border-border bg-secondary px-4 py-3 text-xs font-semibold text-secondary-foreground"
              >
                <RefreshCw className="size-4" /> Flip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
