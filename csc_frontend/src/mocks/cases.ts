import type { CaseData, PersonData, EvidenceData } from "@/context/CaseContext";

export interface CaseRecord {
  id: string;
  caseYear: string;
  incidentType: string;
  inspectionDate: string;
  isoDate: string;
  description: string;
  crimeScene: string;
  address: string;
  governorate: string;
  city: string;
  district: string;
  stationId: string;
}

const STATIONS = [
  "All Stations",
  "st-1",
  "st-2",
  "st-3",
  "st-4",
  "st-5",
  "st-6",
];

const STATION_IDS = STATIONS.filter((s) => s !== "All Stations");

const INCIDENT_TYPES = [
  "Digital Asset Theft",
  "Network Intrusion",
  "Homicide",
];

const CRIME_SCENES = [
  "Central Data Hub",
  "South Server Room",
  "Residential Complex",
];

const GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
];

const LOCATIONS: Record<string, { governorate: string; cities: string[]; districts: string[]; addresses: string[] }> = {
  Cairo: {
    governorate: "Cairo",
    cities: ["Maadi", "Old Cairo", "Heliopolis", "Nasr City", "Zamalek"],
    districts: ["District 5", "Fustat", "District 2", "District 9", "District 1"],
    addresses: ["Bldg 4, Tech Park", "12 Nile Corniche", "Suite 7, Tower C", "Villa 21, Block D", "Unit 304"],
  },
  Giza: {
    governorate: "Giza",
    cities: ["Dokki", "Mohandessin", "6th October", "Sheikh Zayed"],
    districts: ["District 3", "District 7", "District 12", "District 4"],
    addresses: ["Plaza 2A", "Floor 18, Westgate", "Unit B-42", "Block 11, Plot 5"],
  },
  Alexandria: {
    governorate: "Alexandria",
    cities: ["Sidi Gaber", "Stanley", "Montaza", "Miami"],
    districts: ["Harbor District", "East District", "Beach Front", "Corniche Sector"],
    addresses: ["44 Corniche Ave", "Stanley Bridge Plaza", "Lobby 3, Marina 2", "West Harbor Bldg"],
  },
  Qalyubia: {
    governorate: "Qalyubia",
    cities: ["Benha", "Shubra El-Kheima", "Banha Center"],
    districts: ["Industrial", "Residential A", "Agricultural Zone"],
    addresses: ["Factory 12, Zone 4", "House 8, Block 6", "Warehouse C-1"],
  },
  Dakahlia: {
    governorate: "Dakahlia",
    cities: ["Mansoura", "Mit Ghamr", "Talkha"],
    districts: ["Downtown", "University Quarter", "Riverside"],
    addresses: ["Building 9, Tower 2", "Suite 203, Business Pk", "Houses 44-46"],
  },
  Sharqia: {
    governorate: "Sharqia",
    cities: ["Zagazig", "Minya El-Qamh", "Belbeis"],
    districts: ["Center", "West", "East Bank"],
    addresses: ["Plaza Building 1", "Villa 14, Al-Wahda", "Industrial Lot 7"],
  },
};

export const STATIONS_REFERENCE = STATIONS;
export const STATION_IDS_REFERENCE = STATION_IDS;
export const INCIDENT_TYPES_REFERENCE = INCIDENT_TYPES;
export const CRIME_SCENES_REFERENCE = CRIME_SCENES;
export const GOVERNORATES_REFERENCE = GOVERNORATES;
export const LOCATIONS_REFERENCE = LOCATIONS;

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function formatDateDisplay(d: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return d.toLocaleDateString("en-US", opts);
}

