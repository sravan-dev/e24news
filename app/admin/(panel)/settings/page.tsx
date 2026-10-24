import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { hasSecretKey } from "@/lib/supabase";
import { listUsers, MIN_PASSWORD, usingEnvAccount } from "@/lib/users";
import { AddUserForm, ChangePasswordForm, UserRow } from "./forms";

export default async function SettingsPage() {
  if (!hasSecretKey()) return null; // layout shows setup steps
  const me = await requireAdmin();
  const [users, envOnly] = await Promise.all([listUsers(), usingEnvAccount()]);

  return (
    <>
      <div className="adm-head">
        <h1>Settings</h1>
      </div>

      {envOnly && (
        <div className="notice" style={{ background: "#fff4e5", color: "#8a5200", maxWidth: 760 }}>
          You&apos;re signed in with the account from the environment variables (<code>ADMIN_USER</code> /{" "}
          <code>ADMIN_PASSWORD</code>). Changing your password or adding a user saves accounts in the database; after
          that the environment credentials no longer work.
        </div>
      )}

      <div className="set-grid">
        <section className="adm-card">
          <h2>Change your password</h2>
          <p className="set-sub">
            Signed in as <b>{me}</b>. At least {MIN_PASSWORD} characters. Other devices are signed out.
          </p>
          <ChangePasswordForm username={me} />
        </section>

        <section className="adm-card">
          <h2>Add user</h2>
          <p className="set-sub">New users get full admin access.</p>
          <AddUserForm />
        </section>
      </div>

      <div className="adm-table-wrap" style={{ marginTop: 22, maxWidth: 1000 }}>
        <div className="cat-head">Admin users</div>
        {users.map((u) => (
          <UserRow
            key={`${u.id}-${u.updatedAt}`}
            username={u.username}
            meta={`Added ${formatDate(u.createdAt)}`}
            isMe={u.username === me}
          />
        ))}
        {users.length === 0 && (
          <p style={{ padding: 20, color: "#6b7280" }}>
            No stored users yet — only the environment account <b>{me}</b>.
          </p>
        )}
      </div>
    </>
  );
}
