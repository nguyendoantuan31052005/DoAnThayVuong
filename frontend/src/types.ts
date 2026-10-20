export interface User {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: "USER" | "ADMIN";
  blocked: boolean;
  createdAt: string;
}
export interface AuthResult {
  user: User;
  accessToken: string;
  expiresIn: number;
}
export type Risk = "SAFE" | "SUSPICIOUS" | "DANGEROUS";
export interface Scan {
  id: string;
  userId: string | null;
  saved?: boolean;
  processingMs: number;
  url: string;
  riskScore: number;
  riskLevel: Risk;
  reasons: string[];
  modelVersion: string;
  createdAt: string;
}
export type ReportStatus = "PENDING" | "REVIEWING" | "CONFIRMED" | "REJECTED";
export interface Report {
  id: string;
  userId: string;
  url: string;
  description: string;
  reason: string;
  evidenceUrl: string;
  scanId: string | null;
  scanRiskScore: number | null;
  scanModelVersion: string | null;
  evidence?: { fileName: string; mimeType: string; size: number } | null;
  user?: { id: string; name: string; email: string };
  status: ReportStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
export interface Stats {
  users: number;
  scans: number;
  dangerousScans: number;
  pendingReports: number;
  reviewedReports: number;
}
export interface AiStatus {
  configured: boolean;
  versions: {
    modelVersion: string;
    scans: number;
    lastSeenAt: string | null;
  }[];
}

export interface Analytics {
  days: { date: string; count: number }[];
  distribution: { riskLevel: Risk; count: number }[];
  timezone: string;
}
