import { api } from "./client";

// ===== أنواع محلية مطابقة للـ CaseContext =====
export type PersonPayload = {
  fullName: string;
  nationalId: string;
  gender: string;
  nationality: string;
  note: string;
  images: File[];
};

export type EvidencePayload = {
  evidenceId: string;
  evidenceType: string;
  description: string;
  images: File[];
};

export type SubmitCasePayload = {
  caseInfo: {
    caseId: string;
    caseYear: string;
    governorate: string;
    policeDepartment: string;
    incidentType: string;
    inspectionDate: string;
    investigator: string;
    description: string;
    locationName: string;
    address: string;
    locationGovernorate: string;
    city: string;
    district: string;
  };
  victims: PersonPayload[];
  suspects: PersonPayload[];
  reporters: PersonPayload[];
  evidence: EvidencePayload[];
};

export type CorpsesCaseInfoPayload = {
  caseNumber: string;
  caseYear: string;
  governorate: string;
  policeDepartment: string;
  dateOfDiscovery: string;
  inspectionDate: string;
  locationOfBodyPresence: string;
  findingLocation: string;
  photographyExpert: string;
  fingerprintExpert: string;
  note: string;
};

export type CorpsesSpecificationsPayload = {
  gender: string;
  approximateAge: string;
  approximateHeight: string;
  weight: string;
  discoveryCircumstances: string;
  distinguishingMarks: string;
  underwear: string;
  outerwear: string;
  facialFeatures: "clear" | "unclear" | "";
  facialFeaturesReason: string;
  handFingerprints: "yes" | "no" | "";
  handFingerprintsReason: string;
  biologicalSample: string[];
  images: File[];
  notes: string;
};

export type SubmitCorpsesCasePayload = {
  corpsesCaseInfo: CorpsesCaseInfoPayload;
  corpsesSpecifications: CorpsesSpecificationsPayload[];
  victims: PersonPayload[];
  suspects: PersonPayload[];
  reporters: PersonPayload[];
  evidence: EvidencePayload[];
};

export type CivilCaseInfoPayload = {
  caseNumber: string;
  caseYear: string;
  dateOfReceipt: string;
  receiptAuthority: string;
  dateOfTransfer: string;
  transferredAuthority: string;
  governorate: string;
  fingerprintType: string;
  fingerprintHolder: string;
  comparisonDocument: string;
  typeOfComparisonDocument: string;
  expert: string;
  photographer: string;
  notes: string;
  images: File[];  // ✅ ضفناها
};

export type SubmitCivilCasePayload = {
  civilCaseInfo: CivilCaseInfoPayload;
  victims: PersonPayload[];
  suspects: PersonPayload[];
  reporters: PersonPayload[];
  evidence: EvidencePayload[];
};

// ===== ✅ تحديد نوع الوسيط من الـ MIME =====
type MediaKind = "image" | "video" | "audio" | "document";

function mediaKind(f: File): MediaKind {
  if (f.type.startsWith("image/")) return "image";
  if (f.type.startsWith("video/")) return "video";
  if (f.type.startsWith("audio/")) return "audio";
  return "document";
}

// ===== تحويلات الأسماء (فرونت → باك) =====
function personBody(p: PersonPayload, role: string) {
  return {
    role,
    full_name: p.fullName,
    national_id: p.nationalId,
    gender: p.gender.toLowerCase(),
    nationality: p.nationality,
    note: p.note || "",
  };
}

function isEmptyPerson(p: PersonPayload): boolean {
  return !p.fullName && !p.nationalId && p.images.length === 0;
}

function isEmptyEvidence(e: EvidencePayload): boolean {
  return !e.description && !e.evidenceId && e.images.length === 0;
}

function isEmptyCorpseSpecs(s: CorpsesSpecificationsPayload): boolean {
  return (
    !s.gender &&
    !s.approximateAge &&
    !s.approximateHeight &&
    !s.weight &&
    !s.discoveryCircumstances &&
    !s.distinguishingMarks &&
    !s.underwear &&
    !s.outerwear &&
    !s.facialFeatures &&
    !s.handFingerprints &&
    s.biologicalSample.length === 0 &&
    s.images.length === 0 &&
    !s.notes
  );
}

