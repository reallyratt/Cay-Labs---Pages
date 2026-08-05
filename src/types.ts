export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean; // Dumpster
  folderId?: string | null;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  color?: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type ViewMode = 'auto' | 'mobile' | 'desktop';

export type AppSection = 'main' | 'archive' | 'dumpster' | 'settings' | 'widgets';

export interface PWAState {
  isInstalled: boolean;
  canInstall: boolean;
  isOffline: boolean;
}
