"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, SlidersHorizontal, Calendar, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { extractTextFromPdf, generateThumbnail } from "@/lib/pdf-utils";
import {
  generateTags,
  generateDescription,
  generateTitle,
  generateId,
  type VaultDocument,
} from "@/lib/document-store";
import { UploadZone } from "./_components/upload-zone";
import { DocumentCard } from "./_components/document-card";
import { DocumentDetail } from "./_components/document-detail";

export default function VaultPage() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<VaultDocument | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const doc of documents) {
      for (const tag of doc.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    let result = documents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.description.toLowerCase().includes(q) ||
          doc.tags.some((t) => t.toLowerCase().includes(q)) ||
          doc.name.toLowerCase().includes(q),
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((doc) => new Date(doc.uploadDate) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((doc) => new Date(doc.uploadDate) <= to);
    }

    if (selectedTags.length > 0) {
      result = result.filter((doc) =>
        selectedTags.some((tag) => doc.tags.includes(tag)),
      );
    }

    return result;
  }, [documents, searchQuery, dateFrom, dateTo, selectedTags]);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await extractTextFromPdf(file);
      const tags = generateTags(text, file.name);
      const description = generateDescription(text, file.name);
      const title = generateTitle(text, file.name);
      const thumbnail = await generateThumbnail(file);

      const doc: VaultDocument = {
        id: generateId(),
        name: file.name,
        title,
        description,
        tags,
        fileSize: file.size,
        fileType: file.name.split(".").pop() || "pdf",
        uploadDate: new Date().toISOString(),
        thumbnailUrl: thumbnail,
        fileUrl: URL.createObjectURL(file),
        file,
      };

      setDocuments((prev) => [doc, ...prev]);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDeleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  const handleRemoveTag = useCallback((id: string, tag: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, tags: doc.tags.filter((t) => t !== tag) } : doc,
      ),
    );
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setDateFrom("");
    setDateTo("");
    setSelectedTags([]);
  }, []);

  const hasActiveFilters = dateFrom || dateTo || selectedTags.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Document Vault</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload, preview, and manage your PDF documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Find anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="mr-1 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary-foreground text-primary ml-1 rounded-full px-1.5 text-xs">
                  !
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter Sidebar */}
        {showFilters && (
          <div className="border-r w-64 shrink-0 overflow-y-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-semibold">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Date Range
              </div>
              <div className="space-y-1.5">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="To"
                />
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Zone */}
          <div className="mb-6">
            <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
          </div>

          {/* Document Grid */}
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onClick={() => {
                    setSelectedDocument(doc);
                    setDetailOpen(true);
                  }}
                />
              ))}
            </div>
          ) : documents.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="text-muted-foreground/40 mb-4 h-12 w-12" />
              <p className="text-muted-foreground text-sm">No documents match your search</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-sm">
                Upload a PDF to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Document Detail Modal */}
      <DocumentDetail
        document={selectedDocument}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDelete={handleDeleteDocument}
        onRemoveTag={handleRemoveTag}
      />
    </div>
  );
}
