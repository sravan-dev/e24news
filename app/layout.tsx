import type { Metadata } from "next";
import { Open_Sans, Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open" });

export const metadata: Metadata = {
  title: { default: "E24 News — Latest Kerala, Gulf, India & World News", template: "%s | E24 News" },
  description: "E24 News: breaking news from Kerala, the Gulf, India and around the world.",
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
