/** Profile, CV upload and deadlines (W3-FE-01, W3-FE-02). */
import { useEffect, useState } from "react";
import { getDeadlines, getProfile, uploadCv } from "../api/profile";
import DeadlineCalendar from "../components/DeadlineCalendar";
import type { Deadline, Profile } from "../types/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile);
    getDeadlines().then(setDeadlines);
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      setProfile(await uploadCv(file));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-extrabold">Profile</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label htmlFor="cv" className="block font-semibold">
          Upload your CV (PDF, max 5 MB)
        </label>
        <input
          id="cv"
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
          className="mt-2 block text-sm"
        />
        {busy && <p className="mt-2 text-sm text-slate-500">Reading your CV…</p>}
      </div>
      {profile && (
        <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-500">Field of study</dt>
            <dd className="font-semibold">{profile.field_of_study ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Year</dt>
            <dd className="font-semibold">{profile.year_of_study ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Skills</dt>
            <dd>{profile.skills.join(", ") || "None yet"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Interests</dt>
            <dd>{profile.interests.join(", ") || "None yet"}</dd>
          </div>
        </dl>
      )}
      <div className="space-y-2">
        <h2 className="text-lg font-bold">Upcoming deadlines</h2>
        <DeadlineCalendar deadlines={deadlines} />
      </div>
    </section>
  );
}
