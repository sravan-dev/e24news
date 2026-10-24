"use client";

import { startTransition, useActionState, useState } from "react";
import type { Category } from "@/lib/types";
import { removeCategory, saveCategory } from "../../actions";

/** One editable category (or the "add new" form when `category` is undefined). */
export default function CategoryRow({
  category,
  count = 0,
  others = [],
}: {
  category?: Category;
  count?: number;
  others?: { slug: string; name: string }[];
}) {
  const [confirming, setConfirming] = useState(false);
  const [mode, setMode] = useState<"move" | "delete">("move");
  const [saveState, save, saving] = useActionState(saveCategory, undefined);
  const [delState, del, deleting] = useActionState(removeCategory, undefined);
  const state = delState ?? saveState;
  const isNew = !category;

  return (
    <div className="cat-row">
      <form
        className="cat-form"
        onSubmit={(e) => {
          // Submit manually so React keeps the typed values if the server returns an error.
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          startTransition(() => save(data));
          if (isNew) form.reset();
        }}
      >
        <input type="hidden" name="originalSlug" value={category?.slug ?? ""} />
        <input
          type="color"
          name="color"
          defaultValue={category?.color ?? "#1a73d0"}
          aria-label="Colour"
          title="Label colour"
        />
        <input type="text" name="name" defaultValue={category?.name} placeholder="Name" aria-label="Name" required />
        <input
          type="text"
          name="slug"
          defaultValue={category?.slug}
          placeholder={isNew ? "slug (auto)" : "slug"}
          aria-label="Slug"
          className="mono"
        />
        <input
          type="number"
          name="sortOrder"
          defaultValue={category?.sortOrder ?? 999}
          aria-label="Menu order"
          title="Menu order (lower comes first)"
          className="order"
        />
        <label className="check" title="Show in the top menu and footer">
          <input type="checkbox" name="showInMenu" defaultChecked={category?.showInMenu ?? true} /> Menu
        </label>
        <span className="count">{isNew ? "" : `${count} article${count === 1 ? "" : "s"}`}</span>
        <button className="adm-btn" disabled={saving}>
          {saving ? "Saving..." : isNew ? "Add" : "Save"}
        </button>
      </form>
      {!isNew && !confirming && (
        <button
          className="adm-btn danger"
          type="button"
          disabled={deleting}
          onClick={() => {
            if (count > 0) setConfirming(true);
            else if (window.confirm(`Delete category "${category.name}"?`)) {
              const data = new FormData();
              data.set("slug", category.slug);
              startTransition(() => del(data));
            }
          }}
        >
          Delete
        </button>
      )}
      {!isNew && confirming && (
        <form
          className="cat-delete"
          action={del}
          onSubmit={(e) => {
            const msg =
              mode === "delete"
                ? `Permanently delete "${category.name}" AND its ${count} article${count === 1 ? "" : "s"}? This cannot be undone.`
                : `Delete "${category.name}" and move its ${count} article${count === 1 ? "" : "s"}?`;
            if (!window.confirm(msg)) e.preventDefault();
          }}
        >
          <input type="hidden" name="slug" value={category.slug} />
          <b>
            &ldquo;{category.name}&rdquo; has {count} article{count === 1 ? "" : "s"}.
          </b>
          <label className="check">
            <input type="radio" name="mode" value="move" checked={mode === "move"} onChange={() => setMode("move")} />
            Move them to
          </label>
          <select name="target" disabled={mode !== "move"} defaultValue={others[0]?.slug} aria-label="Move articles to">
            {others.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
          <label className="check">
            <input type="radio" name="mode" value="delete" checked={mode === "delete"} onChange={() => setMode("delete")} />
            Delete them too
          </label>
          <button className="adm-btn danger" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete category"}
          </button>
          <button className="adm-btn ghost" type="button" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </form>
      )}
      {state?.error && <div className="notice err cat-msg">{state.error}</div>}
      {state?.ok && !state.error && <div className="notice ok cat-msg">{state.ok}</div>}
    </div>
  );
}
