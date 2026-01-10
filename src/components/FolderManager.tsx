import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';

interface FolderManagerProps {
  folderPaths: string[];
  onAddFolder: (path: string) => void;
  onRemoveFolder: (path: string) => void;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  folderPaths,
  onAddFolder,
  onRemoveFolder
}) => {
  const handleAddClick = async () => {
    try {
      const selected = await open({
        directory: true,
        title: '監視するフォルダを追加',
        multiple: false
      });

      if (selected && typeof selected === 'string') {
        onAddFolder(selected);
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
    }
  };

  // Get folder name from path for display
  const getFolderName = (path: string) => {
    // Handle both Windows backslash and Unix slash
    const separator = path.includes('\\') ? '\\' : '/';
    const parts = path.split(separator).filter(Boolean);
    return parts[parts.length - 1] || path;
  };

  return (
    <div className="folder-manager">
      <div className="sidebar__header p-0 border-b-0">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-semibold text-text-secondary">監視フォルダ</span>
          <button 
            className="folder-add-btn"
            onClick={handleAddClick}
            title="フォルダを追加"
          >
            + 追加
          </button>
        </div>
      </div>
      
      <div className="folder-list">
        {folderPaths.length === 0 && (
          <div className="text-xs text-text-muted p-2 italic">
            フォルダが登録されていません
          </div>
        )}
        {folderPaths.map(path => (
          <div key={path} className="folder-item" title={path}>
            <span className="folder-item__icon">📂</span>
            <div className="folder-item__content">
              <span className="folder-item__name">{getFolderName(path)}</span>
              <span className="folder-item__path">{path}</span>
            </div>
            <button 
              className="folder-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFolder(path);
              }}
              title="削除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
