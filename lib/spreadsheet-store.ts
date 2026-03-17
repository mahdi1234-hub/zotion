import { create } from "zustand";

export interface CellData {
  value: string;
  formula?: string;
  computed?: string | number;
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    textAlign?: "left" | "center" | "right";
  };
}

export interface SheetTab {
  id: string;
  name: string;
  cells: Record<string, CellData>;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
}

export interface ChartWidget {
  id: string;
  type: "bar" | "line" | "area" | "radial";
  title: string;
  dataRange: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpreadsheetState {
  sheets: SheetTab[];
  activeSheetId: string;
  selectedCell: string | null;
  selectedRange: { start: string; end: string } | null;
  editingCell: string | null;
  clipboard: { cells: Record<string, CellData>; range: { start: string; end: string } } | null;
  dashboardCharts: ChartWidget[];
  showDashboard: boolean;

  // Actions
  addSheet: () => void;
  removeSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  setCellValue: (cellId: string, value: string) => void;
  setCellFormat: (cellId: string, format: Partial<CellData["format"]>) => void;
  setSelectedCell: (cellId: string | null) => void;
  setSelectedRange: (range: { start: string; end: string } | null) => void;
  setEditingCell: (cellId: string | null) => void;
  copyCells: () => void;
  pasteCells: () => void;
  deleteCells: () => void;
  getActiveSheet: () => SheetTab;
  getCellDisplay: (cellId: string) => string;
  getAllData: () => Record<string, string | number>[];
  getHeaders: () => string[];

  // Dashboard
  addChart: (chart: Omit<ChartWidget, "id">) => void;
  removeChart: (id: string) => void;
  updateChart: (id: string, updates: Partial<ChartWidget>) => void;
  setShowDashboard: (show: boolean) => void;
}

function cellIdToCoords(cellId: string): { col: number; row: number } {
  const match = cellId.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { col: 0, row: 0 };
  const colStr = match[1];
  const row = parseInt(match[2], 10);
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  return { col, row };
}

function coordsToCellId(col: number, row: number): string {
  let colStr = "";
  let c = col;
  while (c > 0) {
    const rem = (c - 1) % 26;
    colStr = String.fromCharCode(65 + rem) + colStr;
    c = Math.floor((c - 1) / 26);
  }
  return `${colStr}${row}`;
}

function evaluateFormula(formula: string, cells: Record<string, CellData>): string | number {
  try {
    const expr = formula.startsWith("=") ? formula.slice(1) : formula;

    // Handle SUM
    const sumMatch = expr.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (sumMatch) {
      const start = cellIdToCoords(sumMatch[1].toUpperCase());
      const end = cellIdToCoords(sumMatch[2].toUpperCase());
      let sum = 0;
      for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
        for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
          const id = coordsToCellId(c, r);
          const val = parseFloat(cells[id]?.computed?.toString() || cells[id]?.value || "0");
          if (!isNaN(val)) sum += val;
        }
      }
      return sum;
    }

