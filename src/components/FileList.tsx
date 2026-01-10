import React from 'react';
import type { ExcelFile } from '../types';

interface FileListProps {
  files: ExcelFile[];
  selectedFile: string | null;
  onFileSelect: (file: ExcelFile) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFile,
  onFileSelect,
}) => {
  if (files.length === 0) {
    return (
      <div className="no-files">
        <span className="no-files__icon">📁</span>
        <span>Excelファイルがありません</span>
      </div>
    );
  }

  return (
    <div className="sidebar__list">
      {files.map((file) => (
        <div
          key={file.path}
          className={`file-item ${selectedFile === file.path ? 'file-item--active' : ''}`}
          onClick={() => onFileSelect(file)}
        >
          <span className="file-item__icon">
            {file.name.endsWith('.xlsx') ? '📗' : '📘'}
          </span>
          <div className="file-item__info">
            <span className="file-item__name" title={file.name}>
              {file.name}
            </span>
            <div className="file-item__meta">
              <span className="file-item__size">{formatFileSize(file.size)}</span>
              {file.folderName && (
                <span className="file-item__folder" title={file.folderName}>
                  📂 {file.folderName}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
