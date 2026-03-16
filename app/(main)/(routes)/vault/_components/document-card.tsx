"use client";

import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/document-store";
import type { VaultDocument } from "@/lib/document-store";

interface DocumentCardProps {
  document: VaultDocument;
  onClick: () => void;
}

export function DocumentCard({ document, onClick }: DocumentCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className="bg-background group cursor-pointer overflow-hidden rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="bg-muted/50 relative flex h-48 items-center justify-center overflow-hidden">
        {document.thumbnailUrl ? (
          <img
            src={document.thumbnailUrl}
            alt={document.title}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <FileText className="text-muted-foreground/40 h-16 w-16" />
        )}
        <div className="absolute right-2 bottom-2">
          <span className="bg-background/90 text-foreground rounded px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
            {formatFileSize(document.fileSize)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-foreground mb-1 truncate text-sm font-semibold">
          {document.title}
        </h3>
        <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">
          {document.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {document.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {tag}
            </Badge>
          ))}
          {document.tags.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{document.tags.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
