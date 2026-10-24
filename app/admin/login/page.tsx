import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");
  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="E24 News" />
        </div>
        <h1>Admin sign in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
