"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSpreadsheetStore } from "@/lib/spreadsheet-store";
import { cn } from "@/lib/utils";
import { Sparkles, BarChart3, Trash2, Copy, ClipboardPaste, Scissors } from "lucide-react";

const COLS = 26;
const ROWS = 100;
const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;

function getColLabel(col: number): string {
  let label = "";
  let c = col;
  while (c > 0) {
    const rem = (c - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    c = Math.floor((c - 1) / 26);
  }
  return label;
}

interface SpreadsheetGridProps {
  onOpenAiChat?: (prefill?: string) => void;
}

export function SpreadsheetGrid({ onOpenAiChat }: SpreadsheetGridProps) {
  const {
    selectedCell,
    editingCell,
    setSelectedCell,
    setEditingCell,
    setCellValue,
    getCellDisplay,
    getActiveSheet,
    copyCells,
    pasteCells,
    deleteCells,
  } = useSpreadsheetStore();

  const sheet = getActiveSheet();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cellId: string } | null>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      const cell = sheet.cells[editingCell];
      setEditValue(cell?.formula || cell?.value || "");
    }
  }, [editingCell, sheet.cells]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const handleCellClick = useCallback(
    (cellId: string) => {
      if (editingCell && editingCell !== cellId) {
        setCellValue(editingCell, editValue);
        setEditingCell(null);
      }
      setSelectedCell(cellId);
    },
    [editingCell, editValue, setCellValue, setEditingCell, setSelectedCell]
  );

  const handleCellDoubleClick = useCallback(
    (cellId: string) => {
      setEditingCell(cellId);
      const cell = sheet.cells[cellId];
      setEditValue(cell?.formula || cell?.value || "");
    },
    [setEditingCell, sheet.cells]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, cellId: string) => {
      e.preventDefault();
      setSelectedCell(cellId);
      setContextMenu({ x: e.clientX, y: e.clientY, cellId });
    },
    [setSelectedCell]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell) return;

      if (e.key === "Enter") {
        if (editingCell) {
          setCellValue(editingCell, editValue);
          setEditingCell(null);
          const match = selectedCell.match(/^([A-Z]+)(\d+)$/);
          if (match) {
            const nextRow = parseInt(match[2]) + 1;
            if (nextRow <= ROWS) {
              setSelectedCell(`${match[1]}${nextRow}`);
            }
          }
        } else {
          setEditingCell(selectedCell);
          const cell = sheet.cells[selectedCell];
          setEditValue(cell?.formula || cell?.value || "");
        }
        e.preventDefault();
        return;
      }

      if (e.key === "Escape") {
        if (editingCell) {
          setEditingCell(null);
          setEditValue("");
        }
        e.preventDefault();
        return;
      }

      if (e.key === "Tab") {
        if (editingCell) {
          setCellValue(editingCell, editValue);
          setEditingCell(null);
        }
        const match = selectedCell.match(/^([A-Z]+)(\d+)$/);
        if (match) {
          let colNum = 0;
          for (let i = 0; i < match[1].length; i++) {
            colNum = colNum * 26 + (match[1].charCodeAt(i) - 64);
          }
          const nextCol = e.shiftKey ? Math.max(1, colNum - 1) : Math.min(COLS, colNum + 1);
          setSelectedCell(`${getColLabel(nextCol)}${match[2]}`);
        }
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        copyCells();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        pasteCells();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (!editingCell) {
          deleteCells();
          e.preventDefault();
          return;
        }
      }

      if (!editingCell) {
        const match = selectedCell.match(/^([A-Z]+)(\d+)$/);
        if (!match) return;
        let colNum = 0;
        for (let i = 0; i < match[1].length; i++) {
          colNum = colNum * 26 + (match[1].charCodeAt(i) - 64);
        }
        const rowNum = parseInt(match[2]);

        switch (e.key) {
          case "ArrowUp":
            if (rowNum > 1) setSelectedCell(`${match[1]}${rowNum - 1}`);
            e.preventDefault();
            break;
          case "ArrowDown":
            if (rowNum < ROWS) setSelectedCell(`${match[1]}${rowNum + 1}`);
            e.preventDefault();
            break;
          case "ArrowLeft":
            if (colNum > 1) setSelectedCell(`${getColLabel(colNum - 1)}${match[2]}`);
            e.preventDefault();
            break;
          case "ArrowRight":
            if (colNum < COLS) setSelectedCell(`${getColLabel(colNum + 1)}${match[2]}`);
            e.preventDefault();
            break;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setEditingCell(selectedCell);
          setEditValue(e.key);
          e.preventDefault();
        }
      }
    },
    [selectedCell, editingCell, editValue, setCellValue, setEditingCell, setSelectedCell, copyCells, pasteCells, deleteCells, sheet.cells]
  );

  return (
    <div
      className="relative flex-1 overflow-auto outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        backgroundImage: "url('/chat-bg.png')",
        backgroundSize: "400px",
        backgroundPosition: "center",
        backgroundRepeat: "repeat",
        backgroundColor: "#faf8f5",
      }}
    >
      <table className="border-collapse select-none" style={{ tableLayout: "fixed" }}>
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 w-[46px] min-w-[46px] border border-[#e2e3e3] bg-[#f8f9fa]/95 text-center text-[11px] font-medium text-[#444746] backdrop-blur-sm" />
            {Array.from({ length: COLS }, (_, i) => (
              <th
                key={i}
                className="border border-[#e2e3e3] bg-[#f8f9fa]/95 px-1 text-center text-[11px] font-medium text-[#444746] backdrop-blur-sm"
                style={{
                  width: sheet.colWidths[i + 1] || DEFAULT_COL_WIDTH,
                  minWidth: sheet.colWidths[i + 1] || DEFAULT_COL_WIDTH,
                  height: DEFAULT_ROW_HEIGHT,
                }}
              >
                {getColLabel(i + 1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }, (_, rowIndex) => {
            const rowNum = rowIndex + 1;
            return (
              <tr key={rowNum}>
                <td className="sticky left-0 z-10 border border-[#e2e3e3] bg-[#f8f9fa]/95 text-center text-[11px] font-medium text-[#444746] backdrop-blur-sm"
                  style={{ height: sheet.rowHeights[rowNum] || DEFAULT_ROW_HEIGHT }}
                >
                  {rowNum}
                </td>
                {Array.from({ length: COLS }, (_, colIndex) => {
                  const cellId = `${getColLabel(colIndex + 1)}${rowNum}`;
                  const isSelected = selectedCell === cellId;
                  const isEditing = editingCell === cellId;
                  const cellData = sheet.cells[cellId];
                  const displayValue = getCellDisplay(cellId);

                  return (
                    <td
                      key={cellId}
                      className={cn(
                        "border border-[#e2e3e3]/70 px-1 text-[13px] leading-[28px] cursor-cell relative bg-white/85 backdrop-blur-sm",
                        isSelected && "outline outline-2 outline-[#1a73e8] z-[5] bg-white/95",
                        !isSelected && "hover:bg-white/95"
                      )}
                      style={{
                        height: sheet.rowHeights[rowNum] || DEFAULT_ROW_HEIGHT,
                        fontWeight: cellData?.format?.bold ? "bold" : undefined,
                        fontStyle: cellData?.format?.italic ? "italic" : undefined,
                        textDecoration: cellData?.format?.underline ? "underline" : undefined,
                        color: cellData?.format?.color,
                        backgroundColor: cellData?.format?.backgroundColor
                          ? cellData.format.backgroundColor
                          : undefined,
                        fontSize: cellData?.format?.fontSize,
                        textAlign: cellData?.format?.textAlign || "left",
                      }}
                      onClick={() => handleCellClick(cellId)}
                      onDoubleClick={() => handleCellDoubleClick(cellId)}
                      onContextMenu={(e) => handleContextMenu(e, cellId)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          className="absolute inset-0 z-10 w-full border-none bg-white px-1 text-[13px] leading-[28px] outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            setCellValue(cellId, editValue);
                            setEditingCell(null);
                          }}
                        />
                      ) : (
                        <span className="block truncate">{displayValue}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[240px] rounded-xl border border-[#e0e0e0] bg-white/95 py-1.5 shadow-2xl backdrop-blur-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <ContextMenuItem
            icon={<Sparkles className="h-4 w-4 text-[#1a73e8]" />}
            label="Ask AI about this cell"
            shortcut="Ctrl+I"
            onClick={() => {
              const cellVal = getCellDisplay(contextMenu.cellId);
              onOpenAiChat?.(`Tell me about cell ${contextMenu.cellId}${cellVal ? ` which contains "${cellVal}"` : ""}`);
              setContextMenu(null);
            }}
          />
          <ContextMenuItem
            icon={<Sparkles className="h-4 w-4 text-purple-500" />}
            label="AI Fill - Auto populate data"
            onClick={() => {
              onOpenAiChat?.("Fill the spreadsheet with sample data. Respond with a JSON block in this format:\n```fill\n[{\"cell\":\"A1\",\"value\":\"Name\"},{\"cell\":\"B1\",\"value\":\"Sales\"}]\n```");
              setContextMenu(null);
            }}
          />
          <ContextMenuItem
            icon={<BarChart3 className="h-4 w-4 text-green-600" />}
            label="Generate chart from data"
            onClick={() => {
              onOpenAiChat?.("Suggest the best charts for my current spreadsheet data");
              setContextMenu(null);
            }}
          />
          <div className="my-1 border-t border-[#e8eaed]" />
          <ContextMenuItem
            icon={<Copy className="h-4 w-4" />}
            label="Copy"
            shortcut="Ctrl+C"
            onClick={() => { copyCells(); setContextMenu(null); }}
          />
          <ContextMenuItem
            icon={<ClipboardPaste className="h-4 w-4" />}
            label="Paste"
            shortcut="Ctrl+V"
            onClick={() => { pasteCells(); setContextMenu(null); }}
          />
          <ContextMenuItem
            icon={<Scissors className="h-4 w-4" />}
            label="Cut"
            shortcut="Ctrl+X"
            onClick={() => { copyCells(); deleteCells(); setContextMenu(null); }}
          />
          <div className="my-1 border-t border-[#e8eaed]" />
          <ContextMenuItem
            icon={<Trash2 className="h-4 w-4 text-red-500" />}
            label="Delete cell content"
            shortcut="Del"
            onClick={() => { deleteCells(); setContextMenu(null); }}
          />
        </div>
      )}
    </div>
  );
}

function ContextMenuItem({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] text-[#202124] transition-colors hover:bg-[#f1f3f4]"
      onClick={onClick}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[11px] text-[#80868b]">{shortcut}</span>}
    </button>
  );
}
