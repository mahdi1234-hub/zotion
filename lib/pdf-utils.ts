"use client";

import * as pdfjsLib from "pdfjs-dist";

let workerInitialized = false;

function initWorker() {
  if (workerInitialized) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  workerInitialized = true;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  initWorker();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  const maxPages = Math.min(pdf.numPages, 5);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    text += pageText + "\n";
  }
  return text;
}

export async function generateThumbnail(
  file: File,
  width: number = 400,
): Promise<string | null> {
  try {
    initWorker();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
    }).promise;

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