    // Handle AVERAGE
    const avgMatch = expr.match(/^AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (avgMatch) {
      const start = cellIdToCoords(avgMatch[1].toUpperCase());
      const end = cellIdToCoords(avgMatch[2].toUpperCase());
      let sum = 0;
      let count = 0;
      for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
        for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
          const id = coordsToCellId(c, r);
          const val = parseFloat(cells[id]?.computed?.toString() || cells[id]?.value || "0");
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }
      }
      return count > 0 ? sum / count : 0;
    }

    // Handle COUNT
    const countMatch = expr.match(/^COUNT\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (countMatch) {
      const start = cellIdToCoords(countMatch[1].toUpperCase());
      const end = cellIdToCoords(countMatch[2].toUpperCase());
      let count = 0;
      for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
        for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
          const id = coordsToCellId(c, r);
          const val = cells[id]?.value;
          if (val && val.trim() !== "") count++;
        }
      }
      return count;
    }

    // Handle MAX
    const maxMatch = expr.match(/^MAX\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (maxMatch) {
      const start = cellIdToCoords(maxMatch[1].toUpperCase());
      const end = cellIdToCoords(maxMatch[2].toUpperCase());
      let max = -Infinity;
      for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
        for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
          const id = coordsToCellId(c, r);
          const val = parseFloat(cells[id]?.computed?.toString() || cells[id]?.value || "");
          if (!isNaN(val)) max = Math.max(max, val);
        }
      }
      return max === -Infinity ? 0 : max;
    }

    // Handle MIN
    const minMatch = expr.match(/^MIN\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (minMatch) {
      const start = cellIdToCoords(minMatch[1].toUpperCase());
      const end = cellIdToCoords(minMatch[2].toUpperCase());
      let min = Infinity;
      for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
        for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
          const id = coordsToCellId(c, r);
          const val = parseFloat(cells[id]?.computed?.toString() || cells[id]?.value || "");
          if (!isNaN(val)) min = Math.min(min, val);
        }
      }
      return min === Infinity ? 0 : min;
    }

    // Handle IF
    const ifMatch = expr.match(/^IF\((.+),(.+),(.+)\)$/i);
    if (ifMatch) {
      const condition = ifMatch[1].trim();
      const trueVal = ifMatch[2].trim();
      const falseVal = ifMatch[3].trim();
      // Simple comparison
      const compMatch = condition.match(/^([A-Z]+\d+)\s*(>|<|>=|<=|=|!=)\s*(.+)$/);
      if (compMatch) {
        const cellVal = parseFloat(cells[compMatch[1]]?.computed?.toString() || cells[compMatch[1]]?.value || "0");
        const compareVal = parseFloat(compMatch[3]);
        let result = false;
        switch (compMatch[2]) {
          case ">": result = cellVal > compareVal; break;
          case "<": result = cellVal < compareVal; break;
          case ">=": result = cellVal >= compareVal; break;
          case "<=": result = cellVal <= compareVal; break;
          case "=": result = cellVal === compareVal; break;
          case "!=": result = cellVal !== compareVal; break;
        }
        return result ? trueVal : falseVal;
      }
    }

    // Handle simple cell references and arithmetic
    const resolved = expr.replace(/[A-Z]+\d+/g, (match) => {
      const val = cells[match]?.computed?.toString() || cells[match]?.value || "0";
      return isNaN(parseFloat(val)) ? "0" : val;
    });

    // Safe eval for arithmetic
    const safeResult = Function(`"use strict"; return (${resolved})`)();
    return typeof safeResult === "number" ? safeResult : String(safeResult);
  } catch {
    return "#ERROR";
  }
}

const defaultSheet: SheetTab = {
  id: "sheet-1",
  name: "Sheet 1",
  cells: {},
  colWidths: {},
  rowHeights: {},
};

