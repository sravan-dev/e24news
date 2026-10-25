export type ArticleStatus = "published" | "draft";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // paragraphs separated by blank lines
  image: string;
  category: string; // category slug
  author: string;
  tags: string[];
  featured: boolean;
  trending: boolean;
  status: ArticleStatus;
  views: number;
  publishedAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Category {
  slug: string;
  name: string;
  color: string;
  sortOrder: number;
  showInMenu: boolean;
}

export type AdPlacement = "sidebar" | "inline" | "header";

export interface Ad {
  id: string;
  title: string;
  image: string;
  linkUrl: string;
  placement: AdPlacement;
  active: boolean;
}
