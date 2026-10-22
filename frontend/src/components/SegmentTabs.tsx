import type { Segment, SegmentCount } from "../types/api";

interface Props {
  counts: SegmentCount[];
  active: Segment | null;
  onChange: (segment: Segment | null) => void;
}

export default function SegmentTabs({ counts, active, onChange }: Props) {
  const tab = (selected: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold ${
      selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600"
    }`;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
      <button className={tab(active === null)} onClick={() => onChange(null)}>
        All
      </button>
      {counts.map((c) => (
        <button
          key={c.segment}
          className={tab(active === c.segment)}
          onClick={() => onChange(c.segment)}
        >
          {c.label}
          {c.unread > 0 && <span className="ml-1.5 text-gold">{c.unread}</span>}
        </button>
      ))}
    </div>
  );
}
