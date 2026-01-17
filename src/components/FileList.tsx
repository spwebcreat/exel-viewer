import React, { useMemo, useState, useEffect } from 'react';
import type { ExcelFile } from '../types';

interface FileListProps {
  files: ExcelFile[];
  selectedFile: string | null;
  onFileSelect: (file: ExcelFile) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFile,
  onFileSelect,
}) => {
  // Group files by folder name
  const groupedFiles = useMemo(() => {
    return files.reduce((acc, file) => {
      const folder = file.folderName || 'その他';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(file);
      return acc;
    }, {} as Record<string, ExcelFile[]>);
  }, [files]);

  // Manage expanded state for folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Initialize expanded folders (expand all by default when list changes significantly)
  useEffect(() => {
    setExpandedFolders(prev => {
      const availableFolders = Object.keys(groupedFiles);
      if (prev.size === 0 && availableFolders.length > 0) {
        return new Set(availableFolders);
      }
      // Keep existing state, but ensure new folders are added if needed (optional)
      // For now, let's just keep existing state robustly
      const next = new Set(prev);
      availableFolders.forEach(f => {
        // If a folder appears and wasn't tracked, we could default it to open
        if (!prev.has(f)) next.add(f); 
      });
      return next;
    });
  }, [groupedFiles]);

  const toggleFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      return next;
    });
  };

  if (files.length === 0) {
    return (
      <div className="no-files">
        <span className="no-files__icon">📁</span>
        <span>Excelファイルがありません</span>
      </div>
    );
  }

  // Sort folder names (make sure 'その他' is last if it exists)
  const sortedFolders = Object.keys(groupedFiles).sort((a, b) => {
    if (a === 'その他') return 1;
    if (b === 'その他') return -1;
    return a.localeCompare(b, 'ja');
  });

  return (
    <div className="sidebar__list">
      {sortedFolders.map(folderName => {
        const isExpanded = expandedFolders.has(folderName);
        return (
          <div key={folderName} className="file-tree-group">
            <div 
              className="file-tree-header"
              onClick={(e) => toggleFolder(folderName, e)}
            >
              <span className={`file-tree-toggle ${!isExpanded ? 'file-tree-toggle--collapsed' : ''}`}>
                ▼
              </span>
              <span className="file-tree-header__icon">📂</span>
              <span>{folderName}</span>
              <span className="file-tree-header__count">
                {groupedFiles[folderName].length}
              </span>
            </div>
            
            {isExpanded && (
              <div className="file-tree-items">
                {groupedFiles[folderName].map(file => (
                  <div
                    key={file.path}
                    className={`file-tree-item ${selectedFile === file.path ? 'file-tree-item--active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileSelect(file);
                    }}
                    title={file.name}
                  >
                    <span className="file-tree-item__icon">
                      {file.name.endsWith('.xlsx') ? '📗' : '📘'}
                    </span>
                    <span className="file-tree-item__info">
                      {file.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
