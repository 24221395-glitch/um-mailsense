import type { RecLabel } from "../types/api";

export default function RecBadge({ label }: { label: RecLabel | null }) {
  if (!label) return null;
  return label === "FOR_YOU" ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
      For you
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      Probably not for you
    </span>
  );
}
