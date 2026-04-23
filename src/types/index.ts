// ============================================================
// MediMate — Core Types
// ============================================================

// --- AI Backend ---

export type AIBackend = "ollama" | "google-ai";

export interface AIClientConfig {
  backend: AIBackend;
  ollamaBaseUrl: string;
  googleApiKey?: string;
  model: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[]; // base64 encoded
}

export interface AIResponse {
  message: string;
  backend: AIBackend;
  model: string;
  streaming?: boolean;
}

export interface AIStatus {
  isConnected: boolean;
  backend: AIBackend | null;
  model: string | null;
  error?: string;
}

// --- Medications ---

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  form: "tablet" | "capsule" | "liquid" | "injection" | "topical" | "inhaler" | "other";
  frequency: MedicationFrequency;
  timeSlots: TimeSlot[];
  instructions?: string;
  warnings?: string[];
  sideEffects?: string[];
  prescribedBy?: string;
  startDate: string; // ISO date
  endDate?: string;  // ISO date
  color?: string;    // for UI identification
  imageData?: string; // base64 of scanned pill
  addedAt: string;   // ISO date
  updatedAt: string; // ISO date
}

export type MedicationFrequency =
  | "once_daily"
  | "twice_daily"
  | "three_times_daily"
  | "four_times_daily"
  | "every_other_day"
  | "weekly"
  | "as_needed"
  | "custom";

export interface TimeSlot {
  time: string;     // HH:mm format
  label: "morning" | "afternoon" | "evening" | "bedtime" | "custom";
  withFood?: boolean;
}

// --- Drug Interactions ---

export type InteractionSeverity = "minor" | "moderate" | "major" | "contraindicated";

export interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
  source?: string;
}

export interface InteractionCheckResult {
  interactions: DrugInteraction[];
  hasDangerous: boolean;
  checkedAt: string;
}

// --- Schedule ---

export interface ScheduleEntry {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;  // HH:mm
  timeLabel: TimeSlot["label"];
  taken: boolean;
  takenAt?: string;       // ISO datetime
  skipped: boolean;
  skippedReason?: string;
  date: string;           // ISO date (YYYY-MM-DD)
}

export interface DailySchedule {
  date: string;
  entries: ScheduleEntry[];
  completionRate: number; // 0–1
}

// --- Symptom Journal ---

export interface JournalEntry {
  id: string;
  date: string;        // ISO datetime
  inputMethod: "voice" | "text";
  rawInput: string;    // original voice transcript or typed text
  summary: string;     // AI-generated summary
  symptoms: Symptom[];
  mood: MoodLevel;
  notes?: string;
  relatedMedications?: string[]; // medication IDs
}

export interface Symptom {
  name: string;
  severity: 1 | 2 | 3 | 4 | 5;
  duration?: string;
  isNew: boolean;
}

export type MoodLevel = "great" | "good" | "okay" | "poor" | "bad";

// --- User Profile ---

export interface UserProfile {
  id: string;
  name?: string;
  age?: number;
  conditions?: string[];
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

// --- Pill Scanner ---

export interface ScanResult {
  success: boolean;
  medication?: Partial<Medication>;
  rawText?: string;
  confidence?: number;
  error?: string;
}

// --- Doctor Report ---

export interface DoctorReport {
  generatedAt: string;
  patient: UserProfile;
  medications: Medication[];
  interactions: DrugInteraction[];
  journalEntries: JournalEntry[];
  scheduleCompliance: {
    period: string;
    rate: number;
  };
}
