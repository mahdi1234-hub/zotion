import type { Metadata } from "next";
import { getPayloadClient } from "@/lib/payload";
import { BlogCard } from "../_components/BlogCard";
import type { Media as MediaType } from "@/payload-types";

export const metadata: Metadata = {
  title: "Blog | Zotion",
  description: "Read the latest posts from the Zotion team.",
};

export const dynamic = "force-dynamic";

export default async function BlogListPage() {
  const payload = await getPayloadClient();

  const posts = await payload.find({
    collection: "posts",
    where: {
      status: { equals: "published" },
    },
    sort: "-publishedAt",
    limit: 50,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-foreground mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Blog
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Insights, updates, and stories from the Zotion team.
        </p>
      </div>

      {/* Posts Grid */}
      {posts.docs.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.docs.map((post) => (
            <BlogCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              coverImage={post.coverImage as MediaType | string | null}
              author={post.author}
              authorImage={post.authorImage as MediaType | string | null}
              category={post.category}
              publishedAt={post.publishedAt}
              tags={post.tags}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <svg
            className="text-muted-foreground mb-4 h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
          <p className="text-muted-foreground text-sm">
            Check back soon for new content.
          </p>
        </div>
      )}
    </div>
  );
}
