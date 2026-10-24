"use client";

import { startTransition, useActionState, useState } from "react";
import { addUser, changeOwnPassword, removeUser, resetUserPassword, type FormState } from "../../actions";

function Message({ state }: { state: FormState }) {
  if (state?.error) return <div className="notice err">{state.error}</div>;
  if (state?.ok) return <div className="notice ok">{state.ok}</div>;
  return null;
}

function PasswordFields({ label = "New password" }: { label?: string }) {
  return (
    <>
      <div className="field">
        <label>
          {label}
          <input name="password" type="password" autoComplete="new-password" required minLength={10} />
        </label>
      </div>
      <div className="field">
        <label>
          Repeat {label.toLowerCase()}
          <input name="confirm" type="password" autoComplete="new-password" required minLength={10} />
        </label>
      </div>
    </>
  );
}

export function ChangePasswordForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState(changeOwnPassword, undefined);
  return (
    <form action={action} className="set-form">
      <Message state={state} />
      {/* Lets password managers attach the new password to the right account. */}
      <input type="text" name="username" value={username} autoComplete="username" readOnly hidden />
      <div className="field">
        <label>
          Current password
          <input name="current" type="password" autoComplete="current-password" required />
        </label>
      </div>
      <PasswordFields />
      <button className="adm-btn" disabled={pending}>
        {pending ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}

export function AddUserForm() {
  const [state, action, pending] = useActionState(addUser, undefined);
  return (
    <form action={action} className="set-form">
      <Message state={state} />
      <div className="field">
        <label>
          Username
          <input name="username" type="text" autoComplete="off" required minLength={3} maxLength={64} />
        </label>
      </div>
      <PasswordFields label="Password" />
      <button className="adm-btn" disabled={pending}>
        {pending ? "Adding..." : "Add user"}
      </button>
    </form>
  );
}

/** One stored admin: reset their password or delete them. */
export function UserRow({ username, meta, isMe }: { username: string; meta: string; isMe: boolean }) {
  const [resetting, setResetting] = useState(false);
  const [resetState, reset, saving] = useActionState(resetUserPassword, undefined);
  const [delState, del, deleting] = useActionState(removeUser, undefined);
  const state = delState ?? resetState;

  return (
    <div className="cat-row user-row">
      <div className="user-name">
        <b>{username}</b>
        {isMe && <span className="pill pub">You</span>}
        <small>{meta}</small>
      </div>
      {!resetting && (
        <button className="adm-btn ghost" type="button" onClick={() => setResetting(true)}>
          Reset password
        </button>
      )}
      {!isMe && (
        <button
          className="adm-btn danger"
          type="button"
          disabled={deleting}
          onClick={() => {
            if (!window.confirm(`Delete admin user "${username}"? They will be signed out immediately.`)) return;
            const data = new FormData();
            data.set("username", username);
            startTransition(() => del(data));
          }}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      )}
      {resetting && (
        <form className="user-reset" action={reset}>
          <input type="hidden" name="username" value={username} />
          <input name="password" type="password" placeholder="New password" aria-label="New password" autoComplete="new-password" required minLength={10} />
          <input name="confirm" type="password" placeholder="Repeat password" aria-label="Repeat password" autoComplete="new-password" required minLength={10} />
          <button className="adm-btn" disabled={saving}>
            {saving ? "Saving..." : "Set password"}
          </button>
          <button className="adm-btn ghost" type="button" onClick={() => setResetting(false)}>
            Cancel
          </button>
        </form>
      )}
      {state?.error && <div className="notice err cat-msg">{state.error}</div>}
      {state?.ok && !state.error && <div className="notice ok cat-msg">{state.ok}</div>}
    </div>
  );
}
