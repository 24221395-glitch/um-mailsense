import type { Ad } from "../types/api";
import { SEGMENT_LABELS } from "../types/api";
import DeadlineBadge from "./DeadlineBadge";
import RecBadge from "./RecBadge";

interface Props {
  ad: Ad;
  onToggleSave: (ad: Ad) => void;
}

export default function AdCard({ ad, onToggleSave }: Props) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-navy">{SEGMENT_LABELS[ad.category]}</div>
      <h3 className="text-base font-bold">{ad.title}</h3>
      <p className="text-sm text-slate-600">{ad.description}</p>
      <div className="text-xs text-slate-500">{ad.organisation_name}</div>
      <div className="flex flex-wrap items-center gap-2">
        <RecBadge label={ad.recommendation} />
        <DeadlineBadge deadline={ad.deadline} />
        <button
          className="ml-auto rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold"
          onClick={() => onToggleSave(ad)}
        >
          {ad.saved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}