export function generateMockCases(count: number): CaseRecord[] {
  const records: CaseRecord[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor((i * 2.3) % 120);
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(0, 0, 0, 0);

    const govKey = pick(Object.keys(LOCATIONS), i + 3);
    const loc = LOCATIONS[govKey];
    const city = pick(loc.cities, i * 7);
    const district = pick(loc.districts, i * 11);
    const address = pick(loc.addresses, i * 17);
    const stationId = pick(STATION_IDS, i * 5);
    const incidentType = pick(INCIDENT_TYPES, i * 19);
    const crimeScene = pick(CRIME_SCENES, i * 23);

    const num = 1000 + i * 37;
    const id = `FR-2024-${String(num).padStart(4, "0")}`;

    const descMap: Record<string, string> = {
      "Digital Asset Theft": "Unauthorized transfer of secured digital files and encrypted asset records from the primary storage cluster.",
      "Network Intrusion": "Brute force attack detected against perimeter firewall. Session logs indicate foothold in DMZ subnet.",
      Homicide: "Investigation opened following discovery of deceased individual. Forensic team secured perimeter.",
      Burglary: "Forced entry documented at primary entrance. Lockbox tampering evident. Inventory pending review.",
      Arson: "Fire pattern analysis indicates accelerant use at two points of origin. Sample collection in progress.",
      Fraud: "Documented discrepancies in financial records across two fiscal quarters. Witness interviews ongoing.",
      "Cyber Attack": "Ransomware signature identified on three workstations. Isolation protocol executed. Analysis pending.",
      Robbery: "Armed robbery reported at cash handling facility. Surveillance footage retained and secured.",
      Vandalism: "Property damage documented on north-facing facade. Graffiti samples photographed and cataloged.",
      "Drug Trafficking": "Controlled substance seizure recorded. Packaging and batch identifiers preserved for chain of custody.",
      "Money Laundering": "Suspicious transaction pattern identified across multiple accounts. Subpoena package prepared.",
      Smuggling: "Container inspected at checkpoint. Manifest mismatch documented. Contents held in evidence lockup.",
    };

    records.push({
      id,
      caseYear: String(d.getFullYear()),
      incidentType,
      inspectionDate: formatDateDisplay(d),
      isoDate: d.toISOString().slice(0, 10),
      description: descMap[incidentType] ?? "Case opened for forensic review and evidence collection.",
      crimeScene,
      address,
      governorate: govKey,
      city,
      district,
      stationId,
    });
  }
  return records;
}

export const ALL_CASES: CaseRecord[] = generateMockCases(22);
export const TOTAL_RECORDS_REFERENCE = ALL_CASES.length;
export const STATION_COUNT_REFERENCE = STATION_IDS.length;
export const PAGE_SIZE = 10;

export function findCaseById(id: string): CaseRecord | null {
  return ALL_CASES.find((c) => c.id === id) ?? null;
}

const MOCK_MARKER = "MAI-MOCK-URL::";

function makePersonImage(prompt: string): File {
  const url = `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    `professional ID photograph portrait of ${prompt}, neutral background, 300x300 passport style`
  )}&image_size=square`;
  const blob = new Blob([MOCK_MARKER + url], { type: "text/plain" });
  return new File([blob], `${prompt.replace(/\s+/g, "_")}.jpg`, {
    type: "image/jpeg",
  });
}

function makeEvidenceImage(prompt: string): File {
  const url = `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    `forensic evidence photo, ${prompt}, evidence table, professional lighting, 300x300`
  )}&image_size=square`;
  const blob = new Blob([MOCK_MARKER + url], { type: "text/plain" });
  return new File([blob], `evidence_${prompt.replace(/\s+/g, "_")}.jpg`, {
    type: "image/jpeg",
  });
}

function buildPersonFromSeed(seed: number, variant: "victim" | "suspect" | "reporter"): PersonData {
  const firstNames = ["Ahmed", "Mohamed", "Ali", "Hassan", "Khaled", "Omar", "Fatma", "Sara", "Amira", "Nour"];
  const lastNames = ["Hassan", "Ali", "El-Sayed", "Mahmoud", "Ibrahim", "Gaber", "Salah", "Nasser", "Hossam", "Farouk"];
  const nationalities = ["Egyptian", "Egyptian", "Egyptian", "Sudanese", "Saudi", "UAE"];
  const genders = ["Male", "Male", "Female"];

  const first = pick(firstNames, seed + variant.length);
  const last = pick(lastNames, seed * 3 + variant.length * 2);
  const gender = pick(genders, seed + variant.length * 5);
  const nationality = pick(nationalities, seed + variant.length);

  const natIdBase = 280 + (seed * 17) % 720;
  const natIdRest = 1000000000 + (seed * 1315423) % 8999999999;

  const imagePrompts: Record<string, string> = {
    victim: `${gender.toLowerCase()} ${nationality.toLowerCase()} adult victim`,
    suspect: `${gender.toLowerCase()} suspect mugshot`,
    reporter: `${gender.toLowerCase()} police officer in uniform`,
  };

  return {
    fullName: `${first} ${last}`,
    nationalId: `${natIdBase}${String(natIdRest).slice(0, 11)}`.slice(0, 14),
    gender,
    nationality,
    note: "",
    images: [makePersonImage(imagePrompts[variant])],
  };
}

