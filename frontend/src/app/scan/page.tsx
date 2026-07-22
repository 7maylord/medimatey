"use client";

import { useState, useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useAI } from "@/hooks/useAI";
import { useMedications } from "@/hooks/useStorage";
import { parseFrequency, freqToTimeSlots, scheduleForToday } from "@/lib/schedule-utils";
import type { Medication } from "@/types";

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

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type ScanState = "idle" | "camera" | "analyzing" | "result" | "saved";

interface ScanResultData {
  name?: string;
  genericName?: string;
  dosage?: string;
  form?: string;
  instructions?: string;
  warnings?: string[];
  confidence?: number;
  frequency?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ScanPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);

  const { videoRef, canvasRef, isStreaming, error: cameraError, startCamera, stopCamera, captureFrame, switchCamera } = useCamera();
  const { analyzePill, loading: aiLoading } = useAI();
  const { add: addMedication } = useMedications();

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleCapture = async () => {
    const dataUrl = captureFrame();
    if (!dataUrl) return;
    stopCamera();
    setCapturedImage(dataUrl);
    setScanState("analyzing");
    await runAnalysis(dataUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToBase64(file);
    setCapturedImage(dataUrl);
    setScanState("analyzing");
    await runAnalysis(dataUrl);
  };

  const runAnalysis = async (dataUrl: string) => {
    setAiError(null);
    try {
      const data = await analyzePill(dataUrl);
      setResult(data as ScanResultData);
      setScanState("result");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Analysis failed");
      setScanState("idle");
    }
  };

  const handleAddMedication = async () => {
    if (!result) return;
    const now = new Date().toISOString();
    const frequency = parseFrequency(result.frequency);
    const timeSlots = freqToTimeSlots(frequency);
    const med: Medication = {
      id: crypto.randomUUID(),
      name: result.name ?? "Unknown Medication",
      genericName: result.genericName,
      dosage: result.dosage ?? "",
      form: (result.form as Medication["form"]) ?? "other",
      frequency,
      timeSlots,
      instructions: result.instructions,
      warnings: result.warnings,
      imageData: capturedImage ?? undefined,
      startDate: now.split("T")[0],
      addedAt: now,
      updatedAt: now,
    };
    await addMedication(med);
    const count = await scheduleForToday(med);
    setScheduledCount(count);
    setScanState("saved");
  };

  const reset = () => {
    setScanState("idle");
    setCapturedImage(null);
    setResult(null);
    setAiError(null);
    setScheduledCount(0);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto gradient-mesh min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-(family-name:--font-outfit) mb-1">Pill Scanner</h1>
        <p className="text-foreground-muted">Point your camera at a pill bottle to identify the medication</p>
      </div>

      <div>
        {/* Error banner */}
        {(cameraError || aiError) && (
          <div className="mb-4 p-4 rounded-xl bg-(--med-coral-500)/10 border border-(--med-coral-500)/30 text-sm text-med-coral-500">
            {cameraError ?? aiError}
          </div>
        )}

        {/* Idle */}
        {scanState === "idle" && (
          <div className="glass-card-strong p-8 md:p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-(--med-teal-500)/10 flex items-center justify-center">
              <CameraIcon className="w-12 h-12 text-med-teal-500" />
            </div>
            <h2 className="text-xl font-bold font-(family-name:--font-outfit) mb-2">Scan a Pill Bottle</h2>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Take a clear photo of your pill bottle label. Gemma 4 AI will read it and extract the medication details.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => { setScanState("camera"); startCamera(); }}
                className="btn-primary px-8 py-3"
              >
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
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        )}

        {/* Camera */}
        {scanState === "camera" && (
          <div className="glass-card-strong overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-4/3 md:aspect-video object-cover bg-black"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 md:w-80 md:h-48 border-2 border-(--med-teal-500)/60 rounded-2xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-med-teal-500 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-med-teal-500 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-med-teal-500 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-med-teal-500 rounded-br-xl" />
              </div>
            </div>
            <p className="absolute top-4 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-lg">
              Align the pill bottle label within the frame
            </p>
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
              <button onClick={() => { stopCamera(); setScanState("idle"); }} className="btn-icon bg-black/40 text-white border-white/20 w-12 h-12">
                <XIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleCapture}
                disabled={!isStreaming}
                className="w-16 h-16 rounded-full bg-white border-4 border-med-teal-500 hover:scale-105 transition-transform active:scale-95 shadow-xl disabled:opacity-50"
                aria-label="Capture photo"
              />
              <button onClick={switchCamera} className="btn-icon bg-black/40 text-white border-white/20 w-12 h-12">
                <RotateCameraIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {(scanState === "analyzing" || aiLoading) && (
          <div className="glass-card-strong p-12 text-center">
            {capturedImage && (
              <div className="w-48 h-48 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-(--med-teal-500)/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedImage} alt="Captured pill" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-center justify-center gap-3 mb-4">
              {[0, 150, 300].map((delay) => (
                <div key={delay} className="w-3 h-3 rounded-full bg-med-teal-500 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
            <h2 className="text-lg font-bold font-(family-name:--font-outfit) mb-2">Analyzing with Gemma 4 AI...</h2>
            <p className="text-sm text-foreground-muted">Reading label, identifying medication, checking interactions</p>
          </div>
        )}

        {/* Result */}
        {scanState === "result" && result && (
          <div className="space-y-6 animate-slide-up">
            <div className="glass-card-strong p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SparklesIcon className="w-5 h-5 text-med-teal-500" />
                    <span className="text-xs font-semibold text-med-teal-500 uppercase tracking-wider">AI Identified</span>
                  </div>
                  <h2 className="text-2xl font-bold font-(family-name:--font-outfit)">
                    {result.name ?? "Unknown Medication"}
                  </h2>
                  {result.genericName && <p className="text-foreground-muted text-sm">{result.genericName}</p>}
                </div>
                {result.confidence != null && (
                  <div className="badge badge-success">{Math.round(result.confidence * 100)}% match</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4">
                  <div className="text-xs text-foreground-muted mb-1">Dosage</div>
                  <div className="text-lg font-bold">{result.dosage ?? "—"}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-xs text-foreground-muted mb-1">Form</div>
                  <div className="text-lg font-bold capitalize">{result.form ?? "—"}</div>
                </div>
              </div>

              {result.instructions && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Instructions</h3>
                  <p className="text-sm text-foreground-muted leading-relaxed">{result.instructions}</p>
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="glass-card p-4 border-l-4 border-l-med-amber-500">
                  <h3 className="text-sm font-semibold mb-2">⚠️ Warnings</h3>
                  <ul className="space-y-1">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-foreground-muted flex items-start gap-2">
                        <span className="text-med-amber-500 mt-0.5">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleAddMedication} className="btn-primary flex-1 py-3">
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

        {/* Saved confirmation */}
        {scanState === "saved" && (
          <div className="glass-card-strong p-12 text-center animate-slide-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-(--med-emerald-500)/10 flex items-center justify-center">
              <CheckIcon className="w-10 h-10 text-med-emerald-500" />
            </div>
            <h2 className="text-xl font-bold font-(family-name:--font-outfit) mb-2">Medication Saved!</h2>
            <p className="text-foreground-muted mb-2">
              <strong>{result?.name}</strong> has been added to your medication list.
            </p>
            {scheduledCount > 0 ? (
              <p className="text-sm text-med-teal-500 font-medium mb-8">
                ✓ {scheduledCount} dose{scheduledCount !== 1 ? "s" : ""} added to today&apos;s schedule
              </p>
            ) : (
              <p className="text-sm text-foreground-muted mb-8">
                No doses scheduled today (as needed or no schedule needed).
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={reset} className="btn-primary px-8 py-3">
                <span className="flex items-center gap-2">
                  <CameraIcon className="w-5 h-5" />
                  Scan Another
                </span>
              </button>
              {scheduledCount > 0 && (
                <a href="/schedule" className="btn-secondary px-8 py-3 flex items-center justify-center gap-2">
                  View Schedule
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
