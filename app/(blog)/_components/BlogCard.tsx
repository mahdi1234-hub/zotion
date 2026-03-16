import Image from "next/image";
import Link from "next/link";
import type { Media as MediaType } from "@/payload-types";

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: MediaType | string | null;
  author: string;
  authorImage?: MediaType | string | null;
  category?: string | null;
  publishedAt?: string | null;
  tags?: Array<{ tag: string; id?: string | null }> | null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCoverUrl(coverImage: MediaType | string | null | undefined): string | null {
  if (!coverImage) return null;
  if (typeof coverImage === "string") return coverImage;
  return coverImage.url ?? null;
}

function getAuthorImageUrl(authorImage: MediaType | string | null | undefined): string | null {
  if (!authorImage) return null;
  if (typeof authorImage === "string") return authorImage;
  return authorImage.url ?? null;
}

export const BlogCard = ({
  title,
  slug,
  excerpt,
  coverImage,
  author,
  authorImage,
  category,
  publishedAt,
  tags,
}: BlogCardProps) => {
  const coverUrl = getCoverUrl(coverImage);
  const avatarUrl = getAuthorImageUrl(authorImage);

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="bg-card border-border hover:border-primary/20 overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md">
        {coverUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="bg-muted flex aspect-[16/9] w-full items-center justify-center">
            <svg
              className="text-muted-foreground h-12 w-12"
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
          </div>
        )}

        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            {category && (
              <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                {category}
              </span>
            )}
            {publishedAt && (
              <span className="text-muted-foreground text-xs">
                {formatDate(publishedAt)}
              </span>
            )}
          </div>

          <h3 className="text-foreground mb-2 line-clamp-2 text-lg font-semibold leading-tight group-hover:underline">
            {title}
          </h3>

          {excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-relaxed">
              {excerpt}
            </p>
          )}

          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={author}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                {author.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-muted-foreground text-sm">{author}</span>
          </div>

          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((t) => (
                <span
                  key={t.id ?? t.tag}
                  className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs"
                >
                  {t.tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};
