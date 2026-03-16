"use client";

import { useState } from "react";

interface PdfViewerProps {
  file: File;
}

export function PdfViewer({ file }: PdfViewerProps) {
  const [objectUrl] = useState(() => URL.createObjectURL(file));

  return (
    <div className="flex flex-col items-center">
      <div className="bg-muted/30 relative w-full overflow-hidden rounded-lg min-h-[500px]">
        <iframe
          src={objectUrl + "#toolbar=0"}
          className="h-[500px] w-full border-0"
          title="PDF Preview"
        />
      </div>
    </div>
  );
}
