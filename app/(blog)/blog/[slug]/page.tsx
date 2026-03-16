import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPayloadClient } from "@/lib/payload";
import { RichTextRenderer } from "../../_components/RichTextRenderer";
import type { Media as MediaType } from "@/payload-types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getImageUrl(image: MediaType | string | null | undefined): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  return image.url ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayloadClient();

  const posts = await payload.find({
    collection: "posts",
    where: {
      slug: { equals: slug },
      status: { equals: "published" },
    },
    limit: 1,
  });

  const post = posts.docs[0];
  if (!post) {
    return { title: "Post Not Found | Zotion" };
  }

  return {
    title: `${post.title} | Zotion Blog`,
    description: post.excerpt ?? `Read ${post.title} on the Zotion blog.`,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const payload = await getPayloadClient();

  const posts = await payload.find({
    collection: "posts",
    where: {
      slug: { equals: slug },
      status: { equals: "published" },
    },
    limit: 1,
  });

  const post = posts.docs[0];
  if (!post) {
    notFound();
  }

  const coverUrl = getImageUrl(post.coverImage as MediaType | string | null);
  const authorAvatarUrl = getImageUrl(post.authorImage as MediaType | string | null);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Back Link */}
      <Link
        href="/blog"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          {post.category && (
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium capitalize">
              {post.category}
            </span>
          )}
          {post.publishedAt && (
            <span className="text-muted-foreground text-sm">
              {formatDate(post.publishedAt)}
            </span>
          )}
        </div>

        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Author */}
        <div className="border-border flex items-center gap-3 border-b pb-6">
          {authorAvatarUrl ? (
            <Image
              src={authorAvatarUrl}
              alt={post.author}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
              {post.author.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-foreground font-medium">{post.author}</p>
            {post.publishedAt && (
              <p className="text-muted-foreground text-sm">
                {formatDate(post.publishedAt)}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {coverUrl && (
        <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-lg">
          <Image
            src={coverUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="mb-12">
        <RichTextRenderer content={post.content as Parameters<typeof RichTextRenderer>[0]["content"]} />
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="border-border border-t pt-6">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t.id ?? t.tag}
                className="bg-secondary text-secondary-foreground rounded-md px-3 py-1 text-sm"
              >
                {t.tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
