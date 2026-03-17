"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSpreadsheetStore } from "@/lib/spreadsheet-store";
import { cn } from "@/lib/utils";

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

export function SpreadsheetGrid() {
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

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      const cell = sheet.cells[editingCell];
      setEditValue(cell?.formula || cell?.value || "");
    }
  }, [editingCell, sheet.cells]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell) return;

      if (e.key === "Enter") {
        if (editingCell) {
          setCellValue(editingCell, editValue);
          setEditingCell(null);
          // Move down
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

      // Arrow keys navigation
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

        // Start typing to edit
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
      className="flex-1 overflow-auto outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <table className="border-collapse select-none" style={{ tableLayout: "fixed" }}>
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 w-[46px] min-w-[46px] border border-[#e2e3e3] bg-[#f8f9fa] text-center text-[11px] font-medium text-[#444746]" />
            {Array.from({ length: COLS }, (_, i) => (
              <th
                key={i}
                className="border border-[#e2e3e3] bg-[#f8f9fa] px-1 text-center text-[11px] font-medium text-[#444746]"
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
                <td className="sticky left-0 z-10 border border-[#e2e3e3] bg-[#f8f9fa] text-center text-[11px] font-medium text-[#444746]"
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
                        "border border-[#e2e3e3] px-1 text-[13px] leading-[28px] cursor-cell relative",
                        isSelected && "outline outline-2 outline-[#1a73e8] z-[5]",
                        !isSelected && "hover:bg-[#f0f4ff]"
                      )}
                      style={{
                        height: sheet.rowHeights[rowNum] || DEFAULT_ROW_HEIGHT,
                        fontWeight: cellData?.format?.bold ? "bold" : undefined,
                        fontStyle: cellData?.format?.italic ? "italic" : undefined,
                        textDecoration: cellData?.format?.underline ? "underline" : undefined,
                        color: cellData?.format?.color,
                        backgroundColor: isSelected
                          ? undefined
                          : cellData?.format?.backgroundColor,
                        fontSize: cellData?.format?.fontSize,
                        textAlign: cellData?.format?.textAlign || "left",
                      }}
                      onClick={() => handleCellClick(cellId)}
                      onDoubleClick={() => handleCellDoubleClick(cellId)}
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
    </div>
  );
}
