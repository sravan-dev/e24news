import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { hasSecretKey } from "@/lib/supabase";
import { logout } from "../actions";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/admin" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="E24 News" />
        </Link>
        <AdminNav />
        <div className="who">
          <span>
            Signed in as <b style={{ color: "#fff" }}>{user}</b>
          </span>
          <form action={logout}>
            <button>Log out</button>
          </form>
        </div>
      </aside>
      <main className="adm-main">
        {hasSecretKey() ? (
          children
        ) : (
          <div className="adm-card" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 20, marginBottom: 10 }}>Connect the Supabase secret key</h1>
            <p>The admin panel needs the project&apos;s secret key to manage news.</p>
            <ol style={{ lineHeight: 1.9 }}>
              <li>Open Supabase → project <b>e24news</b> → Project Settings → API Keys.</li>
              <li>Copy the <b>secret</b> key (starts with <code>sb_secret_</code>).</li>
              <li>
                Paste it into <code>.env.local</code> as <code>SUPABASE_SECRET_KEY=...</code> and restart the server.
              </li>
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
