export interface MonitoredDose {
  doseId: string;
  medName: string;
  scheduledTime: string; // ISO
  taken: boolean;
  critical: boolean;
  alertSent: boolean;
}

export interface Patient {
  patientId: string;               // secret subject of the signed token
  pairingCode: string | null;      // short code handed to the caregiver, single-use
  pairingExpires: number | null;   // epoch ms
  caregiverTokens: string[];       // Expo push tokens
  doses: Record<string, MonitoredDose>;
}
