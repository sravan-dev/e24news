import { hasSecretKey } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/categories";
import { getArticleById } from "@/lib/store";
import ArticleForm from "../../ArticleForm";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSecretKey()) return null; // layout shows setup steps
  const [article, categories] = await Promise.all([getArticleById((await params).id), getCategories()]);
  if (!article) notFound();
  return (
    <>
      <div className="adm-head">
        <h1>Edit news</h1>
        <Link href={`/news/${article.slug}`} target="_blank" className="adm-btn ghost">
          View on site ↗
        </Link>
      </div>
      <ArticleForm key={article.updatedAt} article={article} categories={categories} />
    </>
  );
}
