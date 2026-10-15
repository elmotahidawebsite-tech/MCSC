import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";

export interface PersonData {
  fullName: string;
  nationalId: string;
  gender: string;
  nationality: string;
  note: string;
  images: File[];
  imageUrls?: string[]; // For admin review - URLs from API
}

export interface EvidenceData {
  evidenceId: string;
  evidenceType: string;
  description: string;
  images: File[];
  imageUrls?: string[]; // For admin review - URLs from API
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
  caseFiles?: File[]; // Alias for images for backwards compatibility
  caseFileUrls?: string[]; // For admin review - URLs from API
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
  imageUrls?: string[]; // For admin review - URLs from API
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

interface CaseContextType {
  caseData: CaseData;

  setCaseType: (type: CaseType) => void;
  updateCaseInfo: (
    data: Partial<CaseData["caseInfo"]>
  ) => void;
  updateCorpsesCaseInfo: (
    data: Partial<CorpsesCaseInfo>
  ) => void;
  updateCivilCaseInfo: (
    data: Partial<CivilCaseInfo>
  ) => void;
  setCorpsesSpecifications: (
    specs: SetStateAction<CorpsesSpecifications[]>
  ) => void;

  setVictims: (victims: SetStateAction<PersonData[]>) => void;
  setSuspects: (suspects: SetStateAction<PersonData[]>) => void;
  setReporters: (reporters: SetStateAction<PersonData[]>) => void;
  setEvidence: (evidence: SetStateAction<EvidenceData[]>) => void;

  resetCase: () => void;
}

const emptyPerson: PersonData = {
  fullName: "",
  nationalId: "",
  gender: "",
  nationality: "",
  note: "",
  images: [],
};

const emptyCorpsesCaseInfo: CorpsesCaseInfo = {
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
};

const emptyCivilCaseInfo: CivilCaseInfo = {
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
};

const emptyCorpsesSpecifications: CorpsesSpecifications = {
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
};

const initialCaseData: CaseData = {
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

  corpsesCaseInfo: { ...emptyCorpsesCaseInfo },
  civilCaseInfo: { ...emptyCivilCaseInfo },
  corpsesSpecifications: [{ ...emptyCorpsesSpecifications }],

  victims: [{ ...emptyPerson }],
  suspects: [{ ...emptyPerson }],
  reporters: [{ ...emptyPerson }],
  evidence: [],
};

const CaseContext = createContext<
  CaseContextType | undefined
>(undefined);

export function CaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [caseData, setCaseData] =
    useState<CaseData>(initialCaseData);

  function setCaseType(type: CaseType) {
    setCaseData((prev) => ({
      ...prev,
      caseType: type,
    }));
  }

  function updateCaseInfo(
    data: Partial<CaseData["caseInfo"]>
  ) {
    setCaseData((prev) => ({
      ...prev,
      caseInfo: {
        ...prev.caseInfo,
        ...data,
      },
    }));
  }

  function updateCorpsesCaseInfo(
    data: Partial<CorpsesCaseInfo>
  ) {
    setCaseData((prev) => ({
      ...prev,
      corpsesCaseInfo: {
        ...prev.corpsesCaseInfo,
        ...data,
      },
    }));
  }

  function updateCivilCaseInfo(
    data: Partial<CivilCaseInfo>
  ) {
    setCaseData((prev) => ({
      ...prev,
      civilCaseInfo: {
        ...prev.civilCaseInfo,
        ...data,
      },
    }));
  }

  function applyArr<T>(
    updater: SetStateAction<T[]>,
    prev: T[]
  ): T[] {
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

  function resetCase() {
    setCaseData({
      ...initialCaseData,
      caseInfo: { ...initialCaseData.caseInfo },
      corpsesCaseInfo: { ...emptyCorpsesCaseInfo },
      civilCaseInfo: { ...emptyCivilCaseInfo },
      corpsesSpecifications: [{ ...emptyCorpsesSpecifications }],
      victims: [{ ...emptyPerson }],
      suspects: [{ ...emptyPerson }],
      reporters: [{ ...emptyPerson }],
      evidence: [],
    });
  }

  return (
    <CaseContext.Provider
      value={{
        caseData,
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
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const context = useContext(CaseContext);

  if (!context) {
    throw new Error(
      "useCase must be used within CaseProvider"
    );
  }

  return context;
}
