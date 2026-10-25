"use client";

import { useEffect, useState } from "react";
import { bulkDeleteArticles } from "../actions";

const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>("input.bulk-check"));

/**
 * Bulk actions for the articles table. Row checkboxes live in the table and join this
 * form through form="bulk-form". Remount (via key) when the listed rows change.
 */
export default function BulkBar() {
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const update = () => {
      const all = boxes();
      setTotal(all.length);
      setCount(all.filter((b) => b.checked).length);
    };
    update();
    const onChange = (e: Event) => {
      if ((e.target as HTMLElement).classList?.contains("bulk-check")) update();
    };
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, []);

  const toggleAll = (on: boolean) => {
    for (const b of boxes()) b.checked = on;
    setCount(on ? boxes().length : 0);
  };

  return (
    <form
      id="bulk-form"
      className="adm-bulk"
      action={bulkDeleteArticles}
      onSubmit={(e) => {
        const msg = `Delete ${count} article${count === 1 ? "" : "s"}? This cannot be undone.`;
        if (!count || !window.confirm(msg)) e.preventDefault();
      }}
    >
      <label className="check">
        <input
          type="checkbox"
          checked={total > 0 && count === total}
          ref={(el) => {
            if (el) el.indeterminate = count > 0 && count < total;
          }}
          onChange={(e) => toggleAll(e.target.checked)}
          disabled={total === 0}
        />
        Select all on this page
      </label>
      <span className="muted">{count > 0 ? `${count} selected` : ""}</span>
      <button className="adm-btn danger" disabled={count === 0}>
        Delete selected
      </button>
    </form>
  );
}
