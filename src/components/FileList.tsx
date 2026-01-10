import React, { useMemo } from 'react';
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
      {sortedFolders.map(folderName => (
        <div key={folderName} className="file-tree-group">
          <div className="file-tree-header">
            <span className="file-tree-header__icon">📂</span>
            <span>{folderName}</span>
            <span className="file-tree-header__count">
              {groupedFiles[folderName].length}
            </span>
          </div>
          
          <div className="file-tree-items">
            {groupedFiles[folderName].map(file => (
              <div
                key={file.path}
                className={`file-tree-item ${selectedFile === file.path ? 'file-tree-item--active' : ''}`}
                onClick={() => onFileSelect(file)}
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
        </div>
      ))}
    </div>
  );
};
