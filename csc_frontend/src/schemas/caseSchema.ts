import { z } from "zod";

export const caseInfoSchema = z.object({
  
  governorate: z
    .string()
    .min(1, "Governorate is required (المحافظة مطلوبة)"),
  policeDepartment: z
    .string()
    .min(1, "Police Department is required (قسم الشرطة مطلوب)"),
  incidentType: z
    .string()
    .min(1, "Incident Type is required (نوع الحادث مطلوب)"),
  inspectionDate: z
    .string()
    .min(1, "Inspection Date is required (تاريخ المعاينة مطلوب)"),
  description: z
    .string()
    .min(1, "Description is required (الوصف مطلوب)")
    .max(2000, "Description is too long (الوصف طويل جداً)"),
  investigator: z
    .string()
    .min(1, "Investigator is required (المحقق مطلوب)"),
  locationName: z
    .string()
    .min(1, "Location Name is required (اسم الموقع مطلوب)"),
  address: z
    .string()
    .min(1, "Address is required (العنوان مطلوب)"),
  locationGovernorate: z
    .string()
    .min(1, "Location Governorate is required (محافظة الموقع مطلوبة)"),
  city: z
    .string()
    .min(1, "City is required (المدينة مطلوبة)"),
  district: z
    .string()
    .min(1, "District is required (الحي مطلوب)"),
  stationUsername: z.string().optional(),
});

export const evidenceItemSchema = z.object({
  evidenceId: z
    .string()
    .min(1, "Evidence ID is required (رقم الدليل مطلوب)"),
  evidenceType: z
    .string()
    .min(1, "Evidence Type is required (نوع الدليل مطلوب)"),
  description: z
    .string()
    .min(1, "Description is required (الوصف مطلوب)"),
    // .max(2000, "Description is too long (الوصف طويل جداً)"),
  images: z
    .array(z.any())
    .min(1, "At least one image is required (صورة واحدة على الأقل مطلوبة)"),
});

export const evidenceArraySchema = z
  .array(evidenceItemSchema)
  .min(1, "At least one evidence record is required (دليل واحد على الأقل مطلوب)");

export const civilCaseInfoSchema = z.object({
  caseNumber: z
    .string()
    .min(1, "Case Number is required (رقم القضية مطلوب)"),
  caseYear: z
    .string()
    .min(1, "Case Year is required (سنة القضية مطلوبة)"),
  dateOfReceipt: z.string().optional(),
  receiptAuthority: z.string().optional(),
  dateOfTransfer: z.string().optional(),
  transferredAuthority: z.string().optional(),
  governorate: z.string().optional(),
  fingerprintType: z.string().optional(),
  fingerprintHolder: z.string().optional(),
  comparisonDocument: z.string().optional(),
  typeOfComparisonDocument: z.string().optional(),
  expert: z.string().optional(),
  photographer: z.string().optional(),
  notes: z.string().optional(),
  images: z.array(z.any()).optional(),
});

export type CaseInfoInput = z.infer<typeof caseInfoSchema>;
export type EvidenceItemInput = z.infer<typeof evidenceItemSchema>;
export type CivilCaseInfoInput = z.infer<typeof civilCaseInfoSchema>;
