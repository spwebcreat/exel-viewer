import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { readFile } from '@tauri-apps/plugin-fs';
import type { SheetData, ParsedWorkbook, CellValue } from '../types';

interface UseExcelParserReturn {
  workbook: ParsedWorkbook | null;
  isLoading: boolean;
  error: string | null;
  parseFile: (filePath: string, fileName: string) => Promise<void>;
  clear: () => void;
}

export function useExcelParser(): UseExcelParserReturn {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (filePath: string, fileName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Read file as binary using Tauri fs plugin
      const fileData = await readFile(filePath);
      
      // Parse with SheetJS
      const wb = XLSX.read(fileData, { type: 'array' });

      const sheets: SheetData[] = wb.SheetNames.map((sheetName) => {
        const worksheet = wb.Sheets[sheetName];
        
        // Get range
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const maxCol = Math.min(range.e.c, 50); // Limit to 50 columns
        const maxRow = Math.min(range.e.r, 10000); // Limit to 10000 rows
        
        // Generate column headers (A, B, C, ..., AA, AB, etc.)
        const headers: string[] = [];
        for (let c = 0; c <= maxCol; c++) {
          headers.push(XLSX.utils.encode_col(c));
        }
        
        // Extract column widths
        const colWidths: number[] = [];
        const cols = worksheet['!cols'];
        if (cols) {
          for (let c = 0; c <= maxCol; c++) {
            const colInfo = cols[c];
            // wpx: width in pixels, wch: width in characters (approx 7px per char)
            let width = 80; // default width
            if (colInfo) {
              if (colInfo.wpx) width = colInfo.wpx;
              else if (colInfo.wch) width = colInfo.wch * 7.5; // Approximation
              else if (colInfo.width) width = colInfo.width * 7.5;
            }
            colWidths.push(width);
          }
        } else {
          // Default widths if no info available
          for (let c = 0; c <= maxCol; c++) {
            colWidths.push(80);
          }
        }

        // Extract data
        const data: CellValue[][] = [];
        for (let r = 0; r <= maxRow; r++) {
          const row: CellValue[] = [];
          for (let c = 0; c <= maxCol; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            const cell = worksheet[cellAddress];
            
            if (cell) {
              // Use formatted value if available, otherwise raw value
              row.push(cell.w !== undefined ? cell.w : cell.v);
            } else {
              row.push(null);
            }
          }
          
          // Only add row if it has any data
          if (row.some(cell => cell !== null)) {
            data.push(row);
          } else if (data.length > 0) {
            // Add empty row only if we already have data
            data.push(row);
          }
        }
        
        // Remove trailing empty rows
        while (data.length > 0 && data[data.length - 1].every(cell => cell === null)) {
          data.pop();
        }

        return {
          name: sheetName,
          data,
          headers,
          colWidths,
        };
      });

      setWorkbook({
        sheets,
        fileName,
      });
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      setError(err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setWorkbook(null);
    setError(null);
  }, []);

  return {
    workbook,
    isLoading,
    error,
    parseFile,
    clear,
  };
}
