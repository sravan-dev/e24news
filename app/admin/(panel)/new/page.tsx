import { getCategories } from "@/lib/categories";
import ArticleForm from "../ArticleForm";

export default async function NewArticle() {
  const categories = await getCategories();
  return (
    <>
      <div className="adm-head">
        <h1>Add news</h1>
      </div>
      <ArticleForm categories={categories} />
    </>
  );
}
