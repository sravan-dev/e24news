import { pickAd } from "@/lib/ads";
import type { AdPlacement } from "@/lib/types";

/** Shows a random active ad for the placement; renders `fallback` (default nothing) when there is none left. */
export default async function AdSlot({
  placement,
  className = "",
  fallback = null,
}: {
  placement: AdPlacement;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const ad = await pickAd(placement);
  if (!ad) return fallback;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={ad.image} alt={ad.title} loading="lazy" />;
  return (
    <div className={`ad-unit ad-${placement} ${className}`.trim()}>
      <small>Advertisement</small>
      {ad.linkUrl ? (
        <a href={ad.linkUrl} target="_blank" rel="noopener sponsored">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}
