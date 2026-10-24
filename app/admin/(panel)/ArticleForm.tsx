"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { Article } from "@/lib/types";
import { saveArticle } from "../actions";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ArticleForm({ article }: { article?: Article }) {
  const [state, action, pending] = useActionState(saveArticle, undefined);
  const [imageUrl, setImageUrl] = useState(article?.image ?? "");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  // Start empty and fill on the client so server and browser time zones never disagree.
  const [published, setPublished] = useState("");

  useEffect(() => {
    setPublished(toLocalInput(article?.publishedAt ?? new Date().toISOString()));
  }, [article?.publishedAt]);

  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const preview = filePreview || imageUrl;

  return (
    <form
      className="adm-form"
      onSubmit={(e) => {
        // Submit manually so React does not reset the fields when the server returns an error.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="id" value={article?.id ?? ""} />
      <input type="hidden" name="publishedAt" value={published ? new Date(published).toISOString() : ""} />

      <div className="panel">
        {state?.error && <div className="notice err">{state.error}</div>}
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" className="big" defaultValue={article?.title} required />
        </div>
        <div className="field">
          <label htmlFor="slug">URL slug</label>
          <input id="slug" name="slug" type="text" defaultValue={article?.slug} placeholder="auto-generated-from-title" />
          <div className="hint">Leave blank to generate from the title. Article URL: /news/your-slug</div>
        </div>
        <div className="field">
          <label htmlFor="excerpt">Summary</label>
          <textarea id="excerpt" name="excerpt" rows={3} defaultValue={article?.excerpt} />
          <div className="hint">Shown on cards and in search results. Leave blank to use the first paragraph.</div>
        </div>
        <div className="field">
          <label htmlFor="content">Content</label>
          <textarea id="content" name="content" rows={18} defaultValue={article?.content} required />
          <div className="hint">Separate paragraphs with a blank line.</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div className="panel">
          <div className="field">
            <label>Status</label>
            <div className="seg">
              <label>
                <input type="radio" name="status" value="published" defaultChecked={article?.status !== "draft"} />
                <span>Published</span>
              </label>
              <label>
                <input type="radio" name="status" value="draft" defaultChecked={article?.status === "draft"} />
                <span>Draft</span>
              </label>
            </div>
          </div>
          <div className="field">
            <label htmlFor="publishedLocal">Publish date</label>
            <input
              id="publishedLocal"
              type="datetime-local"
              value={published}
              onChange={(e) => setPublished(e.target.value)}
            />
          </div>
          <label className="check">
            <input type="checkbox" name="featured" defaultChecked={article?.featured} /> Featured (homepage hero)
          </label>
          <label className="check">
            <input type="checkbox" name="trending" defaultChecked={article?.trending} /> Trending (top ticker)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="adm-btn" disabled={pending} style={{ flex: 1, justifyContent: "center" }}>
              {pending ? "Saving..." : article ? "Update" : "Publish"}
            </button>
            <Link href="/admin" className="adm-btn ghost">
              Cancel
            </Link>
          </div>
        </div>

        <div className="panel">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={article?.category ?? ""} required>
              <option value="" disabled>
                Choose...
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="author">Author</label>
            <input id="author" name="author" type="text" defaultValue={article?.author ?? "E24 Desk"} />
          </div>
          <div className="field">
            <label htmlFor="tags">Tags</label>
            <input id="tags" name="tags" type="text" defaultValue={article?.tags.join(", ")} placeholder="kerala, politics" />
            <div className="hint">Comma separated.</div>
          </div>
        </div>

        <div className="panel">
          <div className="field">
            <label>Featured image</label>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="img-preview" />
            ) : (
              <div className="img-preview">No image</div>
            )}
          </div>
          <div className="field">
            <label htmlFor="imageFile">Upload</label>
            <input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFilePreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            <div className="hint">JPG, PNG, WebP, GIF or AVIF up to 5 MB.</div>
          </div>
          <div className="field">
            <label htmlFor="imageUrl">…or image URL</label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </form>
  );
}
