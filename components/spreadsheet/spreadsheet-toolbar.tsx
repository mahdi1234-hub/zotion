"use client";

import React from "react";
import { useSpreadsheetStore } from "@/lib/spreadsheet-store";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Paintbrush,
  Type,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SpreadsheetToolbar() {
  const {
    selectedCell,
    setCellFormat,
    getActiveSheet,
    getCellDisplay,
    setShowDashboard,
    showDashboard,
  } = useSpreadsheetStore();

  const sheet = getActiveSheet();
  const cellData = selectedCell ? sheet.cells[selectedCell] : null;
  const cellFormula = cellData?.formula || cellData?.value || "";

  const toggleFormat = (key: "bold" | "italic" | "underline") => {
    if (!selectedCell) return;
    const current = cellData?.format?.[key] || false;
    setCellFormat(selectedCell, { [key]: !current });
  };

  const setAlign = (align: "left" | "center" | "right") => {
    if (!selectedCell) return;
    setCellFormat(selectedCell, { textAlign: align });
  };

  return (
    <div className="flex flex-col border-b border-[#e2e3e3] bg-[#f8f9fa]">
      {/* Menu bar */}
      <div className="flex items-center gap-1 border-b border-[#e2e3e3] px-2 py-1 text-[13px] text-[#444746]">
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">File</span>
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">Edit</span>
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">View</span>
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">Insert</span>
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">Format</span>
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">Data</span>
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">Tools</span>
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">Extensions</span>
        <span className="cursor-pointer rounded px-2 py-0.5 hover:bg-[#e8eaed]">Help</span>
        <div className="flex-1" />
        <button
          className={cn(
            "flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors",
            showDashboard
              ? "bg-[#1a73e8] text-white"
              : "bg-white text-[#444746] border border-[#dadce0] hover:bg-[#e8eaed]"
          )}
          onClick={() => setShowDashboard(!showDashboard)}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Dashboard
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1">
        <ToolbarButton title="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-[#dadce0]" />

        <select className="h-7 rounded border border-[#dadce0] bg-white px-1 text-[11px] text-[#444746] outline-none">
          <option>100%</option>
          <option>75%</option>
          <option>50%</option>
          <option>125%</option>
          <option>150%</option>
        </select>

        <div className="mx-1 h-5 w-px bg-[#dadce0]" />

        <select className="h-7 rounded border border-[#dadce0] bg-white px-1 text-[11px] text-[#444746] outline-none">
          <option>Default</option>
          <option>Arial</option>
          <option>Roboto</option>
          <option>Times New Roman</option>
          <option>Courier New</option>
        </select>

        <select className="ml-1 h-7 w-12 rounded border border-[#dadce0] bg-white px-1 text-center text-[11px] text-[#444746] outline-none">
          <option>10</option>
          <option>11</option>
          <option>12</option>
          <option>14</option>
          <option>16</option>
          <option>18</option>
          <option>24</option>
          <option>36</option>
        </select>

        <div className="mx-1 h-5 w-px bg-[#dadce0]" />

        <ToolbarButton
          title="Bold"
          active={cellData?.format?.bold}
          onClick={() => toggleFormat("bold")}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={cellData?.format?.italic}
          onClick={() => toggleFormat("italic")}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={cellData?.format?.underline}
          onClick={() => toggleFormat("underline")}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-[#dadce0]" />

        <ToolbarButton title="Text color">
          <Type className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Fill color">
          <Paintbrush className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-[#dadce0]" />

        <ToolbarButton
          title="Align left"
          active={cellData?.format?.textAlign === "left"}
          onClick={() => setAlign("left")}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          active={cellData?.format?.textAlign === "center"}
          onClick={() => setAlign("center")}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          active={cellData?.format?.textAlign === "right"}
          onClick={() => setAlign("right")}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Formula bar */}
      <div className="flex items-center border-t border-[#e2e3e3] px-2 py-0.5">
        <div className="flex h-6 w-[80px] items-center justify-center border-r border-[#e2e3e3] text-[12px] font-medium text-[#444746]">
          {selectedCell || ""}
        </div>
        <div className="ml-2 flex h-6 items-center text-[13px] text-[#444746]">
          <span className="mr-2 text-[#1a73e8] font-medium">fx</span>
          <span className="text-[#444746]">{cellFormula}</span>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  title,
  active,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-[#444746] transition-colors hover:bg-[#e8eaed]",
        active && "bg-[#d3e3fd] text-[#1a73e8]"
      )}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
