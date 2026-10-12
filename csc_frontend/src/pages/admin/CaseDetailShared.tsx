import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Camera,
  FolderOpen,
  Fingerprint,
  MapPin,
  Save,
  Download,
  Trash2,
  UserPlus,
  UserRound,
  Video,
  Music,
  FileText,
  Upload,
} from "lucide-react";
import type {
  CaseData,
  EvidenceData,
  PersonData,
} from "@/context/CaseContext";

// ================= ✅ أنواع الوسائط =================

export type MediaKind = "image" | "video" | "audio" | "document";

export function guessMediaKind(opts: {
  type?: string;
  name?: string;
  mediaType?: string;
}): MediaKind {
  if (opts.mediaType && (["image", "video", "audio", "document"] as MediaKind[]).includes(opts.mediaType as MediaKind)) {
    return opts.mediaType as MediaKind;
  }
  const type = opts.type || "";
  const name = (opts.name || "").toLowerCase();
  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|bmp|heic)$/.test(name)) return "image";
  if (type.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm|m4v)$/.test(name)) return "video";
  if (type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|aac|flac)$/.test(name)) return "audio";
  return "document";
}

export function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// ================= RemoteImage type =================

export type RemoteImage = {
  url: string;           // base64 للصور، /api/media/{id}/download/ للفيديو/المستندات
  id: number;
  media_type?: MediaKind; // ✅ جديد — لو مش موجود، هنخمن من الـ URL
  file_name?: string;     // ✅ جديد
};
export type RemoteImages = {
  victims: RemoteImage[][];
  suspects: RemoteImage[][];
  reporters: RemoteImage[][];
  evidences: RemoteImage[][];
  corpseImages: RemoteImage[][];
  civilImages: RemoteImage[];
};
export type ServerIds = {
  victims: (number | null)[];
  suspects: (number | null)[];
  reporters: (number | null)[];
  evidences: (number | null)[];
  corpses: (number | null)[];
};

export type ImageAction = "add" | "remove" | "remove-new";
export type ImageHandler = (action: ImageAction, payload?: unknown) => void;
export type IndexedImageHandler = (
  index: number,
  action: ImageAction,
  payload?: unknown
) => void;

export type FileStamp = { name: string; size: number; type: string } | null;

export function fileStamp(f: File | null): FileStamp {
  if (!f) return null;
  return { name: f.name, size: f.size, type: f.type };
}

const MOCK_MARKER = "MAI-MOCK-URL::";

