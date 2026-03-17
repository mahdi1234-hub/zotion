"use client";

import React, { useState } from "react";
import { useSpreadsheetStore } from "@/lib/spreadsheet-store";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SheetTabs() {
  const { sheets, activeSheetId, setActiveSheet, addSheet, removeSheet, renameSheet } =
    useSpreadsheetStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabName, setTabName] = useState("");

  const handleDoubleClick = (id: string, name: string) => {
    setEditingTabId(id);
    setTabName(name);
  };

  const handleRenameSubmit = (id: string) => {
    if (tabName.trim()) {
      renameSheet(id, tabName.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="flex items-center border-t border-[#e2e3e3] bg-[#f8f9fa] px-1">
      <button
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#444746] hover:bg-[#e8eaed]"
        onClick={addSheet}
        title="Add sheet"
      >
        <Plus className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-0.5 overflow-x-auto px-1">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={cn(
              "group flex h-8 cursor-pointer items-center gap-1 rounded-t-md border border-b-0 px-3 text-[12px] font-medium transition-colors",
              activeSheetId === sheet.id
                ? "border-[#e2e3e3] bg-white text-[#202124]"
                : "border-transparent text-[#444746] hover:bg-[#e8eaed]"
            )}
            onClick={() => setActiveSheet(sheet.id)}
            onDoubleClick={() => handleDoubleClick(sheet.id, sheet.name)}
          >
            {editingTabId === sheet.id ? (
              <input
                className="w-20 border-none bg-transparent text-[12px] outline-none"
                value={tabName}
                onChange={(e) => setTabName(e.target.value)}
                onBlur={() => handleRenameSubmit(sheet.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit(sheet.id);
                }}
                autoFocus
              />
            ) : (
              <>
                <span>{sheet.name}</span>
                {sheets.length > 1 && (
                  <button
                    className="hidden h-4 w-4 items-center justify-center rounded-full text-[#444746] hover:bg-[#dadce0] group-hover:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSheet(sheet.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
