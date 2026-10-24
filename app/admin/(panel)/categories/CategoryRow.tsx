"use client";

import { startTransition, useActionState } from "react";
import type { Category } from "@/lib/types";
import { removeCategory, saveCategory } from "../../actions";

/** One editable category (or the "add new" form when `category` is undefined). */
export default function CategoryRow({ category, count = 0 }: { category?: Category; count?: number }) {
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
      {!isNew && (
        <form
          action={del}
          onSubmit={(e) => {
            if (!window.confirm(`Delete category "${category.name}"?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="slug" value={category.slug} />
          <button
            className="adm-btn danger"
            disabled={deleting || count > 0}
            title={count > 0 ? "Move or delete its articles first" : "Delete category"}
          >
            Delete
          </button>
        </form>
      )}
      {state?.error && <div className="notice err cat-msg">{state.error}</div>}
      {state?.ok && !state.error && <div className="notice ok cat-msg">{state.ok}</div>}
    </div>
  );
}