export function readImageTextFallback(f: File): string | null {
  try {
    const slice = f.slice(0, 8192);
    const xhr = new XMLHttpRequest();
    xhr.open("GET", URL.createObjectURL(slice), false);
    xhr.overrideMimeType("text/plain");
    xhr.send();
    const text = xhr.responseText;
    if (typeof text === "string" && text.startsWith(MOCK_MARKER)) {
      return text.slice(MOCK_MARKER.length);
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeForCompare(
  c: CaseData,
  remote?: RemoteImages
) {
  function stampImages(images: File[]): FileStamp[] {
    return images.map((f) => ({ name: f.name, size: f.size, type: f.type }));
  }
  function stampRemote(list?: { id: number }[]): number[] {
    return (list ?? []).map((x) => x.id);
  }
  const corpsesArr = Array.isArray(c.corpsesSpecifications)
    ? c.corpsesSpecifications
    : [c.corpsesSpecifications];
  return {
    caseInfo: c.caseInfo,
    corpsesCaseInfo: c.corpsesCaseInfo,
    civilCaseInfo: {
      ...c.civilCaseInfo,
      images: stampImages(c.civilCaseInfo.images),
      _civilRemoteIds: stampRemote(remote?.civilImages),
    },
    corpsesSpecifications: corpsesArr.map((s, i) => ({
      ...s,
      images: stampImages(s.images),
      _remoteIds: stampRemote(remote?.corpseImages?.[i]),
    })),
    victims: c.victims.map((v, i) => ({
      ...v,
      images: stampImages(v.images),
      _remoteIds: stampRemote(remote?.victims?.[i]),
    })),
    suspects: c.suspects.map((s, i) => ({
        ...s,
        images: stampImages(s.images),
        _remoteIds: stampRemote(remote?.suspects?.[i]),
    })),
    reporters: c.reporters.map((r, i) => ({
      ...r,
      images: stampImages(r.images),
      _remoteIds: stampRemote(remote?.reporters?.[i]),
    })),
    evidence: c.evidence.map((e, i) => ({
      ...e,
      images: stampImages(e.images),
      _remoteIds: stampRemote(remote?.evidences?.[i]),
    })),
  };
}

export const emptyPerson: PersonData = {
  fullName: "",
  nationalId: "",
  gender: "",
  nationality: "",
  note: "",
  images: [],
};

export const emptyEvidence: EvidenceData = {
  evidenceId: "",
  evidenceType: "",
  description: "",
  images: [],
};


export function labeled(label: string): JSX.Element {
  // const ar = ARABIC_LABELS[label];
  return (
    <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0875a8] mb-1.5">
      {label}
    </p>
  );
}

export function inputBase(): string {
  return "w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/60 text-gray-800 text-sm font-medium transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005588]/30 focus:border-[#005588] focus:bg-white";
}

export function EditableField({
  label,
  value,
  onChange,
  placeholder,
  type,
  textarea,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  full?: boolean;
}) {
  const { t } = useTranslation(["cases", "common"]);
  
  return (
    <div className={full ? "md:col-span-2 xl:col-span-3" : ""}>
      {labeled(label)}
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          placeholder={placeholder ?? t("cases:review.notProvided")}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBase()} h-auto py-3 resize-none`}
        />
      ) : (
        <input
          type={type ?? "text"}
          value={value}
          placeholder={placeholder ?? t("cases:review.notProvided")}
          onChange={(e) => onChange(e.target.value)}
          className={inputBase()}
        />
      )}
    </div>
  );
}

// ================= ✅ MediaTile — يعرض أي نوع من الوسائط =================

export function MediaTile({
  kind,
  src,
  fileName,
  size,
  alt,
  onRemove,
  isRemote,
  downloadUrl,
  variant = "square",
}: {
  kind: MediaKind;
  src: string;
  fileName?: string;
  size?: string;
  alt?: string;
  onRemove?: () => void;
  isRemote?: boolean;
  downloadUrl?: string;
  variant?: "square" | "wide";
}) {
  const dim = variant === "wide" ? "h-24 w-28" : "h-24 w-24";

  return (
    <div className="relative group">
      <div className={`${dim} rounded-2xl overflow-hidden border-2 ${isRemote ? "border-slate-200" : "border-[#005588]"} bg-slate-50`}>
        {kind === "image" ? (
          <img src={src} alt={alt || "media"} className="w-full h-full object-cover" />
        ) : kind === "video" ? (
          <video src={src} controls className="w-full h-full bg-black" />
        ) : kind === "audio" ? (
          <div className="flex flex-col items-center justify-center gap-1 w-full h-full p-2 bg-gradient-to-br from-cyan-50 to-cyan-100">
            <Music size={18} className="text-[#0891b2]" />
            {fileName && (
              <span className="w-full truncate text-[8px] font-medium text-[#475569] text-center" title={fileName}>
                {fileName}
              </span>
            )}
            <audio src={src} controls className="w-full scale-90" />
          </div>
        ) : (
          <a
            href={downloadUrl || src}
            target="_blank"
            rel="noopener noreferrer"
            download={fileName}
            className="flex flex-col items-center justify-center gap-1 w-full h-full p-2 hover:bg-slate-100 transition"
          >
            <FileText size={20} className="text-[#0875a8]" />
            {fileName && (
              <span className="w-full truncate text-[8px] font-medium text-[#475569] text-center" title={fileName}>
                {fileName}
              </span>
            )}
            {size && (
              <span className="text-[8px] text-[#94a3b8]">{size}</span>
            )}
          </a>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-rose-600 shadow-lg"
          title="إزالة"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ================= PersonImage =================

export function PersonImage({
    person,
    imageUrls,
    onChange,
  }: {
    person: PersonData;
    imageUrls?: RemoteImage[];
    onChange: ImageHandler;
  }) {
    const fileRef = useRef<HTMLInputElement | null>(null);

    function onPick(e: React.ChangeEvent<HTMLInputElement>) {
      const files = Array.from(e.target.files || []);
      files.forEach((f) => onChange("add", f));
      if (fileRef.current) fileRef.current.value = "";
    }

    const remote = imageUrls ?? [];

    return (
      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-wrap gap-2">
          {remote.map((img) => {
            const kind = img.media_type || (img.url?.startsWith("data:") ? "image" : guessMediaKind({ name: img.file_name, type: "" }));
            return (
              <MediaTile
                key={`srv-${img.id}`}
                kind={kind}
                src={img.url}
                fileName={img.file_name}
                alt={`${person.fullName || "person"}`}
                downloadUrl={img.url}
                isRemote
                onRemove={() => onChange("remove", img.id)}
              />
            );
          })}

          {person.images.map((f, i) => {
            const kind = guessMediaKind({ type: f.type, name: f.name });
            return (
              <MediaTile
                key={`new-${i}`}
                kind={kind}
                src={URL.createObjectURL(f)}
                fileName={f.name}
                size={formatSize(f.size)}
                alt={person.fullName || "new"}
                onRemove={() => onChange("remove-new", i)}
              />
            );
          })}

          <label onClick={() => fileRef.current?.click()} className="group cursor-pointer">
            <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-[#005588] hover:bg-[#005588]/5 transition flex flex-col items-center justify-center text-slate-400 group-hover:text-[#005588]">
              <Upload size={18} />
              <span className="text-[10px] mt-1 font-semibold">Add File</span>
            </div>
          </label>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </div>
    );
}

// ================= EvidenceImage =================

export function EvidenceImage({
    evidence,
    imageUrls,
    onChange,
  }: {
    evidence: EvidenceData;
    imageUrls?: RemoteImage[];
    onChange: ImageHandler;
  }) {
    const fileRef = useRef<HTMLInputElement | null>(null);

    function onPick(e: React.ChangeEvent<HTMLInputElement>) {
      const files = Array.from(e.target.files || []);
      files.forEach((f) => onChange("add", f));
      if (fileRef.current) fileRef.current.value = "";
    }

    const remote = imageUrls ?? [];

    return (
      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-wrap gap-2">
          {remote.map((img) => {
            const kind = img.media_type || (img.url?.startsWith("data:") ? "image" : guessMediaKind({ name: img.file_name, type: "" }));
            return (
              <MediaTile
                key={`srv-${img.id}`}
                kind={kind}
                src={img.url}
                fileName={img.file_name}
                alt={`Evidence ${evidence.evidenceId}`}
                downloadUrl={img.url}
                isRemote
                variant="wide"
                onRemove={() => onChange("remove", img.id)}
              />
            );
          })}

          {evidence.images.map((f, i) => {
            const kind = guessMediaKind({ type: f.type, name: f.name });
            return (
              <MediaTile
                key={`new-${i}`}
                kind={kind}
                src={URL.createObjectURL(f)}
                fileName={f.name}
                size={formatSize(f.size)}
                alt={`Evidence ${evidence.evidenceId}`}
                variant="wide"
                onRemove={() => onChange("remove-new", i)}
              />
            );
          })}

          <label onClick={() => fileRef.current?.click()} className="group cursor-pointer">
            <div className="h-24 w-28 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-[#005588] hover:bg-[#005588]/5 transition flex flex-col items-center justify-center text-slate-400 group-hover:text-[#005588]">
              <Upload size={18} />
              <span className="text-[10px] mt-1 font-semibold">Add File</span>
            </div>
          </label>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </div>
    );
}

// ================= PersonEditableCard =================

export function PersonEditableCard({
    title,
    icon: Icon,
    iconColor,
    person,
    imageUrls,
    onChange,
    onImageAction,
  }: {
    title: string;
    icon: typeof UserRound;
    iconColor: string;
    person: PersonData;
    imageUrls?: RemoteImage[];
    onChange: (p: PersonData) => void;
    onImageAction: ImageHandler;
  }) {
    const { t } = useTranslation(["cases", "common"]);
    
    function patch<K extends keyof PersonData>(key: K, v: PersonData[K]): void {
      onChange({ ...person, [key]: v });
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-[#fafcfe] p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconColor}`}>
            <Icon size={14} />
          </div>
          <p className="text-xs font-semibold text-[#12385a]">{title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              ملفات الشخص 
            </p>
            <PersonImage person={person} imageUrls={imageUrls} onChange={onImageAction} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            <EditableField label={t("cases:labels.fullName")} value={person.fullName} onChange={(v) => patch("fullName", v)} />
            <EditableField label={t("cases:labels.nationalId")} value={person.nationalId} onChange={(v) => patch("nationalId", v)} />
            <EditableField label={t("cases:labels.gender")} value={person.gender} onChange={(v) => patch("gender", v)} />
            <EditableField label={t("cases:labels.nationality")} value={person.nationality} onChange={(v) => patch("nationality", v)} />
            <div className="sm:col-span-2">
              <EditableField
                label={t("cases:labels.note")}
                value={person.note}
                onChange={(v) => patch("note", v)}
                textarea
              />
            </div>
          </div>
        </div>
      </div>
    );
}

// ================= DeleteConfirmModal =================

export function DeleteConfirmModal({
  open,
  caseName,
  caseCode,
  deleting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  caseName: string;
  caseCode: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState<string>("");
  const canDelete = confirmText === "DELETE";

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) setConfirmText("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 px-8 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <AlertTriangle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold">حذف القضية نهائيًا</h2>
              <p className="text-sm text-rose-50 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7 space-y-5">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-900 leading-relaxed">
              أنت على وشك حذف القضية{" "}
              <span className="font-bold">{caseCode}</span>{" "}
              {caseName && caseName !== `#${caseCode}` && (
                <>
                  (<span className="font-semibold">{caseName}</span>)
                </>
              )}{" "}
              نهائيًا من النظام.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-rose-800">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 mt-0.5">•</span>
                سيتم حذف كل الأشخاص المرتبطين بالقضية
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 mt-0.5">•</span>
                سيتم حذف كل الأدلة والصور المرتبطة بها
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 mt-0.5">•</span>
                لن تتمكن من استعادة هذه البيانات مرة أخرى
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              للتأكيد، اكتب كلمة{" "}
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-rose-600">
                DELETE
              </span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-gray-800 text-sm font-mono font-semibold text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-gray-700 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canDelete || deleting}
            className="h-11 px-5 rounded-xl bg-rose-600 text-white inline-flex items-center gap-2 text-sm font-semibold hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-rose-600/20 transition"
          >
            <Trash2 size={16} />
            {deleting ? "جاري الحذف..." : "تأكيد الحذف النهائي"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyHint({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-7 text-center text-sm text-gray-400">{message}</div>
  );
}

export function AdminConsoleFooter({
  dirty,
  saveChanges,
  handleDownload,
}: {
  dirty: boolean;
  saveChanges: () => void;
  handleDownload: () => void;
}) {
  const { t } = useTranslation(["cases", "common"]);
  
  return (
    <div className="print:hidden flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.18em]">{t("cases:review.adminConsole")}</p>
        <p className="text-sm text-gray-700 mt-1">
          {dirty ? (
            <span className="font-semibold text-amber-600">{t("cases:review.unsavedEdits")}</span>
          ) : (
            <span className="text-emerald-600 font-semibold">{t("cases:review.caseFileUpToDate")}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={saveChanges} disabled={!dirty} className="h-10 px-5 rounded-xl bg-emerald-600 text-white inline-flex items-center gap-2 text-xs font-semibold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none shadow-lg shadow-emerald-600/20 transition disabled:cursor-not-allowed">
          <Save size={15} />
          {t("cases:review.saveChanges")}
        </button>
        <button onClick={handleDownload} className="h-10 px-5 rounded-xl bg-[#005588] text-white inline-flex items-center gap-2 text-xs font-semibold hover:bg-[#004670] shadow-lg shadow-[#005588]/20 transition">
          <Download size={15} />
          {t("cases:review.downloadCase")}
        </button>
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  bgColor,
}: {
  title: string;
  subtitle?: string;
  icon: typeof FolderOpen | typeof MapPin | typeof Fingerprint | typeof UserRound | typeof AlertTriangle;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div className={`flex items-center gap-2 border-b border-slate-100 px-6 py-4 ${bgColor}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconColor}`}>
        <Icon size={15} />
      </div>
      <h2 className="text-xl font-bold text-[#12385a]">{title}</h2>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  );
}