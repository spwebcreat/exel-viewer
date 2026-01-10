import { useState, useMemo, useCallback } from 'react';
import type { SearchMatch, ParsedWorkbook } from '../types';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  matches: SearchMatch[];
  currentMatchIndex: number;
  goToNext: () => void;
  goToPrev: () => void;
  isMatch: (sheetIndex: number, row: number, col: number) => boolean;
  isCurrentMatch: (sheetIndex: number, row: number, col: number) => boolean;
  totalMatches: number;
}

export function useSearch(workbook: ParsedWorkbook | null): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const matches = useMemo<SearchMatch[]>(() => {
    if (!workbook || !query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const results: SearchMatch[] = [];

    workbook.sheets.forEach((sheet, sheetIndex) => {
      sheet.data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell !== null && String(cell).toLowerCase().includes(searchTerm)) {
            results.push({
              sheetIndex,
              row: rowIndex,
              col: colIndex,
            });
          }
        });
      });
    });

    return results;
  }, [workbook, query]);

  // Reset current match when matches change
  useMemo(() => {
    setCurrentMatchIndex(0);
  }, [matches]);

  const goToNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const goToPrev = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const isMatch = useCallback(
    (sheetIndex: number, row: number, col: number) => {
      return matches.some(
        (m) => m.sheetIndex === sheetIndex && m.row === row && m.col === col
      );
    },
    [matches]
  );

  const isCurrentMatch = useCallback(
    (sheetIndex: number, row: number, col: number) => {
      if (matches.length === 0) return false;
      const current = matches[currentMatchIndex];
      return (
        current.sheetIndex === sheetIndex &&
        current.row === row &&
        current.col === col
      );
    },
    [matches, currentMatchIndex]
  );

  return {
    query,
    setQuery,
    matches,
    currentMatchIndex,
    goToNext,
    goToPrev,
    isMatch,
    isCurrentMatch,
    totalMatches: matches.length,
  };
}
