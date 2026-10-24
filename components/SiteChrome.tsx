import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { longDate, truncate } from "@/lib/format";
import { getLatest } from "@/lib/store";
import Icon from "./Icon";
import NavBar from "./NavBar";

const SOCIAL = [
  { name: "facebook", href: "https://facebook.com" },
  { name: "instagram", href: "https://instagram.com" },
  { name: "x", href: "https://x.com" },
  { name: "youtube", href: "https://youtube.com" },
  { name: "whatsapp", href: "https://whatsapp.com" },
];

export function TopBar() {
  return (
    <div className="topbar">
      <div className="container">
        <span>{longDate()}</span>
        <div className="links">
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="social">
          {SOCIAL.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noreferrer" aria-label={s.name}>
              <Icon name={s.name} size={15} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <>
      <TopBar />
      <header className="header">
        <div className="container">
          <Link href="/" className="logo" aria-label="E24 News home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="E24 News" />
          </Link>
          <div className="ad-slot">
            <div>
              <b>Advertise with E24 News</b>
              <div className="tag">Reach readers across Kerala &amp; the Gulf</div>
            </div>
            <span>728 × 90</span>
          </div>
        </div>
      </header>
      <NavBar />
    </>
  );
}

export async function Footer() {
  const latest = await getLatest(3);
  return (
    <footer className="footer">
      <div className="container top">
        <div>
          <Link href="/" className="f-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="E24 News" />
          </Link>
          <p>
            E24 News brings you the latest from Kerala, India, the Gulf and the world — politics, community news,
            sports, movies and technology, updated around the clock.
          </p>
          <p>Contact us: info@e24news.com</p>
        </div>
        <div>
          <h4>Latest Posts</h4>
          <div className="f-list">
            {latest.map((a) => (
              <Link key={a.id} href={`/news/${a.slug}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image} alt="" loading="lazy" />
                <span>{truncate(a.title, 60)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4>Categories</h4>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} E24 News. All rights reserved.</span>
          <nav>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
