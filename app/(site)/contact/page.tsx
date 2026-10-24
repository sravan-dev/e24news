import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  return (
    <div className="container article" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <h1>Contact Us</h1>
      </div>
      <div className="body">
        <p>News tips, advertising and general enquiries: info@e24news.com</p>
        <p>This page is placeholder content. Add your office address, phone numbers and a contact form here.</p>
      </div>
    </div>
  );
}
