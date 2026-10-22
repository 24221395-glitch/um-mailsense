/**
 * API types from docs/04-api-contract.md (SHARED CONTRACT, frozen 28 Oct).
 * Hand-written for Week 1–2 so the UI can be built on mocks.
 * From Week 2: run `npm run gen:api` and switch imports to ./api.generated.ts.
 */

export const SEGMENTS = [
  "UM_NOTICE",
  "HACKATHON",
  "RESEARCH",
  "EVENT",
  "SCHOLARSHIP_CAREER",
  "CLUB",
  "NOT_FOR_ME",
] as const;
export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_LABELS: Record<Segment, string> = {
  UM_NOTICE: "UM Official Notice",
  HACKATHON: "Hackathon & Competition",
  RESEARCH: "Research Opportunity",
  EVENT: "Events & Programmes",
  SCHOLARSHIP_CAREER: "Scholarships & Careers",
  CLUB: "Club & Community",
  NOT_FOR_ME: "Not for me",
};

export type RecLabel = "FOR_YOU" | "NOT_FOR_YOU";
export type ItemType = "email" | "ad";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: "student" | "org_admin" | "admin";
}

export interface EmailDetails {
  deadline: string | null;
  venue: string | null;
  organiser: string | null;
  link: string | null;
}

export interface Email {
  id: string;
  subject: string | null;
  sender_name: string | null;
  sender_address: string | null;
  received_at: string;
  body_preview: string | null;
  segment: Segment;
  segment_source: "ai" | "user";
  confidence: number | null;
  is_read: boolean;
  details: EmailDetails | null;
  recommendation: RecLabel | null;
}

export interface SegmentCount {
  segment: Segment;
  label: string;
  total: number;
  unread: number;
}

export interface Organisation {
  id: string;
  name: string;
  contact_email: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface Ad {
  id: string;
  organisation_id: string;
  organisation_name: string;
  title: string;
  description: string;
  category: Segment;
  event_date: string | null;
  deadline: string | null;
  link: string | null;
  tags: string[];
  status: "pending" | "approved" | "removed";
  saved: boolean;
  recommendation: RecLabel | null;
}

export interface AdIn {
  title: string;
  description: string;
  category: Segment;
  event_date?: string | null;
  deadline?: string | null;
  link?: string | null;
  tags: string[];
}

export interface Profile {
  field_of_study: string | null;
  year_of_study: number | null;
  skills: string[];
  interests: string[];
  has_cv: boolean;
  updated_at: string | null;
}

export interface Recommendation {
  item_type: ItemType;
  item_id: string;
  score: number;
  label: RecLabel;
  reason: string | null;
}

export interface Deadline {
  item_type: ItemType;
  item_id: string;
  title: string;
  deadline: string;
}

export interface Stats {
  users: number;
  emails_classified: number;
  organisations: number;
  ads: number;
}
