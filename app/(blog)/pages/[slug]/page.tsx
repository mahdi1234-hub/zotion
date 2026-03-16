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

function getImageUrl(image: MediaType | string | null | undefined): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  return image.url ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayloadClient();

  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: { equals: slug },
      status: { equals: "published" },
    },
    limit: 1,
  });

  const page = pages.docs[0];
  if (!page) {
    return { title: "Page Not Found | Zotion" };
  }

  return {
    title: `${page.title} | Zotion`,
  };
}

export default async function PageDetailPage({ params }: Props) {
  const { slug } = await params;
  const payload = await getPayloadClient();

  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: { equals: slug },
      status: { equals: "published" },
    },
    limit: 1,
  });

  const page = pages.docs[0];
  if (!page) {
    notFound();
  }

  const coverUrl = getImageUrl(page.coverImage as MediaType | string | null);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Back Link */}
      <Link
        href="/pages"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pages
      </Link>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {page.title}
        </h1>
        {page.publishedAt && (
          <p className="text-muted-foreground border-border border-b pb-6 text-sm">
            Last updated{" "}
            {new Date(page.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </header>

      {/* Cover Image */}
      {coverUrl && (
        <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-lg">
          <Image
            src={coverUrl}
            alt={page.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="mb-12">
        <RichTextRenderer content={page.content as Parameters<typeof RichTextRenderer>[0]["content"]} />
      </div>
    </article>
  );
}
