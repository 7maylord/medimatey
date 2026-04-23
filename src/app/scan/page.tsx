"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// --- Icons ---
function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function RotateCameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 015.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SparklesIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function UploadIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

type ScanState = "idle" | "camera" | "analyzing" | "result";

interface ScanResultData {
  name: string;
  genericName: string;
  dosage: string;
  form: string;
  instructions: string;
  warnings: string[];
  confidence: number;
}

// Mock result for demo
const mockResult: ScanResultData = {
  name: "Metformin HCl",
  genericName: "Metformin Hydrochloride",
  dosage: "500mg",
  form: "Tablet",
  instructions: "Take one tablet twice daily with meals. Swallow whole with water.",
  warnings: [
    "May cause gastrointestinal side effects",
    "Monitor blood sugar regularly",
    "Avoid excessive alcohol consumption",
  ],
  confidence: 0.94,
};

export default function ScanPage() {
  const [state, setState] = useState<ScanState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setState("camera");
    } catch {
      alert("Camera access is required to scan pills. Please allow camera permissions.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setState("idle");
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Simulate AI analysis
    setState("analyzing");
    setTimeout(() => {
      setResult(mockResult);
      setState("result");
    }, 2500);
  }, []);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    // Restart camera with new facing mode
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    startCamera();
  }, [startCamera]);

  const reset = useCallback(() => {
    setState("idle");
    setCapturedImage(null);
    setResult(null);
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto gradient-mesh min-h-screen">
      {/* Header */}
      <div
        className={`mb-8 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] mb-1">
          Pill Scanner
        </h1>
        <p className="text-foreground-muted">
          Point your camera at a pill bottle to identify the medication
        </p>
      </div>

      {/* Scanner Area */}
      <div
        className={`transition-all duration-700 delay-100 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Idle State */}
        {state === "idle" && (
          <div className="glass-card-strong p-8 md:p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[var(--med-teal-500)]/10 flex items-center justify-center">
              <CameraIcon className="w-12 h-12 text-[var(--med-teal-500)]" />
            </div>
            <h2 className="text-xl font-bold font-[family-name:var(--font-outfit)] mb-2">
              Scan a Pill Bottle
            </h2>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Take a clear photo of your pill bottle label. Our AI will read it and extract the medication details.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={startCamera} className="btn-primary px-8 py-3">
                <span className="flex items-center gap-2">
                  <CameraIcon className="w-5 h-5" />
                  Open Camera
                </span>
              </button>
              <label className="btn-secondary px-8 py-3 cursor-pointer">
                <span className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5" />
                  Upload Image
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={() => {
                  // TODO: Handle file upload
                  setState("analyzing");
                  setTimeout(() => {
                    setResult(mockResult);
                    setState("result");
                  }, 2500);
                }} />
              </label>
            </div>

            {/* Or manual entry */}
            <div className="mt-8 pt-8 border-t border-[var(--card-border)]">
              <button className="text-sm text-foreground-muted hover:text-[var(--med-teal-500)] transition-colors flex items-center gap-2 mx-auto">
                <EditIcon className="w-4 h-4" />
                Or enter medication details manually
              </button>
            </div>
          </div>
        )}

        {/* Camera View */}
        {state === "camera" && (
          <div className="glass-card-strong overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] md:aspect-video object-cover bg-black"
            />

            {/* Scanner overlay guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 md:w-80 md:h-48 border-2 border-[var(--med-teal-500)]/60 rounded-2xl">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-[var(--med-teal-500)] rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-[var(--med-teal-500)] rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-[var(--med-teal-500)] rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-[var(--med-teal-500)] rounded-br-xl" />
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
              <button onClick={stopCamera} className="btn-icon bg-black/40 text-white border-white/20 w-12 h-12">
                <XIcon className="w-5 h-5" />
              </button>
              <button
                onClick={captureFrame}
                className="w-16 h-16 rounded-full bg-white border-4 border-[var(--med-teal-500)] hover:scale-105 transition-transform active:scale-95 shadow-xl"
                aria-label="Capture photo"
              />
              <button onClick={toggleCamera} className="btn-icon bg-black/40 text-white border-white/20 w-12 h-12">
                <RotateCameraIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="absolute top-4 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-lg">
              Align the pill bottle label within the frame
            </p>
          </div>
        )}

        {/* Analyzing State */}
        {state === "analyzing" && (
          <div className="glass-card-strong p-12 text-center">
            {capturedImage && (
              <div className="w-48 h-48 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-[var(--med-teal-500)]/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedImage} alt="Captured pill" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-[var(--med-teal-500)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-3 h-3 rounded-full bg-[var(--med-teal-500)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-3 h-3 rounded-full bg-[var(--med-teal-500)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] mb-2">
              Analyzing with Gemma 4 AI...
            </h2>
            <p className="text-sm text-foreground-muted">
              Reading label, identifying medication, checking interactions
            </p>
          </div>
        )}

        {/* Result State */}
        {state === "result" && result && (
          <div className="space-y-6 animate-slide-up">
            {/* Main result card */}
            <div className="glass-card-strong p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SparklesIcon className="w-5 h-5 text-[var(--med-teal-500)]" />
                    <span className="text-xs font-semibold text-[var(--med-teal-500)] uppercase tracking-wider">
                      AI Identified
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">
                    {result.name}
                  </h2>
                  <p className="text-foreground-muted text-sm">{result.genericName}</p>
                </div>
                <div className="badge badge-success">
                  {Math.round(result.confidence * 100)}% match
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4">
                  <div className="text-xs text-foreground-muted mb-1">Dosage</div>
                  <div className="text-lg font-bold">{result.dosage}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-xs text-foreground-muted mb-1">Form</div>
                  <div className="text-lg font-bold">{result.form}</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">Instructions</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{result.instructions}</p>
              </div>

              {result.warnings.length > 0 && (
                <div className="glass-card p-4 border-l-4 border-l-[var(--med-amber-500)]">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    ⚠️ Warnings
                  </h3>
                  <ul className="space-y-1">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-foreground-muted flex items-start gap-2">
                        <span className="text-[var(--med-amber-500)] mt-0.5">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn-primary flex-1 py-3">
                <span className="flex items-center justify-center gap-2">
                  <PlusIcon className="w-5 h-5" />
                  Add to My Medications
                </span>
              </button>
              <button onClick={reset} className="btn-secondary flex-1 py-3">
                <span className="flex items-center justify-center gap-2">
                  <CameraIcon className="w-5 h-5" />
                  Scan Another
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
