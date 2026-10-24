"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action}>
      {state?.error && <div className="notice err">{state.error}</div>}
      <div className="field">
        <label htmlFor="user">Username</label>
        <input id="user" name="user" type="text" autoComplete="username" required autoFocus />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={{ width: "100%", border: "1px solid #d5d8de", borderRadius: 6, padding: "9px 11px", fontSize: 14 }}
        />
      </div>
      <button className="adm-btn" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
