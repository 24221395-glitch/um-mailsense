/** EXAMPLE emails for the UI. Not real messages. */
import { SEGMENTS, SEGMENT_LABELS, type Email, type SegmentCount } from "../types/api";

export const mockEmails: Email[] = [
  {
    id: "e1",
    subject: "[Example] Final examination timetable released",
    sender_name: "Examination Unit",
    sender_address: "exam@example.um.edu.my",
    received_at: "2026-11-02T01:00:00Z",
    body_preview: "The final examination timetable for Semester 1 is now available...",
    segment: "UM_NOTICE",
    segment_source: "ai",
    confidence: 0.97,
    is_read: false,
    details: null,
    recommendation: null,
  },
  {
    id: "e2",
    subject: "[Example] 24-hour hackathon: registration open",
    sender_name: "Computing Society",
    sender_address: "society@example.um.edu.my",
    received_at: "2026-11-03T02:15:00Z",
    body_preview: "Form teams of 3 to 5. Prizes for the top three teams...",
    segment: "HACKATHON",
    segment_source: "ai",
    confidence: 0.94,
    is_read: false,
    details: {
      deadline: "2026-11-07T15:59:00Z",
      venue: "Faculty of Computer Science",
      organiser: "Computing Society",
      link: "https://example.com/register",
    },
    recommendation: "FOR_YOU",
  },
  {
    id: "e3",
    subject: "[Example] Research assistant wanted: NLP lab",
    sender_name: "Faculty of Computer Science",
    sender_address: "fcsit@example.um.edu.my",
    received_at: "2026-11-03T06:30:00Z",
    body_preview: "Part-time RA position for a Malay-English NLP project...",
    segment: "RESEARCH",
    segment_source: "ai",
    confidence: 0.91,
    is_read: true,
    details: { deadline: "2026-11-10T09:00:00Z", venue: null, organiser: "NLP Lab", link: null },
    recommendation: "FOR_YOU",
  },
  {
    id: "e4",
    subject: "[Example] Cultural night 2026",
    sender_name: "Student Affairs",
    sender_address: "hep@example.um.edu.my",
    received_at: "2026-11-01T10:00:00Z",
    body_preview: "Join us for food, music and performances from 20 countries...",
    segment: "EVENT",
    segment_source: "ai",
    confidence: 0.88,
    is_read: false,
    details: {
      deadline: null,
      venue: "Dewan Tunku Canselor",
      organiser: "Student Affairs",
      link: null,
    },
    recommendation: "NOT_FOR_YOU",
  },
];

export function mockSegmentCounts(): SegmentCount[] {
  return SEGMENTS.map((segment) => {
    const list = mockEmails.filter((e) => e.segment === segment);
    return {
      segment,
      label: SEGMENT_LABELS[segment],
      total: list.length,
      unread: list.filter((e) => !e.is_read).length,
    };
  });
}
