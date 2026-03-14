import fs from "node:fs";
import path from "node:path";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

type Frontmatter = {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  author: string;
};

export type BlogPostMeta = Frontmatter & {
  slug: string;
  readTime: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error("Missing frontmatter block in blog post");
  }

  const frontmatterText = match[1];
  const body = raw.slice(match[0].length).trim();

  const getString = (key: string): string => {
    const keyMatch = frontmatterText.match(new RegExp(`^${key}:\\s*\"([^\"]+)\"`, "m"));
    return keyMatch?.[1]?.trim() ?? "";
  };

  const tagsMatch = frontmatterText.match(/^tags:\s*\[(.*?)\]\s*$/m);
  const tags = tagsMatch?.[1]
    ? tagsMatch[1]
        .split(",")
        .map((tag) => tag.trim().replace(/^"|"$/g, ""))
        .filter(Boolean)
    : [];

  return {
    data: {
      title: getString("title"),
      description: getString("description"),
      date: getString("date"),
      category: getString("category"),
      author: getString("author") || "Memory Crystal Team",
      tags,
    },
    content: body,
  };
}

function calculateReadTime(content: string): string {
  const words = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\-\[\]()]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

function listPostFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".mdx"));
}

export function getAllPosts(): BlogPostMeta[] {
  return listPostFiles()
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const filePath = path.join(BLOG_DIR, file);
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = parseFrontmatter(raw);

      return {
        slug,
        ...data,
        readTime: calculateReadTime(content),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = parseFrontmatter(raw);

  return {
    slug,
    ...data,
    content,
    readTime: calculateReadTime(content),
  };
}

export function getAllCategories(): string[] {
  const categories = new Set(getAllPosts().map((post) => post.category));
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

export async function getPostComponent(content: string): Promise<ComponentType> {
  const mod = await evaluate(content, {
    ...runtime,
  });

  return mod.default;
}
