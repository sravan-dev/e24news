import { listAllAds } from "@/lib/ads";
import { hasSecretKey } from "@/lib/supabase";
import AdRow from "./AdRow";

export default async function AdsPage() {
  if (!hasSecretKey()) return null; // layout shows setup steps
  const ads = await listAllAds();

  return (
    <>
      <div className="adm-head">
        <h1>Ads</h1>
      </div>

      <div className="adm-table-wrap" style={{ marginBottom: 22 }}>
        <div className="cat-head">Add ad</div>
        <AdRow />
      </div>

      <div className="adm-table-wrap">
        <div className="cat-head">
          {ads.length} ad{ads.length === 1 ? "" : "s"} · {ads.filter((a) => a.active).length} live
        </div>
        {ads.map((a) => (
          // Key on the saved values so the row resets after a save.
          <AdRow key={`${a.id}-${a.title}-${a.image}-${a.linkUrl}-${a.placement}-${a.active}`} ad={a} />
        ))}
        {ads.length === 0 && <p style={{ padding: 20, color: "#6b7280" }}>No ads yet.</p>}
      </div>
      <p className="hint" style={{ color: "#6b7280", fontSize: 13, marginTop: 14 }}>
        <b>Right sidebar</b> ads show in the right column of the home, category and article pages (up to two per
        page; 300 × 250 or 300 × 600 images work best). <b>In sections</b> ads are placed at random spots between
        home page sections, inside long articles and in the wide banner slot (728 × 90 or 970 × 250 work best). Every
        page load picks at random from the live ads, and a page never shows the same ad twice. Untick
        &ldquo;Live&rdquo; to pause an ad without deleting it.
      </p>
    </>
  );
}
