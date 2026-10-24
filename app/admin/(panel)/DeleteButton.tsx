"use client";

import { removeArticle } from "../actions";

export default function DeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={removeArticle}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="adm-btn danger">Delete</button>
    </form>
  );
}
