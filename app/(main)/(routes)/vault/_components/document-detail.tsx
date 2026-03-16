"use client";

import { X, Download, Copy, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/document-store";
import type { VaultDocument } from "@/lib/document-store";
import { PdfViewer } from "./pdf-viewer";
import { toast } from "sonner";

interface DocumentDetailProps {
  document: VaultDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
}

export function DocumentDetail({
  document,
  open,
  onOpenChange,
  onDelete,
  onRemoveTag,
}: DocumentDetailProps) {
  if (!document) return null;

  const handleDownload = () => {
    const url = URL.createObjectURL(document.file);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(document.description);
      toast.success("Description copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDelete = () => {
    onDelete(document.id);
    onOpenChange(false);
    toast.success("Document deleted");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold pr-8">
            {document.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PdfViewer file={document.file} />

          <div className="space-y-3">
            <div>
              <h4 className="text-foreground mb-1 text-sm font-medium">Description</h4>
              <p className="text-muted-foreground text-sm">{document.description}</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Size: {formatFileSize(document.fileSize)}</span>
              <span>Type: {document.fileType.toUpperCase()}</span>
              <span>
                Uploaded:{" "}
                {new Date(document.uploadDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div>
              <h4 className="text-foreground mb-2 text-sm font-medium">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {document.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => onRemoveTag(document.id, tag)}
                      className="hover:bg-muted rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-1 h-4 w-4" />
                Copy
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
