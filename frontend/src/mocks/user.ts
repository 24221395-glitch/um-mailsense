/** EXAMPLE data for building the UI before the backend is connected (until W3-FE-03). */
import type { Deadline, Profile, User } from "../types/api";

export const mockUser: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "example.student@siswa.um.edu.my",
  display_name: "Example Student",
  role: "admin",
};

export const mockProfile: Profile = {
  field_of_study: "Computer Science (Artificial Intelligence)",
  year_of_study: 2,
  skills: ["Python", "React", "Machine learning"],
  interests: ["Hackathons", "NLP research"],
  has_cv: false,
  updated_at: null,
};

export const mockDeadlines: Deadline[] = [
  {
    item_type: "email",
    item_id: "e2",
    title: "[Example] Hackathon registration",
    deadline: "2026-11-07T15:59:00Z",
  },
  {
    item_type: "email",
    item_id: "e3",
    title: "[Example] RA application",
    deadline: "2026-11-10T09:00:00Z",
  },
];
