"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "All news" },
  { href: "/admin/new", label: "Add news" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/", label: "View site ↗", external: true },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          target={l.external ? "_blank" : undefined}
          className={!l.external && (path === l.href || (l.href !== "/admin" && path.startsWith(l.href))) ? "on" : ""}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
