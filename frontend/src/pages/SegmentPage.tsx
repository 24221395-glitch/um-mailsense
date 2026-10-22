/** One segment in full, with move-to-segment (W3-FE-01, due 8 Nov). */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEmails } from "../api/emails";
import EmailCard from "../components/EmailCard";
import { SEGMENT_LABELS, SEGMENTS, type Email, type Segment } from "../types/api";

export default function SegmentPage() {
  const { segment } = useParams();
  const valid = SEGMENTS.includes(segment as Segment) ? (segment as Segment) : null;
  const [emails, setEmails] = useState<Email[]>([]);

  useEffect(() => {
    if (valid) getEmails({ segment: valid }).then((p) => setEmails(p.items));
  }, [valid]);

  if (!valid) return <p>Unknown segment.</p>;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold">{SEGMENT_LABELS[valid]}</h1>
      {emails.map((e) => (
        <EmailCard key={e.id} email={e} />
      ))}
    </section>
  );
}
