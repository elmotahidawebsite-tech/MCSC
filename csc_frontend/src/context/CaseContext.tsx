
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type SetStateAction,
  useCallback,
} from "react";
import { useAutoSync } from "../hooks/useAutoSync";

export interface PersonData {
  fullName: string;
  nationalId: string;
  gender: string;
  nationality: string;
  note: string;
  images: File[];
  imageUrls?: string[];
}

export interface EvidenceData {
  evidenceId: string;
  evidenceType: string;
  description: string;
  images: File[];
  imageUrls?: string[];
}

export type CaseType = "criminal" | "corpses" | "civil";

export interface CorpsesCaseInfo {
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
}

export interface CivilCaseInfo {
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
  images: File[];
  caseFiles?: File[];
  caseFileUrls?: string[];
}

export interface CorpsesSpecifications {
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
  imageUrls?: string[];
  notes: string;
}

export interface CaseData {
  caseType: CaseType;

  caseInfo: {
    caseId: string;
    caseYear: string;
    incidentType: string;
    inspectionDate: string;
    description: string;
    policeDepartment: string;
    governorate: string;
    investigator: string;
    locationName: string;
    address: string;
    locationGovernorate: string;
    city: string;
    district: string;
    stationUsername: string;
  };

  corpsesCaseInfo: CorpsesCaseInfo;
  civilCaseInfo: CivilCaseInfo;
  corpsesSpecifications: CorpsesSpecifications[];
  victims: PersonData[];
  suspects: PersonData[];
  reporters: PersonData[];
  evidence: EvidenceData[];
}


export type DraftSaveStatus = "saving" | "saved" | "error";

export type SyncStatus = "pending" | "synced" | "error" | "conflict";

interface DraftSyncMetadata {
  localId: string;
  status: SyncStatus;
  serverCaseId: number | null;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

const SYNC_METADATA_KEY = "current-case-sync";

function createLocalId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createSyncMetadata(): DraftSyncMetadata {
  return {
    localId: createLocalId(),
    status: "pending",
    serverCaseId: null,
    lastSyncedAt: null,
    errorMessage: null,
  };
}



interface CaseContextType {
  caseData: CaseData;
  isRestoringDraft: boolean;
  saveStatus: DraftSaveStatus;
  localId: string;
  syncStatus: SyncStatus;
  serverCaseId: number | null;
  lastSyncedAt: string | null;
  syncError: string | null;

  updateSyncMetadata: (
    updates: Partial<Omit<DraftSyncMetadata, "localId">>
  ) => Promise<void>;
  setCaseType: (type: CaseType) => void;
  updateCaseInfo: (data: Partial<CaseData["caseInfo"]>) => void;
  updateCorpsesCaseInfo: (data: Partial<CorpsesCaseInfo>) => void;
  updateCivilCaseInfo: (data: Partial<CivilCaseInfo>) => void;
  setCorpsesSpecifications: (
    specs: SetStateAction<CorpsesSpecifications[]>
  ) => void;

  setVictims: (victims: SetStateAction<PersonData[]>) => void;
  setSuspects: (suspects: SetStateAction<PersonData[]>) => void;
  setReporters: (reporters: SetStateAction<PersonData[]>) => void;
  setEvidence: (evidence: SetStateAction<EvidenceData[]>) => void;


  resetCase: () => void;
}

const DB_NAME = "csc-offline-db";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const DRAFT_KEY = "current-case";

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported by this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open draft database."));
  });
}

