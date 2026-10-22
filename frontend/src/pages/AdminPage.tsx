/** Admin: approve organisations and ads, usage numbers (W3-FE-01). */
import { useEffect, useState } from "react";
import { getPendingAds, getPendingOrganisations, getStats } from "../api/admin";
import type { Ad, Organisation, Stats } from "../types/api";

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    getStats().then(setStats);
    getPendingOrganisations().then(setOrgs);
    getPendingAds().then(setAds);
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-extrabold">Admin</h1>
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-2xl font-extrabold">{v}</div>
              <div className="text-xs text-slate-500">{k.replace("_", " ")}</div>
            </div>
          ))}
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold">Organisations waiting for approval</h2>
        <p className="text-sm text-slate-500">
          {orgs.length === 0 ? "None right now." : `${orgs.length} pending`}
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold">Ads waiting for approval</h2>
        <p className="text-sm text-slate-500">
          {ads.length === 0 ? "None right now." : `${ads.length} pending`}
        </p>
      </div>
    </section>
  );
}
