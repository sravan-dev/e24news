"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import Icon from "./Icon";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const links = [{ href: "/", name: "Home" }, ...CATEGORIES.map((c) => ({ href: `/category/${c.slug}`, name: c.name }))];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="nav">
      <div className="container" style={{ position: "relative" }}>
        <button className="icon-btn burger" aria-label="Menu" onClick={() => setOpen(!open)}>
          <Icon name={open ? "close" : "menu"} size={22} />
        </button>
        <ul className={open ? "open" : ""}>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={isActive(l.href) ? "active" : ""} onClick={() => setOpen(false)}>
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="nav-tools">
          <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}>
            <Icon name={searchOpen ? "close" : "search"} size={18} />
          </button>
        </div>
        {searchOpen && (
          <form
            className="search-pop"
            onSubmit={(e) => {
              e.preventDefault();
              if (!q.trim()) return;
              setSearchOpen(false);
              router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search news..." />
            <button className="btn" type="submit">Search</button>
          </form>
        )}
      </div>
    </nav>
  );
}
