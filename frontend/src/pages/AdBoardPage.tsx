/** Ad board (W3-FE-01, due 8 Nov). */
import { useEffect, useState } from "react";
import { getAds, setSaved } from "../api/ads";
import AdCard from "../components/AdCard";
import { SEGMENT_LABELS, SEGMENTS, type Ad, type Segment } from "../types/api";

export default function AdBoardPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [category, setCategory] = useState<Segment | "">("");
  const [q, setQ] = useState("");

  useEffect(() => {
    getAds({ category: category || undefined, q }).then((p) => setAds(p.items));
  }, [category, q]);

  const toggle = async (ad: Ad) => {
    await setSaved(ad.id, !ad.saved);
    setAds((list) => list.map((a) => (a.id === ad.id ? { ...a, saved: !a.saved } : a)));
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold">Ad board</h1>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="ad-search">
          Search
        </label>
        <input
          id="ad-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search programmes"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2"
        />
        <label className="sr-only" htmlFor="ad-category">
          Category
        </label>
        <select
          id="ad-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Segment | "")}
          className="rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="">All categories</option>
          {SEGMENTS.filter((s) => s !== "NOT_FOR_ME").map((s) => (
            <option key={s} value={s}>
              {SEGMENT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ads.map((a) => (
          <AdCard key={a.id} ad={a} onToggleSave={toggle} />
        ))}
      </div>
    </section>
  );
}
