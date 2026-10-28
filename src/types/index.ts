export type AssessmentResult = 'PASS' | 'FAIL' | 'PENDING';
export type AssessmentStatus = 'scheduled' | 'in_progress' | 'completed';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplianceStatus = 'pass' | 'partial' | 'fail' | 'na';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Chief Inspector' | 'Field Officer' | 'Auditor' | 'Factory Admin';
  badgeNumber: string;
  avatar: string;
}

export interface Officer {
  id: string;
  name: string;
  role: string;
  badgeNumber: string;
  department?: string;
  signatureDataUrl?: string;
  signedAt?: string;
}

export interface OwnerSignature {
  name: string;
  title: string;
  phone?: string;
  signatureDataUrl: string;
  signedAt: string;
}

export interface ChecklistItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  status: ComplianceStatus | null;
  notes?: string;
  photoUrl?: string;
  isCritical?: boolean; // If critical fails, whole audit fails
}

export interface ChecklistPart {
  partNumber: number;
  partTitle: string;
  description: string;
  items: ChecklistItem[];
}

export interface FactoryAssessmentHistory {
  id: string;
  assessmentId: string;
  date: string;
  type: string;
  scorePercent: number;
  result: 'PASS' | 'FAIL';
  leadOfficer: string;
  summary: string;
  certificateNumber?: string;
}

export interface Factory {
  id: string;
  name: string;
  registrationNumber: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  sector: 'Automotive & Metal' | 'Textile & Garment' | 'Food & Beverage' | 'Chemical & Plastics' | 'Electronics & Hardware' | 'Wood & Paper';
  employeeCount: number;
  establishedYear: number;
  riskLevel: RiskLevel;
  lastAssessmentDate?: string;
  lastAssessmentResult?: AssessmentResult;
  assessmentHistory: FactoryAssessmentHistory[];
  photoUrl: string;
  operatingLicenseNo: string;
  status: 'Active' | 'Under Review' | 'Flagged' | 'Suspended';
}

export interface AssessmentRecord {
  id: string;
  factoryId: string;
  factoryName: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: AssessmentStatus;
  inspectionType: 'Routine Annual' | 'Initial Certification' | 'Surprise Audit' | 'Follow-up Inspection';
  priority: 'Normal' | 'High' | 'Urgent';
  leadOfficerId: string;
  officers: Officer[]; // Max 6 officers
  ownerSignature?: OwnerSignature;
  checklistA: ChecklistPart[]; // 5 parts
  checklistB: ChecklistPart[]; // 3 parts
  scorePercent: number;
  totalPoints: number;
  maxPoints: number;
  result: AssessmentResult;
  findingsCount: {
    pass: number;
    partial: number;
    fail: number;
    na: number;
  };
  specialInstructions?: string;
  officerNotes?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  certificateNumber?: string;
}

export interface CalendarEvent {
  id: string;
  assessmentId: string;
  factoryId: string;
  factoryName: string;
  date: string; // YYYY-MM-DD
  time: string;
  leadOfficer: string;
  officersCount: number;
  status: AssessmentStatus;
  result?: AssessmentResult;
  priority: 'Normal' | 'High' | 'Urgent';
  location: string;
}
