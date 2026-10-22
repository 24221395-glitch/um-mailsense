export default function DeadlineBadge({ deadline }: { deadline: string | null | undefined }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  const tone =
    days < 0
      ? "bg-slate-100 text-slate-500"
      : days <= 3
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      Due {d.toLocaleDateString("en-MY", { day: "numeric", month: "short" })}
    </span>
  );
}
