import { Footer, Header } from "@/components/SiteChrome";
import ToTop from "@/components/ToTop";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <ToTop />
    </>
  );
}
