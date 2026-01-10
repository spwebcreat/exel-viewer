import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'excel-quick-viewer-settings-v1';

interface Settings {
  folderPaths: string[];
}

const DEFAULT_SETTINGS: Settings = {
  folderPaths: [],
};

interface UseSettingsReturn {
  folderPaths: string[];
  addFolder: (path: string) => void;
  removeFolder: (path: string) => void;
  isLoading: boolean;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }
  }, [settings, isLoading]);

  const addFolder = useCallback((path: string) => {
    setSettings(prev => {
      // Avoid duplicates
      if (prev.folderPaths.includes(path)) return prev;
      return {
        ...prev,
        folderPaths: [...prev.folderPaths, path]
      };
    });
  }, []);

  const removeFolder = useCallback((path: string) => {
    setSettings(prev => ({
      ...prev,
      folderPaths: prev.folderPaths.filter(p => p !== path)
    }));
  }, []);

  return {
    folderPaths: settings.folderPaths,
    addFolder,
    removeFolder,
    isLoading
  };
}
