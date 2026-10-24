import { getCategories } from "@/lib/categories";
import { hasSecretKey } from "@/lib/supabase";
import { stats } from "@/lib/store";
import CategoryRow from "./CategoryRow";

export default async function CategoriesPage() {
  if (!hasSecretKey()) return null; // layout shows setup steps
  const [categories, s] = await Promise.all([getCategories(), stats()]);

  return (
    <>
      <div className="adm-head">
        <h1>Categories</h1>
      </div>

      <div className="adm-table-wrap" style={{ marginBottom: 22 }}>
        <div className="cat-head">Add category</div>
        <CategoryRow />
      </div>

      <div className="adm-table-wrap">
        <div className="cat-head cat-cols">
          <span>Colour</span>
          <span>Name</span>
          <span>Slug (URL)</span>
          <span>Order</span>
          <span />
        </div>
        {categories.map((c) => (
          // Key on slug + updated values so the row resets after a save.
          <CategoryRow key={`${c.slug}-${c.name}-${c.color}-${c.sortOrder}-${c.showInMenu}`} category={c} count={s.byCategory[c.slug] ?? 0} />
        ))}
        {categories.length === 0 && <p style={{ padding: 20, color: "#6b7280" }}>No categories yet.</p>}
      </div>
      <p className="hint" style={{ color: "#6b7280", fontSize: 13, marginTop: 14 }}>
        Lower order numbers appear first in the menu. Untick &ldquo;Menu&rdquo; to hide a category from the menu and
        footer while keeping its page. Changing a slug moves its articles too; old links to /category/old-slug stop
        working. A category can only be deleted when it has no articles. Home page sections (Qatar, Gulf, World, Grama
        Vartha, Tech, Movies, Sports) follow these slugs.
      </p>
    </>
  );
}
