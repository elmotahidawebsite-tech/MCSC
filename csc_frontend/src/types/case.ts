export interface Case {
  id: number;
  title: string;
  description?: string;
  status?: "open" | "under_review" | "closed";
  location?: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
  created_by?: number;
  created_by_username?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}