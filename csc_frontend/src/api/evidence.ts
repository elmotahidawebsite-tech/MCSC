import { api } from "./client";
import type { Evidence, Paginated } from "../types";

export async function listEvidence(caseId: number) {
  const { data } = await api.get<Paginated<Evidence>>(`/cases/${caseId}/evidence/`);
  return data.results;
}

export async function createEvidence(
  caseId: number,
  payload: { evidence_type: string; description: string; collected_at: string }
) {
  const { data } = await api.post<Evidence>(`/cases/${caseId}/evidence/`, payload);
  return data;
}

export async function uploadEvidenceMedia(evidenceId: number, file: File, fileType: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("file_type", fileType);
  const { data } = await api.post(`/evidence/${evidenceId}/media/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
