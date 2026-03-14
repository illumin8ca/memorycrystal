import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getAllPosts, getPostBySlug, getPostComponent } from "../../../lib/blog";

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const MDXContent = await getPostComponent(post.content);

  return (
    <div className="min-h-screen bg-[#090909] text-primary">
      <Header />
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <Link href="/blog" className="font-mono text-xs tracking-[0.2em] uppercase text-[#0066ff]">
          ← Back to Blog
        </Link>

        <header className="mt-6 border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-wide">
            <span className="text-[#0066ff] border border-[#0066ff]/50 px-2 py-1">{post.category}</span>
            <span className="text-secondary">{new Date(post.date).toLocaleDateString()}</span>
            <span className="text-secondary">{post.readTime}</span>
            <span className="text-secondary">{post.author || "Memory Crystal Team"}</span>
          </div>
          <h1 className="mt-4 font-heading text-4xl md:text-5xl leading-tight">{post.title}</h1>
          <p className="mt-4 text-secondary text-lg">{post.description}</p>
        </header>

        <article className="mt-10 leading-8 text-primary [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-3xl [&_h2]:font-heading [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-2xl [&_h3]:font-heading [&_p]:my-5 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-2 [&_a]:text-[#0066ff] [&_a]:underline [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-white/20 [&_pre]:bg-black [&_pre]:p-4 [&_pre]:text-sm [&_pre]:font-mono [&_code]:font-mono [&_blockquote]:border-l-2 [&_blockquote]:border-[#0066ff] [&_blockquote]:pl-4 [&_blockquote]:text-secondary">
          <MDXContent />
        </article>
      </main>
      <Footer />
    </div>
  );
}