async function readDraft(): Promise<CaseData | null> {
  const db = await openDraftDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(DRAFT_KEY);

      request.onsuccess = () => {
        const result = (request.result as CaseData | undefined) ?? null;
        
        if (result) {
          console.log('[IndexedDB] Draft read from storage. Stats:', {
            caseType: result.caseType,
            victimsCount: result.victims?.length || 0,
            suspectsCount: result.suspects?.length || 0,
            reportersCount: result.reporters?.length || 0,
            evidenceCount: result.evidence?.length || 0,
            bodiesCount: result.corpsesSpecifications?.length || 0,
            hasCaseNumber: !!(result.caseInfo?.caseId || result.corpsesCaseInfo?.caseNumber || result.civilCaseInfo?.caseNumber),
          });
        } else {
          console.log('[IndexedDB] No draft found in storage (key: current-case)');
        }
        
        resolve(result);
      };

      request.onerror = () =>
        reject(request.error ?? new Error("Could not read saved draft."));
    });
  } finally {
    db.close();
  }
}

async function writeDraft(data: CaseData): Promise<void> {
  const db = await openDraftDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).put(data, DRAFT_KEY);

      transaction.oncomplete = () => {
        console.log('[IndexedDB] Draft saved successfully. Stats:', {
          caseType: data.caseType,
          victimsCount: data.victims?.length || 0,
          suspectsCount: data.suspects?.length || 0,
          reportersCount: data.reporters?.length || 0,
          evidenceCount: data.evidence?.length || 0,
          bodiesCount: data.corpsesSpecifications?.length || 0,
          hasCaseNumber: !!(data.caseInfo?.caseId || data.corpsesCaseInfo?.caseNumber || data.civilCaseInfo?.caseNumber),
        });
        resolve();
      };
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not save draft."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Draft save was aborted."));
    });
  } finally {
    db.close();
  }
}

async function readSyncMetadata(): Promise<DraftSyncMetadata | null> {
  const db = await openDraftDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(
        SYNC_METADATA_KEY
      );

      request.onsuccess = () => {
        resolve(
          (request.result as DraftSyncMetadata | undefined) ?? null
        );
      };

      request.onerror = () => {
        reject(
          request.error ?? new Error("Could not read sync metadata.")
        );
      };
    });
  } finally {
    db.close();
  }
}

async function writeSyncMetadata(
  metadata: DraftSyncMetadata
): Promise<void> {
  const db = await openDraftDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).put(
        metadata,
        SYNC_METADATA_KEY
      );

      transaction.oncomplete = () => resolve();

      transaction.onerror = () => {
        reject(
          transaction.error ?? new Error("Could not save sync metadata.")
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ?? new Error("Sync metadata save was aborted.")
        );
      };
    });
  } finally {
    db.close();
  }
}

