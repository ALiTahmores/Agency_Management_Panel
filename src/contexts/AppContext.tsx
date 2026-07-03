import React, { createContext, useContext, useState } from 'react';
import { type Project } from '../lib/supabase';

interface AppContextValue {
  currentProject: Project | null;
  setCurrentProject: (p: Project | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AppContext.Provider value={{ currentProject, setCurrentProject, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
