import React from 'react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  currentMatch: number;
  totalMatches: number;
  onNext: () => void;
  onPrev: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  currentMatch,
  totalMatches,
  onNext,
  onPrev,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    }
  };

  return (
    <div className="search-bar">
      <span className="search-bar__icon">🔍</span>
      <input
        type="text"
        className="search-bar__input"
        placeholder="検索..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {query && totalMatches > 0 && (
        <>
          <span className="search-bar__count">
            {currentMatch + 1}/{totalMatches}
          </span>
          <div className="search-bar__nav">
            <button className="search-bar__nav-btn" onClick={onPrev} title="前へ">
              ▲
            </button>
            <button className="search-bar__nav-btn" onClick={onNext} title="次へ">
              ▼
            </button>
          </div>
        </>
      )}
      {query && totalMatches === 0 && (
        <span className="search-bar__count">0件</span>
      )}
    </div>
  );
};