// Diagnostic function - exposed to window for manual inspection
async function diagnoseDataSync(): Promise<void> {
  console.log('=== CSC DATA SYNC DIAGNOSTIC ===');
  
  try {
    const db = await openDraftDatabase();
    
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      // Read draft
      const draftRequest = store.get(DRAFT_KEY);
      const metadataRequest = store.get(SYNC_METADATA_KEY);
      
      await new Promise<void>((resolve, reject) => {
        let draftResult: CaseData | null = null;
        let metadataResult: DraftSyncMetadata | null = null;
        let completed = 0;
        
        draftRequest.onsuccess = () => {
          draftResult = (draftRequest.result as CaseData | undefined) ?? null;
          completed++;
          if (completed === 2) processResults();
        };
        
        metadataRequest.onsuccess = () => {
          metadataResult = (metadataRequest.result as DraftSyncMetadata | undefined) ?? null;
          completed++;
          if (completed === 2) processResults();
        };
        
        draftRequest.onerror = metadataRequest.onerror = () => reject(new Error('Read failed'));
        
        function processResults() {
          console.log('IndexedDB State:');
          console.log('  Draft (current-case):', draftResult ? {
            caseType: draftResult.caseType,
            victimsCount: draftResult.victims?.length || 0,
            suspectsCount: draftResult.suspects?.length || 0,
            reportersCount: draftResult.reporters?.length || 0,
            evidenceCount: draftResult.evidence?.length || 0,
            bodiesCount: draftResult.corpsesSpecifications?.length || 0,
            hasCaseNumber: !!(draftResult.caseInfo?.caseId || draftResult.corpsesCaseInfo?.caseNumber || draftResult.civilCaseInfo?.caseNumber),
          } : 'NULL or EMPTY');
          
          console.log('  Metadata (current-case-sync):', metadataResult ? {
            localId: metadataResult.localId,
            status: metadataResult.status,
            serverCaseId: metadataResult.serverCaseId,
            errorMessage: metadataResult.errorMessage,
          } : 'NULL or EMPTY');
          
          resolve();
        }
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Diagnostic failed:', error);
  }
  
  console.log('=== END DIAGNOSTIC ===');
}

// Expose to window for manual debugging
if (typeof window !== 'undefined') {
  (window as any).diagnoseCSCData = diagnoseDataSync;
}

function createEmptyCase(): CaseData {
  return {
    caseType: "criminal",

    caseInfo: {
      caseId: "",
      caseYear: "",
      incidentType: "",
      inspectionDate: "",
      description: "",
      policeDepartment: "",
      governorate: "",
      investigator: "",
      locationName: "",
      address: "",
      locationGovernorate: "",
      city: "",
      district: "",
      stationUsername: "",
    },

    corpsesCaseInfo: {
      caseNumber: "",
      caseYear: "",
      governorate: "",
      policeDepartment: "",
      dateOfDiscovery: "",
      inspectionDate: "",
      locationOfBodyPresence: "",
      findingLocation: "",
      photographyExpert: "",
      fingerprintExpert: "",
      note: "",
    },

    civilCaseInfo: {
      caseNumber: "",
      caseYear: "",
      dateOfReceipt: "",
      receiptAuthority: "",
      dateOfTransfer: "",
      transferredAuthority: "",
      governorate: "",
      fingerprintType: "",
      fingerprintHolder: "",
      comparisonDocument: "",
      typeOfComparisonDocument: "",
      expert: "",
      photographer: "",
      notes: "",
      images: [],
    },

    corpsesSpecifications: [
      {
        gender: "",
        approximateAge: "",
        approximateHeight: "",
        weight: "",
        discoveryCircumstances: "",
        distinguishingMarks: "",
        underwear: "",
        outerwear: "",
        facialFeatures: "",
        facialFeaturesReason: "",
        handFingerprints: "",
        handFingerprintsReason: "",
        biologicalSample: [],
        images: [],
        notes: "",
      },
    ],

    victims: [
      {
        fullName: "",
        nationalId: "",
        gender: "",
        nationality: "",
        note: "",
        images: [],
      },
    ],

    suspects: [
      {
        fullName: "",
        nationalId: "",
        gender: "",
        nationality: "",
        note: "",
        images: [],
      },
    ],

    reporters: [
      {
        fullName: "",
        nationalId: "",
        gender: "",
        nationality: "",
        note: "",
        images: [],
      },
    ],

    evidence: [],
  };
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [caseData, setCaseData] = useState<CaseData>(createEmptyCase);
  const [isRestoringDraft, setIsRestoringDraft] = useState(true);
  const [saveStatus, setSaveStatus] =
    useState<DraftSaveStatus>("saved");
  const readyRef = useRef(false);
  const revisionRef = useRef(0);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const [syncMetadata, setSyncMetadata] =
    useState<DraftSyncMetadata>(() => createSyncMetadata());

  const syncReadyRef = useRef(false);
  const [isSyncReady, setIsSyncReady] = useState(false); // New state for react to track


  // Restore the saved draft before enabling automatic saving.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const [savedDraft, savedMetadata] = await Promise.all([
          readDraft(),
          readSyncMetadata(),
        ]);

        if (cancelled) return;

        if (savedDraft) {
          setCaseData(savedDraft);
        }

        const metadata = savedMetadata ?? createSyncMetadata();

        setSyncMetadata(metadata);
        syncReadyRef.current = true;
        setIsSyncReady(true); // Signal React that sync is ready

        if (!savedMetadata) {
          await writeSyncMetadata(metadata);
        }

        console.log('[CaseContext] Restoration complete:', {
          hasSavedDraft: !!savedDraft,
          syncMetadata: {
            localId: metadata.localId,
            status: metadata.status,
            serverCaseId: metadata.serverCaseId,
          },
          inMemoryCaseData: {
            caseType: caseData.caseType,
            victimsCount: caseData.victims?.length || 0,
            suspectsCount: caseData.suspects?.length || 0,
            reportersCount: caseData.reporters?.length || 0,
            evidenceCount: caseData.evidence?.length || 0,
            bodiesCount: caseData.corpsesSpecifications?.length || 0,
            hasCaseNumber: !!(caseData.caseInfo?.caseId || caseData.corpsesCaseInfo?.caseNumber || caseData.civilCaseInfo?.caseNumber),
          }
        });
      } catch (error) {
        console.error("[CSC] Could not restore offline draft:", error);
      } finally {
        if (!cancelled) {
          readyRef.current = true;
          setIsRestoringDraft(false);
        }
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);


  // Save each updated draft in sequence.
  useEffect(() => {
    if (!readyRef.current) {
      console.log('[CaseContext] Autosave skipped: not ready yet');
      return;
    }

    const revision = ++revisionRef.current;
    const snapshot = caseData;

    // Count File objects that need special handling
    const fileCount = [
      ...snapshot.victims.flatMap(v => v.images),
      ...snapshot.suspects.flatMap(s => s.images),
      ...snapshot.reporters.flatMap(r => r.images),
      ...snapshot.evidence.flatMap(e => e.images),
      ...snapshot.corpsesSpecifications.flatMap(c => c.images),
      ...(snapshot.civilCaseInfo?.images || []),
    ].filter(f => f instanceof File).length;

    console.log('[CaseContext] Autosave triggered. Revision:', revision, 'Stats:', {
      caseType: snapshot.caseType,
      victimsCount: snapshot.victims?.length || 0,
      suspectsCount: snapshot.suspects?.length || 0,
      reportersCount: snapshot.reporters?.length || 0,
      evidenceCount: snapshot.evidence?.length || 0,
      bodiesCount: snapshot.corpsesSpecifications?.length || 0,
      hasCaseNumber: !!(snapshot.caseInfo?.caseId || snapshot.corpsesCaseInfo?.caseNumber || snapshot.civilCaseInfo?.caseNumber),
      totalFileObjects: fileCount,
    });

    if (fileCount > 0) {
      console.warn('[CaseContext] WARNING: Draft contains', fileCount, 'File objects. File objects cannot be stored in IndexedDB!');
    }

    setSaveStatus("saving");

    saveChainRef.current = saveChainRef.current
      .catch(() => {
        // Allow later save attempts after a previous failure.
      })
      .then(async () => {
        // Skip outdated snapshots. The latest queued snapshot will save.
        if (revision !== revisionRef.current) return;

        try {
          await writeDraft(snapshot);

          if (revision === revisionRef.current) {
            setSaveStatus("saved");
          }
        } catch (error) {
          console.error("[CSC] Could not save offline draft:", error);

          if (revision === revisionRef.current) {
            setSaveStatus("error");
          }
        }
      });
  }, [caseData]);


  const setCaseType = useCallback((type: CaseType) => {
    setCaseData((prev) => ({
      ...prev,
      caseType: type,
    }));
  }, []);

  function updateCaseInfo(data: Partial<CaseData["caseInfo"]>) {
    setCaseData((prev) => ({
      ...prev,
      caseInfo: { ...prev.caseInfo, ...data },
    }));
  }

  function updateCorpsesCaseInfo(data: Partial<CorpsesCaseInfo>) {
    setCaseData((prev) => ({
      ...prev,
      corpsesCaseInfo: { ...prev.corpsesCaseInfo, ...data },
    }));
  }

  function updateCivilCaseInfo(data: Partial<CivilCaseInfo>) {
    setCaseData((prev) => ({
      ...prev,
      civilCaseInfo: { ...prev.civilCaseInfo, ...data },
    }));
  }

  function applyArr<T>(updater: SetStateAction<T[]>, prev: T[]): T[] {
    return typeof updater === "function"
      ? (updater as (p: T[]) => T[])(prev)
      : updater;
  }

  function setCorpsesSpecifications(
    specs: SetStateAction<CorpsesSpecifications[]>
  ) {
    setCaseData((prev) => ({
      ...prev,
      corpsesSpecifications: applyArr(specs, prev.corpsesSpecifications),
    }));
  }

  function setVictims(victims: SetStateAction<PersonData[]>) {
    setCaseData((prev) => ({
      ...prev,
      victims: applyArr(victims, prev.victims),
    }));
  }

  function setSuspects(suspects: SetStateAction<PersonData[]>) {
    setCaseData((prev) => ({
      ...prev,
      suspects: applyArr(suspects, prev.suspects),
    }));
  }

  function setReporters(reporters: SetStateAction<PersonData[]>) {
    setCaseData((prev) => ({
      ...prev,
      reporters: applyArr(reporters, prev.reporters),
    }));
  }

  function setEvidence(evidence: SetStateAction<EvidenceData[]>) {
    setCaseData((prev) => ({
      ...prev,
      evidence: applyArr(evidence, prev.evidence),
    }));
  }
  const updateSyncMetadata = useCallback(
    async (
      updates: Partial<Omit<DraftSyncMetadata, "localId">>
    ) => {
      if (!syncReadyRef.current) {
        console.error('[CaseContext] updateSyncMetadata called before ready!', {
          currentSyncReady: syncReadyRef.current,
          currentLocalId: syncMetadata.localId,
          attemptedUpdates: updates,
        });
        throw new Error("Sync metadata is not ready yet.");
      }

      const updatedMetadata: DraftSyncMetadata = {
        ...syncMetadata,
        ...updates,
        localId: syncMetadata.localId,
      };

      console.log('[CaseContext] Updating sync metadata:', {
        localId: updatedMetadata.localId,
        status: updatedMetadata.status,
        errorMessage: updatedMetadata.errorMessage,
      });

      // Persist first, so the UI doesn't claim a state that wasn't saved.
      await writeSyncMetadata(updatedMetadata);
      setSyncMetadata(updatedMetadata);
    },
    [syncMetadata]
  );
  async function resetCase() {
    const newMetadata = createSyncMetadata();

    try {
      await writeSyncMetadata(newMetadata);

      // Start the new draft only after its metadata is safely stored.
      setCaseData(createEmptyCase());
      setSyncMetadata(newMetadata);
    } catch (error) {
      console.error("[CSC] Could not reset draft metadata:", error);
      throw error;
    }
  }

  // Auto-sync pending drafts when connectivity returns
  useAutoSync({
    caseData,
    localId: syncMetadata.localId,
    syncStatus: syncMetadata.status,
    serverCaseId: syncMetadata.serverCaseId,
    isSyncReady, // Pass the ready state
    updateSyncMetadata,
    resetCase,
  });

  return (
    <CaseContext.Provider
      value={{
        caseData,
        isRestoringDraft,
        setCaseType,
        updateCaseInfo,
        updateCorpsesCaseInfo,
        updateCivilCaseInfo,
        setCorpsesSpecifications,
        setVictims,
        setSuspects,
        setReporters,
        setEvidence,
        resetCase,
        saveStatus,
        localId: syncMetadata.localId,
        syncStatus: syncMetadata.status,
        serverCaseId: syncMetadata.serverCaseId,
        lastSyncedAt: syncMetadata.lastSyncedAt,
        syncError: syncMetadata.errorMessage,
        updateSyncMetadata,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const context = useContext(CaseContext);

  if (!context) {
    throw new Error("useCase must be used within CaseProvider");
  }

  return context;
}
