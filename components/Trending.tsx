"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";

export default function Trending({ items }: { items: { title: string; href: string }[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [paused, items.length]);

  if (!items.length) return null;
  const cur = items[i];
  return (
    <div className="trending" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <span className="label">Trending Now</span>
      <Link key={i} href={cur.href} className="item">
        {cur.title}
      </Link>
      <div className="arrows">
        <button className="arrow-btn" aria-label="Previous" onClick={() => setI((i - 1 + items.length) % items.length)}>
          <Icon name="left" />
        </button>
        <button className="arrow-btn" aria-label="Next" onClick={() => setI((i + 1) % items.length)}>
          <Icon name="right" />
        </button>
      </div>
    </div>
  );
}
