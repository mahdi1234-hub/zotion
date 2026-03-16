import type { Metadata } from "next";
import { getPayloadClient } from "@/lib/payload";
import { PageCard } from "../_components/PageCard";
import type { Media as MediaType } from "@/payload-types";

export const metadata: Metadata = {
  title: "Pages | Zotion",
  description: "Browse all published pages.",
};

export const dynamic = "force-dynamic";

export default async function PagesListPage() {
  const payload = await getPayloadClient();

  const pages = await payload.find({
    collection: "pages",
    where: {
      status: { equals: "published" },
    },
    sort: "-updatedAt",
    limit: 50,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-foreground mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Pages
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Browse published pages from Zotion.
        </p>
      </div>

      {/* Pages List */}
      {pages.docs.length > 0 ? (
        <div className="space-y-3">
          {pages.docs.map((page) => (
            <PageCard
              key={page.id}
              title={page.title}
              slug={page.slug}
              coverImage={page.coverImage as MediaType | string | null}
              updatedAt={page.updatedAt}
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-foreground mb-2 text-xl font-semibold">No pages yet</h2>
          <p className="text-muted-foreground text-sm">
            Check back soon for new content.
          </p>
        </div>
      )}
    </div>
  );
}
