/** Deadline calendar (W3-FE-02, due 9 Nov). Starts as a sorted list; Wendi turns it into a calendar. */
import type { Deadline } from "../types/api";

export default function DeadlineCalendar({ deadlines }: { deadlines: Deadline[] }) {
  const sorted = [...deadlines].sort((a, b) => a.deadline.localeCompare(b.deadline));
  if (!sorted.length) return <p className="text-sm text-slate-500">No upcoming deadlines.</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {sorted.map((d) => (
        <li key={`${d.item_type}-${d.item_id}`} className="flex justify-between gap-4 p-3 text-sm">
          <span className="font-medium">{d.title}</span>
          <span className="whitespace-nowrap text-slate-500">
            {new Date(d.deadline).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}
          </span>
        </li>
      ))}
    </ul>
  );
}
