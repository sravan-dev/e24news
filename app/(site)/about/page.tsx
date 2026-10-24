import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

export default function About() {
  return (
    <div className="container article" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <h1>About E24 News</h1>
      </div>
      <div className="body">
        <p>
          E24 News is a digital news portal covering Kerala, India, the Gulf and the world. Our reporters and
          contributors bring you breaking news, community stories, sports, movies, technology and opinion — around the
          clock.
        </p>
        <p>This page is placeholder content. Update it with your organisation&apos;s story, editorial team and policies.</p>
      </div>
    </div>
  );
}
