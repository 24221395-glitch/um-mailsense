import type { Email } from "../types/api";
import { SEGMENT_LABELS } from "../types/api";
import DeadlineBadge from "./DeadlineBadge";
import RecBadge from "./RecBadge";

export default function EmailCard({ email }: { email: Email }) {
  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm ${email.is_read ? "border-slate-200" : "border-navy/40"}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-navy">{SEGMENT_LABELS[email.segment]}</span>
        <span>·</span>
        <span>{email.sender_name}</span>
        <span className="ml-auto">{new Date(email.received_at).toLocaleDateString("en-MY")}</span>
      </div>
      <h3 className={`mt-1 text-base ${email.is_read ? "font-medium" : "font-bold"}`}>
        {email.subject}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{email.body_preview}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <RecBadge label={email.recommendation} />
        <DeadlineBadge deadline={email.details?.deadline} />
      </div>
    </article>
  );
}
