import React from 'react';

interface SheetTabsProps {
  sheetNames: string[];
  activeSheet: number;
  onSheetChange: (index: number) => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  sheetNames,
  activeSheet,
  onSheetChange,
}) => {
  if (sheetNames.length <= 1) {
    return null;
  }

  return (
    <div className="sheet-tabs">
      {sheetNames.map((name, index) => (
        <button
          key={index}
          className={`sheet-tab ${activeSheet === index ? 'sheet-tab--active' : ''}`}
          onClick={() => onSheetChange(index)}
        >
          {name}
        </button>
      ))}
    </div>
  );
};
