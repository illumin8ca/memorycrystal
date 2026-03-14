import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getAllCategories, getAllPosts } from "../../lib/blog";

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4">
      <span className="text-accent">[ </span>
      {children}
      <span className="text-accent"> ]</span>
    </p>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const posts = getAllPosts();
  const categories = getAllCategories();
  const activeCategory = params.category?.toLowerCase() ?? "all";

  const filteredPosts =
    activeCategory === "all"
      ? posts
      : posts.filter((post) => post.category.toLowerCase() === activeCategory);

  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading>BLOG</BracketHeading>
        <h1 className="font-heading text-5xl md:text-6xl">Practical memory systems for real agents.</h1>
        <p className="mt-4 text-secondary max-w-3xl">
          Guides, architecture notes, and field reports from teams building AI systems that actually remember.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`px-3 py-2 text-xs font-mono uppercase border ${
              activeCategory === "all"
                ? "border-accent text-accent"
                : "border-white/20 text-secondary hover:border-accent hover:text-accent"
            }`}
          >
            All
          </Link>
          {categories.map((category) => {
            const normalized = category.toLowerCase();
            const isActive = normalized === activeCategory;
            return (
              <Link
                key={category}
                href={`/blog?category=${encodeURIComponent(normalized)}`}
                className={`px-3 py-2 text-xs font-mono uppercase border ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-white/20 text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                {category}
              </Link>
            );
          })}
        </div>

        <section className="mt-10 grid gap-5">
          {filteredPosts.map((post) => (
            <article key={post.slug} className="border border-white/10 p-6 bg-black/20">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-wide">
                <span className="text-accent border border-accent/50 px-2 py-1">{post.category}</span>
                <span className="text-secondary">{new Date(post.date).toLocaleDateString()}</span>
                <span className="text-secondary">{post.readTime}</span>
              </div>
              <h2 className="mt-4 font-heading text-3xl leading-tight">
                <Link href={`/blog/${post.slug}`} className="hover:text-accent transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-secondary leading-relaxed">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-5 inline-block font-mono text-xs uppercase tracking-[0.2em] text-accent"
              >
                Read Article →
              </Link>
            </article>
          ))}

          {filteredPosts.length === 0 && (
            <div className="border border-white/10 p-8 text-secondary">No posts found for this category yet.</div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
