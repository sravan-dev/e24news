import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockTitle, CardV, OverlayCard } from "@/components/cards";
import Pagination from "@/components/Pagination";
import Sidebar from "@/components/Sidebar";
import { getCategory } from "@/lib/categories";
import { listArticles } from "@/lib/store";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;
const TOP = 3;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCategory((await params).slug);
  return { title: cat ? `${cat.name} News` : "Category" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1);

  // First three posts go in the overlay band on page 1 when there are enough of them.
  const { total } = await listArticles({ category: slug, limit: 0 });
  const useBand = total > TOP;
  const top = useBand && page === 1 ? (await listArticles({ category: slug, limit: TOP })).items : [];
  const skip = useBand ? TOP : 0;
  const { items } = await listArticles({ category: slug, limit: PER_PAGE, offset: skip + (page - 1) * PER_PAGE });
  const pages = Math.max(1, Math.ceil((total - skip) / PER_PAGE));

  return (
    <div className="container">
      <div className="breadcrumbs">
        <Link href="/">Home</Link> › <span>{cat.name}</span>
      </div>
      <div className="page-head">
        <h1>{cat.name}</h1>
      </div>

      {top.length > 0 && (
        <div className="triple-band" style={{ marginBottom: 50 }}>
          {top.map((a) => (
            <OverlayCard key={a.id} a={a} size="md" titleMax={70} />
          ))}
        </div>
      )}

      <div className="with-sidebar">
        <section>
          <BlockTitle title={`Latest in ${cat.name}`} category={slug} />
          {total === 0 ? (
            <p className="empty">No news in this category yet.</p>
          ) : (
            <div className="grid-2">
              {items.map((a) => (
                <CardV key={a.id} a={a} size="md" excerpt={140} titleMax={80} />
              ))}
            </div>
          )}
          <Pagination page={page} pages={pages} base={`/category/${slug}`} />
        </section>
        <Sidebar full={false} />
      </div>
    </div>
  );
}
