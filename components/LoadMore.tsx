"use client";

import { useState, type ReactNode } from "react";
import Icon from "./Icon";

export default function LoadMore({ items, initial = 4, step = 4 }: { items: ReactNode[]; initial?: number; step?: number }) {
  const [n, setN] = useState(initial);
  return (
    <div className="list tight">
      {items.slice(0, n)}
      {n < items.length && (
        <button className="load-more" onClick={() => setN(n + step)}>
          Load more <Icon name="right" size={12} />
        </button>
      )}
    </div>
  );
}
