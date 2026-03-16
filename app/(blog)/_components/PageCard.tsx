import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import type { Media as MediaType } from "@/payload-types";

interface PageCardProps {
  title: string;
  slug: string;
  coverImage?: MediaType | string | null;
  updatedAt: string;
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

export const PageCard = ({ title, slug, coverImage, updatedAt }: PageCardProps) => {
  const coverUrl = getCoverUrl(coverImage);

  return (
    <Link href={`/pages/${slug}`} className="group block">
      <article className="bg-card border-border hover:border-primary/20 flex items-center gap-4 rounded-lg border p-4 transition-all duration-200 hover:shadow-md">
        {coverUrl ? (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="bg-muted flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md">
            <FileText className="text-muted-foreground h-8 w-8" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-foreground truncate text-base font-semibold group-hover:underline">
            {title}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Updated {formatDate(updatedAt)}
          </p>
        </div>

        <svg
          className="text-muted-foreground h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </article>
    </Link>
  );
};
