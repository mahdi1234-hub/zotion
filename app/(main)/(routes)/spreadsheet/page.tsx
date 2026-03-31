"use client";

import React, { useRef } from "react";
import { SpreadsheetGrid } from "@/components/spreadsheet/spreadsheet-grid";
import { SpreadsheetToolbar } from "@/components/spreadsheet/spreadsheet-toolbar";
import { SheetTabs } from "@/components/spreadsheet/sheet-tabs";
import { SpreadsheetAiChat, SpreadsheetAiChatRef } from "@/components/spreadsheet/spreadsheet-ai-chat";
import { SpreadsheetDashboard } from "@/components/spreadsheet/spreadsheet-dashboard";
import { useSpreadsheetStore } from "@/lib/spreadsheet-store";

export default function SpreadsheetPage() {
  const { showDashboard } = useSpreadsheetStore();
  const aiChatRef = useRef<SpreadsheetAiChatRef>(null);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#e2e3e3] bg-white px-4 py-2">
        <div className="flex h-10 w-10 items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58" />
            <rect x="6" y="6" width="5" height="3" rx="0.5" fill="white" />
            <rect x="13" y="6" width="5" height="3" rx="0.5" fill="white" opacity="0.7" />
            <rect x="6" y="10.5" width="5" height="3" rx="0.5" fill="white" opacity="0.7" />
            <rect x="13" y="10.5" width="5" height="3" rx="0.5" fill="white" opacity="0.5" />
            <rect x="6" y="15" width="5" height="3" rx="0.5" fill="white" opacity="0.5" />
            <rect x="13" y="15" width="5" height="3" rx="0.5" fill="white" opacity="0.3" />
          </svg>
        </div>
        <div className="flex flex-col">
          <h1 className="text-[15px] font-medium text-[#202124]">Zotion Sheets</h1>
          <p className="text-[11px] text-[#5f6368]">AI-Powered Spreadsheet</p>
        </div>
      </div>

      {/* Toolbar */}
      <SpreadsheetToolbar />

      {/* Main content - either spreadsheet or dashboard */}
      {showDashboard ? (
        <SpreadsheetDashboard />
      ) : (
        <>
          <SpreadsheetGrid onOpenAiChat={(msg) => aiChatRef.current?.openWithMessage(msg || "")} />
          <SheetTabs />
        </>
      )}

      {/* AI Chat */}
      <SpreadsheetAiChat ref={aiChatRef} />
    </div>
  );
}
