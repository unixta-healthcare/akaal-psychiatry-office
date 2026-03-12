'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

interface ModulesContextValue {
  modules: string[];
  loading: boolean;
  hasModule: (moduleId: string) => boolean;
  refresh: () => Promise<void>;
}

const ModulesContext = createContext<ModulesContextValue>({
  modules: [], loading: true, hasModule: () => false, refresh: async () => {},
});

export function ModulesProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/modules');
      if (res.ok) setModules((await res.json()).modules ?? []);
    } catch { /* keep current state */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const hasModule = useCallback((id: string) => modules.includes(id), [modules]);

  return (
    <ModulesContext.Provider value={{ modules, loading, hasModule, refresh }}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules() { return useContext(ModulesContext); }
