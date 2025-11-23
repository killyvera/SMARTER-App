import { create } from 'zustand';

interface PluginVisibilityState {
  expandedPlugins: Record<string, boolean>; // miniTaskId -> pluginId -> expanded
  pinnedPlugins: Record<string, string[]>; // miniTaskId -> pluginIds[]
  togglePlugin: (miniTaskId: string, pluginId: string) => void;
  pinPlugin: (miniTaskId: string, pluginId: string) => void;
  unpinPlugin: (miniTaskId: string, pluginId: string) => void;
  isExpanded: (miniTaskId: string, pluginId: string) => boolean;
  isPinned: (miniTaskId: string, pluginId: string) => boolean;
}

// Cargar estado desde localStorage al inicializar
const loadFromStorage = () => {
  if (typeof window === 'undefined') {
    return { expandedPlugins: {}, pinnedPlugins: {} };
  }
  try {
    const stored = localStorage.getItem('plugin-visibility-storage');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignorar errores de parsing
  }
  return { expandedPlugins: {}, pinnedPlugins: {} };
};

// Guardar estado en localStorage
const saveToStorage = (state: PluginVisibilityState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('plugin-visibility-storage', JSON.stringify({
      expandedPlugins: state.expandedPlugins,
      pinnedPlugins: state.pinnedPlugins,
    }));
  } catch {
    // Ignorar errores de storage
  }
};

const initialState = loadFromStorage();

export const usePluginVisibilityStore = create<PluginVisibilityState>((set, get) => ({
  expandedPlugins: initialState.expandedPlugins || {},
  pinnedPlugins: initialState.pinnedPlugins || {},

  togglePlugin: (miniTaskId: string, pluginId: string) => {
    set((state) => {
      const key = `${miniTaskId}-${pluginId}`;
      const current = state.expandedPlugins[key] || false;
      const newState = {
        ...state,
        expandedPlugins: {
          ...state.expandedPlugins,
          [key]: !current,
        },
      };
      saveToStorage(newState);
      return newState;
    });
  },

  pinPlugin: (miniTaskId: string, pluginId: string) => {
    set((state) => {
      const pinned = state.pinnedPlugins[miniTaskId] || [];
      if (!pinned.includes(pluginId)) {
        const newState = {
          ...state,
          pinnedPlugins: {
            ...state.pinnedPlugins,
            [miniTaskId]: [...pinned, pluginId],
          },
          expandedPlugins: {
            ...state.expandedPlugins,
            [`${miniTaskId}-${pluginId}`]: true,
          },
        };
        saveToStorage(newState);
        return newState;
      }
      return state;
    });
  },

  unpinPlugin: (miniTaskId: string, pluginId: string) => {
    set((state) => {
      const pinned = state.pinnedPlugins[miniTaskId] || [];
      const newState = {
        ...state,
        pinnedPlugins: {
          ...state.pinnedPlugins,
          [miniTaskId]: pinned.filter((id) => id !== pluginId),
        },
      };
      saveToStorage(newState);
      return newState;
    });
  },

  isExpanded: (miniTaskId: string, pluginId: string) => {
    const state = get();
    const key = `${miniTaskId}-${pluginId}`;
    // Si está pinned, siempre está expandido
    if (state.isPinned(miniTaskId, pluginId)) {
      return true;
    }
    return state.expandedPlugins[key] || false;
  },

  isPinned: (miniTaskId: string, pluginId: string) => {
    const state = get();
    const pinned = state.pinnedPlugins[miniTaskId] || [];
    return pinned.includes(pluginId);
  },
}));