function buildEvidenceFromSeed(seed: number, index: number): EvidenceData {
  const types = ["Digital", "Physical", "Biological", "Documentary", "Trace"];
  const collectors = ["Ahmed F.", "Omar H.", "Nadia S.", "Khaled M.", "Sara E."];
  const descriptions: Record<string, string[]> = {
    Digital: [
      "Hard drive forensic image from primary workstation.",
      "USB flash drive found near terminal cluster.",
      "Network packet capture file from border router.",
      "Cloud storage access logs and session tokens.",
    ],
    Physical: [
      "Broken window fragment with tool marks.",
      "Metal lock cylinder with forced entry damage.",
      "Handwritten note recovered from desk drawer.",
      "Plastic casing with partial fingerprint residue.",
    ],
    Biological: [
      "Blood swab sample from carpet area #3.",
      "Hair follicle specimens collected near entry.",
      "Saliva residue on discarded beverage container.",
      "Skin cell swab from touch-point surface.",
    ],
    Documentary: [
      "Financial ledger with irregular entries flagged.",
      "Signed contract copy with questionable notary.",
      "Printed email chain between involved parties.",
      "Inventory manifest with quantity discrepancies.",
    ],
    Trace: [
      "Fiber sample from victim's clothing transfer.",
      "Glass micro-fragment embedded in shoe sole.",
      "Gunpowder residue sample taken from doorway.",
      "Paint chip from suspect vehicle at scene.",
    ],
  };

  const type = pick(types, seed * 3 + index * 7);
  const descList = descriptions[type] ?? descriptions.Physical;
  const description = pick(descList, seed * 5 + index * 11);
  const collectedBy = pick(collectors, seed + index * 3);
  const evidenceNum = 100 + (seed * 4 + index * 13) % 899;
  const evidenceTypePrompt = type === "Digital" ? "hard drive or laptop" : type === "Physical" ? "broken glass or tool" : type === "Biological" ? "blood sample or test tube" : type === "Documentary" ? "paper documents or file folder" : "trace evidence bag";

  return {
    evidenceId: `EV-${String(evidenceNum).padStart(3, "0")}`,
    evidenceType: type,
    description,
    images: [makeEvidenceImage(evidenceTypePrompt)],
  };
}

export function convertCaseRecordToCaseData(record: CaseRecord, seed: number): CaseData {
  const victimCount = 1 + (seed % 2);
  const suspectCount = 1 + (seed % 2);
  const evidenceCount = 2 + (seed % 3);

  const victims: PersonData[] = [];
  for (let i = 0; i < victimCount; i++) {
    victims.push(buildPersonFromSeed(seed * 10 + i, "victim"));
  }

  const suspects: PersonData[] = [];
  for (let i = 0; i < suspectCount; i++) {
    suspects.push(buildPersonFromSeed(seed * 10 + 50 + i, "suspect"));
  }

  const evidence: EvidenceData[] = [];
  for (let i = 0; i < evidenceCount; i++) {
    evidence.push(buildEvidenceFromSeed(seed, i));
  }

  const reporters: PersonData[] = [buildPersonFromSeed(seed + 999, "reporter")];

  return {
    caseType: "criminal" as const,
    caseInfo: {
      caseId: record.id,
      caseYear: record.caseYear,
      incidentType: record.incidentType,
      inspectionDate: record.isoDate,
      description: record.description,
      policeDepartment: `${record.stationId} Central Division`,
      governorate: record.governorate,
      investigator: `Lead Investigator ${record.stationId}`,
      locationName: record.crimeScene,
      address: record.address,
      locationGovernorate: record.governorate,
      city: record.city,
      district: record.district,
      stationUsername: record.stationId,
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
    corpsesSpecifications: [{
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
    }],
    victims,
    suspects,
    reporters,
    evidence,
  };
}