function corpseSpecsBody(s: CorpsesSpecificationsPayload) {
  return {
    gender: s.gender || null,
    approximate_age: s.approximateAge || null,
    approximate_height: s.approximateHeight || null,
    weight: s.weight || null,
    discovery_circumstances: s.discoveryCircumstances || null,
    distinguishing_marks: s.distinguishingMarks || null,
    underwear: s.underwear || null,
    outerwear: s.outerwear || null,
    facial_features: s.facialFeatures || null,
    facial_features_reason: s.facialFeaturesReason || null,
    hand_fingerprints: s.handFingerprints || null,
    hand_fingerprints_reason: s.handFingerprintsReason || null,
    biological_sample: s.biologicalSample.length ? s.biologicalSample.join(",") : null,
    specifications_notes: s.notes || null,
  };
}

// ===== إرسال الأشخاص والأدلة (مشترك) =====
async function attachPersonsAndEvidence(
  caseId: number,
  persons: { list: PersonPayload[]; role: string }[],
  evidence: EvidencePayload[]
) {
  for (const { list, role } of persons) {
    for (const p of list) {
      if (isEmptyPerson(p)) continue;
      const personRes = await api.post(`/cases/${caseId}/persons/`, personBody(p, role));
      for (const img of p.images) {
        const fd = new FormData();
        fd.append("image", img);
        fd.append("media_type", mediaKind(img));  // ✅
        await api.post(`/persons/${personRes.data.id}/images/`, fd);
      }
    }
  }

  for (const e of evidence) {
    if (isEmptyEvidence(e)) continue;
    const evRes = await api.post(`/cases/${caseId}/evidence/`, {
      evidence_number: e.evidenceId,
      evidence_type: e.evidenceType ? e.evidenceType.toLowerCase() : "",
      description: e.description,
    });
    for (const img of e.images) {
      const fd = new FormData();
      fd.append("file", img);
      fd.append("media_type", mediaKind(img));  // ✅ (بدل "image" القديم)
      await api.post(`/evidence/${evRes.data.id}/media/`, fd);
    }
  }
}

// ===== الإرسال الكامل للقضية الجنائية =====
export async function submitCase(data: SubmitCasePayload, submit = true): Promise<number> {
  const info = data.caseInfo;

  const caseRes = await api.post("/cases/", {
    case_type: "criminal",
    case_number: info.caseId,
    case_year: info.caseYear ? Number(info.caseYear) : null,
    governorate: info.governorate,
    police_department: info.policeDepartment,
    incident_type: info.incidentType ? info.incidentType.toLowerCase() : "",
    inspection_date: info.inspectionDate || null,
    investigator: info.investigator,
    description: info.description,
    location_name: info.locationName,
    address: info.address,
    location_governorate: info.locationGovernorate,
    city: info.city,
    district: info.district,
  });
  const caseId: number = caseRes.data.id;

  await attachPersonsAndEvidence(
    caseId,
    [
      { list: data.victims, role: "victim" },
      { list: data.suspects, role: "suspect" },
      { list: data.reporters, role: "reporter" },
    ],
    data.evidence
  );

  if (submit) {
    await api.post(`/cases/${caseId}/submit/`);
  }
  return caseId;
}

