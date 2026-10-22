import { useEffect, useState } from "react";
import { getEmails, getSegments } from "../api/emails";
import EmailCard from "../components/EmailCard";
import SegmentTabs from "../components/SegmentTabs";
import type { Email, Segment, SegmentCount } from "../types/api";

export default function InboxPage() {
  const [counts, setCounts] = useState<SegmentCount[]>([]);
  const [segment, setSegment] = useState<Segment | null>(null);
  const [emails, setEmails] = useState<Email[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSegments()
      .then(setCounts)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    setEmails(null);
    getEmails({ segment: segment ?? undefined })
      .then((p) => setEmails(p.items))
      .catch((e: Error) => setError(e.message));
  }, [segment]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold">Inbox</h1>
      <SegmentTabs counts={counts} active={segment} onChange={setSegment} />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {emails === null ? (
        <p className="text-sm text-slate-500">Loading emails…</p>
      ) : emails.length === 0 ? (
        <p className="text-sm text-slate-500">No emails in this segment.</p>
      ) : (
        <div className="space-y-3">
          {emails.map((e) => (
            <EmailCard key={e.id} email={e} />
          ))}
        </div>
      )}
    </section>
  );
}
