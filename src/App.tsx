import { useState, useEffect, useMemo, useCallback } from 'react';
import { readDir, stat } from '@tauri-apps/plugin-fs';
import { useExcelParser } from './hooks/useExcelParser';
import { useSearch } from './hooks/useSearch';
import { useSettings } from './hooks/useSettings';
import { SearchBar } from './components/SearchBar';
import { FileList } from './components/FileList';
import { SheetTabs } from './components/SheetTabs';
import { SpreadsheetView } from './components/SpreadsheetView';
import { FolderManager } from './components/FolderManager';
import type { ExcelFile } from './types';
import './App.css';

function App() {
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Settings hook handles persistence of folder paths
  const { folderPaths, addFolder, removeFolder, isLoading: isSettingsLoading } = useSettings();

  const { workbook, isLoading: isParsing, error, parseFile } = useExcelParser();
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

  // Read contents of all registered folders
  const refreshFiles = useCallback(async () => {
    if (folderPaths.length === 0) {
      setFiles([]);
      return;
    }

    setIsLoadingFiles(true);
    const allFiles: ExcelFile[] = [];

    try {
      // Process folders in parallel
      await Promise.all(folderPaths.map(async (folderPath) => {
        try {
          // Get folder name for display
          const separator = folderPath.includes('\\') ? '\\' : '/';
          const parts = folderPath.split(separator).filter(Boolean);
          const folderName = parts[parts.length - 1] || folderPath;

          const entries = await readDir(folderPath);

          // Process files in parallel
          const filePromises = entries.map(async (entry) => {
            const fileName = entry.name;
            if (!fileName) return null;

            const lowerName = fileName.toLowerCase();
            const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');
            const isTempFile = fileName.startsWith('~$');
            
            if (isExcel && !isTempFile) {
              const filePath = `${folderPath}/${fileName}`;
              try {
                const fileStat = await stat(filePath);
                return {
                  name: fileName,
                  path: filePath,
                  size: fileStat.size,
                  folderName: folderName,
                } as ExcelFile;
              } catch {
                return null;
              }
            }
            return null;
          });

          const folderFiles = (await Promise.all(filePromises)).filter((f): f is ExcelFile => f !== null);
          allFiles.push(...folderFiles);
          
        } catch (err) {
          console.error(`Error reading directory ${folderPath}:`, err);
        }
      }));

      // Sort by folder name then by file name
      allFiles.sort((a, b) => {
        if (a.folderName !== b.folderName) {
          return (a.folderName || '').localeCompare(b.folderName || '', 'ja');
        }
        return a.name.localeCompare(b.name, 'ja');
      });

      setFiles(allFiles);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [folderPaths]);

  // Refresh files when folder list changes
  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

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
          {/* Folder Manager Section */}
          <FolderManager 
            folderPaths={folderPaths}
            onAddFolder={addFolder}
            onRemoveFolder={removeFolder}
            onRefresh={refreshFiles}
          />
          
          {/* File List Section */}
          {isLoadingFiles || isSettingsLoading ? (
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
          {!workbook && !isParsing && !error && (
            <div className="viewer__empty">
              <span className="viewer__empty-icon">📋</span>
              <span className="viewer__empty-text">
                {folderPaths.length > 0
                  ? 'ファイルを選択してプレビュー'
                  : '左上の「+ 追加」から監視フォルダを追加してください'}
              </span>
            </div>
          )}

          {isParsing && (
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
                filePath={selectedFilePath}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
