/** EXAMPLE ads for the UI. Not real programmes. */
import type { Ad } from "../types/api";

export const mockAds: Ad[] = [
  {
    id: "a1",
    organisation_id: "o1",
    organisation_name: "Example Robotics Club",
    title: "[Example] Robotics show and open lab",
    description: "See student-built robots and try the line-follower challenge.",
    category: "EVENT",
    event_date: "2026-11-14T08:00:00Z",
    deadline: null,
    link: null,
    tags: ["robotics", "engineering"],
    status: "approved",
    saved: false,
    recommendation: "FOR_YOU",
  },
  {
    id: "a2",
    organisation_id: "o2",
    organisation_name: "Example Debate Society",
    title: "[Example] Debate society recruitment",
    description: "Looking for new speakers and adjudicators. No experience needed.",
    category: "CLUB",
    event_date: null,
    deadline: "2026-11-09T15:59:00Z",
    link: null,
    tags: ["public speaking"],
    status: "approved",
    saved: false,
    recommendation: "NOT_FOR_YOU",
  },
];
