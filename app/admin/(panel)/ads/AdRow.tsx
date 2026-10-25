"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type { Ad } from "@/lib/types";
import { removeAd, saveAd } from "../../actions";

/** One editable ad (or the "add new" form when `ad` is undefined). */
export default function AdRow({ ad }: { ad?: Ad }) {
  const [saveState, save, saving] = useActionState(saveAd, undefined);
  const [delState, del, deleting] = useActionState(removeAd, undefined);
  const [imageUrl, setImageUrl] = useState(ad?.image ?? "");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const state = delState ?? saveState;
  const isNew = !ad;

  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const preview = filePreview || imageUrl;

  return (
    <div className="cat-row ad-row">
      <form
        className="ad-form"
        onSubmit={(e) => {
          // Submit manually so React keeps the typed values if the server returns an error.
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          startTransition(() => save(data));
          if (isNew) {
            form.reset();
            setImageUrl("");
            setFilePreview(null);
          }
        }}
      >
        <input type="hidden" name="id" value={ad?.id ?? ""} />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="ad-thumb" />
        ) : (
          <div className="ad-thumb">No image</div>
        )}
        <div className="ad-fields">
          <input type="text" name="title" defaultValue={ad?.title} placeholder="Name (e.g. Lulu Onam sale)" aria-label="Name" required />
          <input type="text" name="linkUrl" defaultValue={ad?.linkUrl} placeholder="Link when clicked (https://...)" aria-label="Link" />
          <input
            type="text"
            name="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (https://...) or upload →"
            aria-label="Image URL"
          />
          <input
            type="file"
            name="imageFile"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            aria-label="Upload image"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFilePreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          <select name="placement" defaultValue={ad?.placement ?? "sidebar"} aria-label="Where it shows">
            <option value="sidebar">Right sidebar</option>
            <option value="inline">In sections (random)</option>
            <option value="header">Header (top right)</option>
          </select>
          <label className="check" title="Show this ad on the site">
            <input type="checkbox" name="active" defaultChecked={ad?.active ?? true} /> Live
          </label>
          <button className="adm-btn" disabled={saving}>
            {saving ? "Saving..." : isNew ? "Add" : "Save"}
          </button>
          {!isNew && (
            <button
              className="adm-btn danger"
              type="button"
              disabled={deleting}
              onClick={() => {
                if (!window.confirm(`Delete ad "${ad.title}"?`)) return;
                const data = new FormData();
                data.set("id", ad.id);
                startTransition(() => del(data));
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </form>
      {state?.error && <div className="notice err cat-msg">{state.error}</div>}
      {state?.ok && !state.error && <div className="notice ok cat-msg">{state.ok}</div>}
    </div>
  );
}