export const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  sheets: [defaultSheet],
  activeSheetId: "sheet-1",
  selectedCell: "A1",
  selectedRange: null,
  editingCell: null,
  clipboard: null,
  dashboardCharts: [],
  showDashboard: false,

  addSheet: () => {
    const sheets = get().sheets;
    const newId = `sheet-${Date.now()}`;
    const newSheet: SheetTab = {
      id: newId,
      name: `Sheet ${sheets.length + 1}`,
      cells: {},
      colWidths: {},
      rowHeights: {},
    };
    set({ sheets: [...sheets, newSheet], activeSheetId: newId });
  },

  removeSheet: (id) => {
    const sheets = get().sheets;
    if (sheets.length <= 1) return;
    const filtered = sheets.filter((s) => s.id !== id);
    const activeSheetId = get().activeSheetId === id ? filtered[0].id : get().activeSheetId;
    set({ sheets: filtered, activeSheetId });
  },

  renameSheet: (id, name) => {
    set({
      sheets: get().sheets.map((s) => (s.id === id ? { ...s, name } : s)),
    });
  },

  setActiveSheet: (id) => set({ activeSheetId: id }),

  setCellValue: (cellId, value) => {
    const sheets = get().sheets;
    const activeId = get().activeSheetId;
    const updated = sheets.map((sheet) => {
      if (sheet.id !== activeId) return sheet;
      const cells = { ...sheet.cells };
      if (value === "" && !cells[cellId]?.format) {
        delete cells[cellId];
      } else {
        const isFormula = value.startsWith("=");
        cells[cellId] = {
          ...cells[cellId],
          value,
          formula: isFormula ? value : undefined,
          computed: isFormula ? evaluateFormula(value, cells) : undefined,
        };
      }
      return { ...sheet, cells };
    });
    set({ sheets: updated });
  },

  setCellFormat: (cellId, format) => {
    const sheets = get().sheets;
    const activeId = get().activeSheetId;
    const updated = sheets.map((sheet) => {
      if (sheet.id !== activeId) return sheet;
      const cells = { ...sheet.cells };
      cells[cellId] = {
        ...cells[cellId],
        value: cells[cellId]?.value || "",
        format: { ...cells[cellId]?.format, ...format },
      };
      return { ...sheet, cells };
    });
    set({ sheets: updated });
  },

  setSelectedCell: (cellId) => set({ selectedCell: cellId }),
  setSelectedRange: (range) => set({ selectedRange: range }),
  setEditingCell: (cellId) => set({ editingCell: cellId }),

  copyCells: () => {
    const cell = get().selectedCell;
    if (!cell) return;
    const sheet = get().getActiveSheet();
    const cellData = sheet.cells[cell];
    if (cellData) {
      set({ clipboard: { cells: { [cell]: cellData }, range: { start: cell, end: cell } } });
    }
  },

  pasteCells: () => {
    const clipboard = get().clipboard;
    const target = get().selectedCell;
    if (!clipboard || !target) return;
    const sourceId = Object.keys(clipboard.cells)[0];
    const sourceData = clipboard.cells[sourceId];
    if (sourceData) {
      get().setCellValue(target, sourceData.value);
      if (sourceData.format) {
        get().setCellFormat(target, sourceData.format);
      }
    }
  },

  deleteCells: () => {
    const cell = get().selectedCell;
    if (!cell) return;
    get().setCellValue(cell, "");
  },

  getActiveSheet: () => {
    return get().sheets.find((s) => s.id === get().activeSheetId) || get().sheets[0];
  },

  getCellDisplay: (cellId) => {
    const sheet = get().getActiveSheet();
    const cell = sheet.cells[cellId];
    if (!cell) return "";
    if (cell.computed !== undefined) return String(cell.computed);
    return cell.value;
  },

  getAllData: () => {
    const sheet = get().getActiveSheet();
    const cells = sheet.cells;
    const cellIds = Object.keys(cells);
    if (cellIds.length === 0) return [];

    // Find dimensions
    let maxRow = 0;
    let maxCol = 0;
    for (const id of cellIds) {
      const { col, row } = cellIdToCoords(id);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    }

    // Get headers from row 1
    const headers: string[] = [];
    for (let c = 1; c <= maxCol; c++) {
      const id = coordsToCellId(c, 1);
      headers.push(cells[id]?.value || coordsToCellId(c, 1));
    }

    // Build data rows
    const data: Record<string, string | number>[] = [];
    for (let r = 2; r <= maxRow; r++) {
      const row: Record<string, string | number> = {};
      let hasData = false;
      for (let c = 1; c <= maxCol; c++) {
        const id = coordsToCellId(c, r);
        const cell = cells[id];
        if (cell) {
          const val = cell.computed !== undefined ? cell.computed : cell.value;
          const num = parseFloat(String(val));
          row[headers[c - 1]] = isNaN(num) ? String(val) : num;
          hasData = true;
        } else {
          row[headers[c - 1]] = "";
        }
      }
      if (hasData) data.push(row);
    }
    return data;
  },

  getHeaders: () => {
    const sheet = get().getActiveSheet();
    const cells = sheet.cells;
    const cellIds = Object.keys(cells);
    if (cellIds.length === 0) return [];

    let maxCol = 0;
    for (const id of cellIds) {
      const { col } = cellIdToCoords(id);
      maxCol = Math.max(maxCol, col);
    }

    const headers: string[] = [];
    for (let c = 1; c <= maxCol; c++) {
      const id = coordsToCellId(c, 1);
      headers.push(cells[id]?.value || coordsToCellId(c, 1));
    }
    return headers;
  },

  addChart: (chart) => {
    const id = `chart-${Date.now()}`;
    set({ dashboardCharts: [...get().dashboardCharts, { ...chart, id }] });
  },

  removeChart: (id) => {
    set({ dashboardCharts: get().dashboardCharts.filter((c) => c.id !== id) });
  },

  updateChart: (id, updates) => {
    set({
      dashboardCharts: get().dashboardCharts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  },

  setShowDashboard: (show) => set({ showDashboard: show }),
}));
