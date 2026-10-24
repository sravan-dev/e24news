"use client";

import { useState, type ReactNode } from "react";
import Icon from "./Icon";

// Shows one pre-rendered page at a time with prev/next arrows (like the design's block pagers).
export default function PagedBlock({ pages }: { pages: ReactNode[] }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div key={i} style={{ animation: "fadeIn .35s ease" }}>
        {pages[i]}
      </div>
      {pages.length > 1 && (
        <div className="pager-arrows">
          <button className="arrow-btn" aria-label="Previous" disabled={i === 0} onClick={() => setI(i - 1)}>
            <Icon name="left" />
          </button>
          <button className="arrow-btn" aria-label="Next" disabled={i === pages.length - 1} onClick={() => setI(i + 1)}>
            <Icon name="right" />
          </button>
        </div>
      )}
    </div>
  );
}
