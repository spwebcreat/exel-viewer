export interface ExcelFile {
  name: string;
  path: string;
  size: number;
  folderName?: string;
}

export interface SheetData {
  name: string;
  data: CellValue[][];
  headers: string[];
}

export type CellValue = string | number | boolean | null;

export interface SearchMatch {
  sheetIndex: number;
  row: number;
  col: number;
}

export interface ParsedWorkbook {
  sheets: SheetData[];
  fileName: string;
}