// ===== إرسال الجثث الإضافية وصورها =====
async function attachAdditionalCorpses(
  caseId: number,
  allSpecs: CorpsesSpecificationsPayload[]
) {
  if (!allSpecs || allSpecs.length <= 1) return;

  for (let i = 1; i < allSpecs.length; i++) {
    const s = allSpecs[i];
    if (isEmptyCorpseSpecs(s)) continue;

    try {
      const res = await api.post(
        `/cases/${caseId}/bodies/`,
        corpseSpecsBody(s)
      );
      const bodyId = res.data?.id;

      for (const img of s.images) {
        const fd = new FormData();
        fd.append("image", img);
        fd.append("media_type", mediaKind(img));  // ✅
        if (bodyId) {
          try {
            await api.post(`/bodies/${bodyId}/images/`, fd);
            continue;
          } catch {
            // fall-through to case-level images
          }
        }
        await api.post(`/cases/${caseId}/images/`, fd);
      }
    } catch (e) {
      console.warn(
        `[submitCorpsesCase] Failed to POST additional corpse #${i + 1} to /cases/${caseId}/bodies/ — fallback to images only.`,
        e
      );
      for (const img of s.images) {
        const fd = new FormData();
        fd.append("image", img);
        fd.append("media_type", mediaKind(img));  // ✅
        await api.post(`/cases/${caseId}/images/`, fd);
      }
    }
  }
}

// ===== الإرسال الكامل لقضية الجثث =====
export async function submitCorpsesCase(
  data: SubmitCorpsesCasePayload,
  submit = true
): Promise<number> {
  const info = data.corpsesCaseInfo;

  const caseRes = await api.post("/cases/", {
    case_type: "body",
    case_number: info.caseNumber,
    case_year: info.caseYear ? Number(info.caseYear) : null,
  governorate: info.governorate,
  police_department: info.policeDepartment,
    date_of_discovery: info.dateOfDiscovery || null,
    inspection_date: info.inspectionDate || null,
    location_of_body_presence: info.locationOfBodyPresence,
    finding_location: info.findingLocation,
    photography_expert: info.photographyExpert,
    fingerprint_expert: info.fingerprintExpert,
    description: info.note,
  });
  const caseId: number = caseRes.data.id;

  await attachPersonsAndEvidence(
    caseId,
    [
      { list: data.victims, role: "victim" },
      { list: data.suspects, role: "suspect" },
      { list: data.reporters, role: "reporter" },
    ],
    data.evidence
  );

  // ✅ كل الجثث — من الأولى لآخر واحدة — تتسجل كـ Body records
  for (const specs of data.corpsesSpecifications) {
    const bodyRes = await api.post(`/cases/${caseId}/bodies/`, corpseSpecsBody(specs));
    const bodyId: number = bodyRes.data.id;
    for (const img of specs.images) {
      const fd = new FormData();
      fd.append("image", img);
      fd.append("media_type", mediaKind(img));  // ✅
      await api.post(`/bodies/${bodyId}/images/`, fd);
    }
  }

  if (submit) {
    await api.post(`/cases/${caseId}/submit/`);
  }
  return caseId;
}

export async function submitCivilCase(
    data: SubmitCivilCasePayload,
    submit = true
  ): Promise<number> {
    const info = data.civilCaseInfo;

    const caseRes = await api.post("/cases/", {
      case_type: "civil",
      case_number: info.caseNumber,
      case_year: info.caseYear ? Number(info.caseYear) : null,
      date_of_receipt: info.dateOfReceipt || null,
      receipt_authority: info.receiptAuthority,
      date_of_transfer: info.dateOfTransfer || null,
      transferred_authority: info.transferredAuthority,
      governorate: info.governorate,
      fingerprint_type: info.fingerprintType,
      fingerprint_holder: info.fingerprintHolder,
      comparison_document: info.comparisonDocument,
      type_of_comparison_document: info.typeOfComparisonDocument,
      expert: info.expert,
      photographer: info.photographer,
      notes: info.notes,
    });
    const caseId: number = caseRes.data.id;

    await attachPersonsAndEvidence(
      caseId,
      [
        { list: data.victims, role: "victim" },
        { list: data.suspects, role: "suspect" },
        { list: data.reporters, role: "reporter" },
      ],
      data.evidence
    );

    // ✅ صور القضية المدنية
    for (const img of (info as any).images ?? []) {
      const fd = new FormData();
      fd.append("image", img);
      fd.append("media_type", mediaKind(img));  // ✅
      await api.post(`/cases/${caseId}/images/`, fd);
    }

    if (submit) {
      await api.post(`/cases/${caseId}/submit/`);
    }
    return caseId;
}