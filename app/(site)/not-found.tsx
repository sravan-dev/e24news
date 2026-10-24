import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container empty">
      <h1 style={{ fontSize: 64 }}>404</h1>
      <p>Sorry, that page could not be found.</p>
      <Link href="/" className="btn" style={{ marginTop: 16 }}>
        Back to home
      </Link>
    </div>
  );
}
