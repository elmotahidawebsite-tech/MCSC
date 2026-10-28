
import { api } from "./client";
import type { CaseData, SyncStatus, PersonData, EvidenceData, CorpsesSpecifications } from "../context/CaseContext";

type SyncMetadataUpdater = (
  updates: {
    status?: SyncStatus;
    serverCaseId?: number | null;
    lastSyncedAt?: string | null;
    errorMessage?: string | null;
  }
) => Promise<void>;

interface SyncResult {
  local_id: string;
  status: string;
  case_id?: number;
  case_code?: string;
  detail?: string;
  updated_at?: string;
  warnings?: string[];  // Media upload failures (partial success)
}

// Helper to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Return full data URL (includes mime type)
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper to check if person is empty
function isEmptyPerson(p: PersonData): boolean {
  return !p.fullName && !p.nationalId && p.images.length === 0;
}

// Helper to check if evidence is empty
function isEmptyEvidence(e: EvidenceData): boolean {
  return !e.description && !e.evidenceId && e.images.length === 0;
}

// Helper to check if corpse specs are empty
function isEmptyCorpseSpecs(s: CorpsesSpecifications): boolean {
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

async function buildFullCasePayload(caseData: CaseData) {
  const info = caseData.caseInfo;

  // Build base case payload (text fields only)
  let basePayload: any;

  if (caseData.caseType === "criminal") {
    basePayload = {
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
    };
  } else if (caseData.caseType === "corpses") {
    const corpse = caseData.corpsesCaseInfo;
    basePayload = {
      case_type: "body",
      case_number: corpse.caseNumber,
      case_year: corpse.caseYear ? Number(corpse.caseYear) : null,
      governorate: corpse.governorate,
      police_department: corpse.policeDepartment,
      date_of_discovery: corpse.dateOfDiscovery || null,
      inspection_date: corpse.inspectionDate || null,
      location_of_body_presence: corpse.locationOfBodyPresence,
      finding_location: corpse.findingLocation,
      photography_expert: corpse.photographyExpert,
      fingerprint_expert: corpse.fingerprintExpert,
      description: corpse.note,
    };
  } else {
    // Civil
    const civil = caseData.civilCaseInfo;
    basePayload = {
      case_type: "civil",
      case_number: civil.caseNumber,
      case_year: civil.caseYear ? Number(civil.caseYear) : null,
      date_of_receipt: civil.dateOfReceipt || null,
      receipt_authority: civil.receiptAuthority,
      date_of_transfer: civil.dateOfTransfer || null,
      transferred_authority: civil.transferredAuthority,
      governorate: civil.governorate,
      fingerprint_type: civil.fingerprintType,
      fingerprint_holder: civil.fingerprintHolder,
      comparison_document: civil.comparisonDocument,
      type_of_comparison_document: civil.typeOfComparisonDocument,
      expert: civil.expert,
      photographer: civil.photographer,
      notes: civil.notes,
    };
  }

  // Add persons with images
  const persons = [];
  for (const role of ['victims', 'suspects', 'reporters'] as const) {
    for (const p of caseData[role]) {
      if (isEmptyPerson(p)) continue;

      const images = [];
      for (const img of p.images) {
        try {
          const dataUrl = await fileToBase64(img);
          images.push({
            file_name: img.name,
            mime_type: img.type || 'image/jpeg',
            data: dataUrl,
          });
        } catch (error) {
          console.error('[Sync] Failed to encode person image:', error);
        }
      }

      persons.push({
        role: role === 'victims' ? 'victim' : role === 'suspects' ? 'suspect' : 'reporter',
        full_name: p.fullName,
        national_id: p.nationalId,
        gender: p.gender.toLowerCase(),
        nationality: p.nationality,
        person_notes: p.note || "",
        images,
      });
    }
  }

  // Add evidence with media
  const evidences = [];
  for (const e of caseData.evidence) {
    if (isEmptyEvidence(e)) continue;

    const media = [];
    for (const file of e.images) {
      try {
        const dataUrl = await fileToBase64(file);
        media.push({
          file_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          data: dataUrl,
        });
      } catch (error) {
        console.error('[Sync] Failed to encode evidence media:', error);
      }
    }

    evidences.push({
      evidence_number: e.evidenceId,
      evidence_type: e.evidenceType ? e.evidenceType.toLowerCase() : "",
      description: e.description,
      media,
    });
  }

  // Add bodies with images (for corpses cases)
  const bodies = [];
  if (caseData.caseType === 'corpses') {
    for (const spec of caseData.corpsesSpecifications) {
      if (isEmptyCorpseSpecs(spec)) continue;

      const images = [];
      for (const img of spec.images) {
        try {
          const dataUrl = await fileToBase64(img);
          images.push({
            file_name: img.name,
            mime_type: img.type || 'image/jpeg',
            data: dataUrl,
          });
        } catch (error) {
          console.error('[Sync] Failed to encode body image:', error);
        }
      }

      bodies.push({
        gender: spec.gender || null,
        approximate_age: spec.approximateAge || null,
        approximate_height: spec.approximateHeight || null,
        weight: spec.weight || null,
        discovery_circumstances: spec.discoveryCircumstances || null,
        distinguishing_marks: spec.distinguishingMarks || null,
        underwear: spec.underwear || null,
        outerwear: spec.outerwear || null,
        facial_features: spec.facialFeatures || null,
        facial_features_reason: spec.facialFeaturesReason || null,
        hand_fingerprints: spec.handFingerprints || null,
        hand_fingerprints_reason: spec.handFingerprintsReason || null,
        biological_sample: spec.biologicalSample.length ? spec.biologicalSample : [],
        specifications_notes: spec.notes || null,
        images,
      });
    }
  }

  // Add case images (for civil cases)
  const case_images = [];
  if (caseData.caseType === 'civil') {
    const civilImages = caseData.civilCaseInfo.images || [];
    for (const img of civilImages) {
      try {
        const dataUrl = await fileToBase64(img);
        case_images.push({
          file_name: img.name,
          mime_type: img.type || 'image/jpeg',
          data: dataUrl,
        });
      } catch (error) {
        console.error('[Sync] Failed to encode case image:', error);
      }
    }
  }

  return {
    ...basePayload,
    persons,
    evidences,
    bodies,
    case_images,
  };
}

function buildCasePayload(caseData: CaseData) {
  const info = caseData.caseInfo;

  if (caseData.caseType === "criminal") {
    return {
      case_type: "criminal",
      case_number: info.caseId,
      case_year: info.caseYear ? Number(info.caseYear) : null,
      governorate: info.governorate,
      police_department: info.policeDepartment,
      incident_type: info.incidentType
        ? info.incidentType.toLowerCase()
        : "",
      inspection_date: info.inspectionDate || null,
      investigator: info.investigator,
      description: info.description,
      location_name: info.locationName,
      address: info.address,
      location_governorate: info.locationGovernorate,
      city: info.city,
      district: info.district,
    };
  }

  if (caseData.caseType === "corpses") {
    const corpse = caseData.corpsesCaseInfo;

    return {
      case_type: "body",
      case_number: corpse.caseNumber,
      case_year: corpse.caseYear
        ? Number(corpse.caseYear)
        : null,
      governorate: corpse.governorate,
      police_department: corpse.policeDepartment,
      date_of_discovery: corpse.dateOfDiscovery || null,
      inspection_date: corpse.inspectionDate || null,
      location_of_body_presence: corpse.locationOfBodyPresence,
      finding_location: corpse.findingLocation,
      photography_expert: corpse.photographyExpert,
      fingerprint_expert: corpse.fingerprintExpert,
      description: corpse.note,
    };
  }

  const civil = caseData.civilCaseInfo;

  return {
    case_type: "civil",
    case_number: civil.caseNumber,
    case_year: civil.caseYear ? Number(civil.caseYear) : null,
    date_of_receipt: civil.dateOfReceipt || null,
    receipt_authority: civil.receiptAuthority,
    date_of_transfer: civil.dateOfTransfer || null,
    transferred_authority: civil.transferredAuthority,
    governorate: civil.governorate,
    fingerprint_type: civil.fingerprintType,
    fingerprint_holder: civil.fingerprintHolder,
    comparison_document: civil.comparisonDocument,
    type_of_comparison_document: civil.typeOfComparisonDocument,
    expert: civil.expert,
    photographer: civil.photographer,
    notes: civil.notes,
  };
}

export async function syncCurrentDraft(
  caseData: CaseData,
  localId: string,
  updateSyncMetadata: SyncMetadataUpdater
): Promise<SyncResult> {
  console.log('[Sync] Starting sync for localId:', localId);
  console.log('[Sync] Current sync metadata before update');
  
  await updateSyncMetadata({
    status: "pending",
    errorMessage: null,
  });

  try {
    console.log('[Sync] Building full case payload with media...');
    const fullPayload = await buildFullCasePayload(caseData);
    
    console.log('[Sync] Payload stats:', {
      case_type: fullPayload.case_type,
      persons: fullPayload.persons?.length || 0,
      evidences: fullPayload.evidences?.length || 0,
      bodies: fullPayload.bodies?.length || 0,
      case_images: fullPayload.case_images?.length || 0,
    });

    console.log('[Sync] Sending POST request to /api/sync/');
    const response = await api.post("/sync/", {
      cases: [
        {
          local_id: localId,
          data: fullPayload,
        },
      ],
    });

    console.log('[Sync] Response received:', {
      status: response.status,
      statusText: response.statusText,
      hasResults: !!response.data?.results,
      resultsCount: response.data?.results?.length || 0,
    });

    const result: SyncResult | undefined =
      response.data?.results?.find(
        (item: SyncResult) => item.local_id === localId
      );

    if (!result) {
      throw new Error(
        "The server response did not contain a result for this draft."
      );
    }

    if (
      result.status === "synced" ||
      result.status === "already_synced"
    ) {
      if (!result.case_id) {
        throw new Error(
          "The server did not return the synced case ID."
        );
      }

      // Check for media upload warnings
      if (result.warnings && result.warnings.length > 0) {
        console.warn('[Sync] Case synced with warnings:', result.warnings);
      }

      await updateSyncMetadata({
        status: "synced",
        serverCaseId: result.case_id,
        lastSyncedAt: new Date().toISOString(),
        errorMessage: result.warnings && result.warnings.length > 0 
          ? `Synced with warnings: ${result.warnings.length} media file(s) failed`
          : null,
      });

      console.log('[Sync] Success:', result);
      return result;
    }

    if (result.status === "conflict") {
      await updateSyncMetadata({
        status: "conflict",
        errorMessage: result.detail || "A sync conflict occurred.",
      });

      console.warn('[Sync] Conflict:', result);
      return result;
    }

    await updateSyncMetadata({
      status: "error",
      errorMessage: result.detail || `Sync failed: ${result.status}`,
    });

    console.error('[Sync] Error:', result);
    return result;
  } catch (error: any) {
    console.error('[Sync] Exception caught:', error);
    
    // Extract detailed error information
    let message = "An unknown sync error occurred.";
    let httpStatus = null;
    let serverResponse = null;
    
    if (error?.response) {
      // Axios error with response
      httpStatus = error.response.status;
      serverResponse = error.response.data;
      message = `HTTP ${httpStatus}: ${JSON.stringify(serverResponse)}`;
      
      console.error('[Sync] HTTP Error:', {
        status: httpStatus,
        statusText: error.response.statusText,
        data: serverResponse,
        headers: error.response.headers,
      });
    } else if (error?.request) {
      // Request was made but no response
      message = "No response from server. Check network connection.";
      console.error('[Sync] No response received:', error.request);
    } else if (error instanceof Error) {
      // Other errors
      message = error.message;
      console.error('[Sync] Error message:', error.message);
      console.error('[Sync] Error stack:', error.stack);
    }

    await updateSyncMetadata({
      status: "error",
      errorMessage: message,
    });

    console.error('[Sync] Final error state:', {
      message,
      httpStatus,
      serverResponse,
      errorType: error?.constructor?.name,
    });
    
    throw error;
  }
}
