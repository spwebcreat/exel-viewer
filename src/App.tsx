import { useState, useEffect, useMemo } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, stat } from '@tauri-apps/plugin-fs';
import { useExcelParser } from './hooks/useExcelParser';
import { useSearch } from './hooks/useSearch';
import { SearchBar } from './components/SearchBar';
import { FileList } from './components/FileList';
import { SheetTabs } from './components/SheetTabs';
import { SpreadsheetView } from './components/SpreadsheetView';
import type { ExcelFile } from './types';
import './App.css';

function App() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  const { workbook, isLoading, error, parseFile, clear } = useExcelParser();
  const search = useSearch(workbook);

  // Auto-switch sheet when search finds match in different sheet
  useEffect(() => {
    if (search.matches.length > 0) {
      const currentMatch = search.matches[search.currentMatchIndex];
      if (currentMatch && currentMatch.sheetIndex !== activeSheet) {
        setActiveSheet(currentMatch.sheetIndex);
      }
    }
  }, [search.currentMatchIndex, search.matches, activeSheet]);

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        title: 'Excelファイルがあるフォルダを選択',
      });

      if (selected && typeof selected === 'string') {
        setFolderPath(selected);
        setIsLoadingFolder(true);
        setSelectedFilePath(null);
        clear();
        search.setQuery('');

        // Read directory contents
        const entries = await readDir(selected);
        const excelFiles: ExcelFile[] = [];

        for (const entry of entries) {
          const fileName = entry.name;
          if (fileName) {
            const lowerName = fileName.toLowerCase();
            const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');
            const isTempFile = fileName.startsWith('~$');
            
            if (isExcel && !isTempFile) {
              const filePath = `${selected}/${fileName}`;
              try {
                const fileStat = await stat(filePath);
                excelFiles.push({
                  name: fileName,
                  path: filePath,
                  size: fileStat.size,
                });
              } catch (statErr) {
                console.error(`Error getting stat for ${filePath}:`, statErr);
              }
            }
          }
        }

        // Sort by name
        excelFiles.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
        setFiles(excelFiles);
        setIsLoadingFolder(false);
      }
    } catch (err) {
      console.error('Error selecting folder:', err);
      setIsLoadingFolder(false);
    }
  };

  const handleFileSelect = async (file: ExcelFile) => {
    setSelectedFilePath(file.path);
    setActiveSheet(0);
    search.setQuery('');
    await parseFile(file.path, file.name);
  };

  const currentSheet = workbook?.sheets[activeSheet];

  // Get current match row for scrolling
  const currentMatchRow = useMemo(() => {
    if (search.matches.length === 0) return null;
    const match = search.matches[search.currentMatchIndex];
    if (match && match.sheetIndex === activeSheet) {
      return match.row;
    }
    return null;
  }, [search.matches, search.currentMatchIndex, activeSheet]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__title">
          <span className="header__icon">📊</span>
          <span>Excel Quick Viewer</span>
        </div>
        <div className="header__actions">
          {workbook && (
            <SearchBar
              query={search.query}
              onQueryChange={search.setQuery}
              currentMatch={search.currentMatchIndex}
              totalMatches={search.totalMatches}
              onNext={search.goToNext}
              onPrev={search.goToPrev}
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar__header">
            <button className="sidebar__folder-btn" onClick={handleSelectFolder}>
              📁 フォルダを選択
            </button>
          </div>
          
          {folderPath && (
            <div className="sidebar__path" title={folderPath}>
              {folderPath}
            </div>
          )}

          {isLoadingFolder ? (
            <div className="loading">
              <div className="loading__spinner" />
              <span>読み込み中...</span>
            </div>
          ) : (
            <FileList
              files={files}
              selectedFile={selectedFilePath}
              onFileSelect={handleFileSelect}
            />
          )}
        </aside>

        {/* Viewer */}
        <section className="viewer">
          {!workbook && !isLoading && !error && (
            <div className="viewer__empty">
              <span className="viewer__empty-icon">📋</span>
              <span className="viewer__empty-text">
                {folderPath
                  ? 'ファイルを選択してプレビュー'
                  : 'フォルダを選択してください'}
              </span>
            </div>
          )}

          {isLoading && (
            <div className="loading">
              <div className="loading__spinner" />
              <span>ファイルを読み込み中...</span>
            </div>
          )}

          {error && (
            <div className="viewer__empty">
              <span className="viewer__empty-icon">⚠️</span>
              <span className="viewer__empty-text">{error}</span>
            </div>
          )}

          {workbook && currentSheet && (
            <>
              <SheetTabs
                sheetNames={workbook.sheets.map((s) => s.name)}
                activeSheet={activeSheet}
                onSheetChange={setActiveSheet}
              />
              <SpreadsheetView
                sheet={currentSheet}
                sheetIndex={activeSheet}
                isMatch={search.isMatch}
                isCurrentMatch={search.isCurrentMatch}
                currentMatchRow={currentMatchRow}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
