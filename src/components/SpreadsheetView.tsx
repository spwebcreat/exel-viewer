import React, { useEffect, useRef } from 'react';
import type { SheetData } from '../types';

interface SpreadsheetViewProps {
  sheet: SheetData;
  sheetIndex: number;
  isMatch: (sheetIndex: number, row: number, col: number) => boolean;
  isCurrentMatch: (sheetIndex: number, row: number, col: number) => boolean;
  currentMatchRow: number | null;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  sheet,
  sheetIndex,
  isMatch,
  isCurrentMatch,
  currentMatchRow,
}) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // Scroll to current match
  useEffect(() => {
    if (currentMatchRow !== null && tableRef.current) {
      const row = tableRef.current.querySelector(`[data-row="${currentMatchRow}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchRow]);

  return (
    <div className="spreadsheet" ref={tableRef}>
      <table className="spreadsheet__table">
        <thead>
          <tr className="spreadsheet__header-row">
            <th className="spreadsheet__header-cell spreadsheet__header-cell--row-num">#</th>
            {sheet.headers.map((header, index) => (
              <th key={index} className="spreadsheet__header-cell">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="spreadsheet__row"
              data-row={rowIndex}
            >
              <td className="spreadsheet__cell spreadsheet__cell--row-num">
                {rowIndex + 1}
              </td>
              {row.map((cell, colIndex) => {
                const highlight = isMatch(sheetIndex, rowIndex, colIndex);
                const current = isCurrentMatch(sheetIndex, rowIndex, colIndex);
                
                return (
                  <td
                    key={colIndex}
                    className={`spreadsheet__cell ${highlight ? 'spreadsheet__cell--highlight' : ''} ${current ? 'spreadsheet__cell--current' : ''}`}
                    title={cell !== null ? String(cell) : undefined}
                  >
                    {cell !== null ? String(cell) : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
