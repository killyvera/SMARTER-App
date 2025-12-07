'use client';

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'cyberpunk';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Cargar tema guardado o detectar preferencia del sistema
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remover todas las clases de tema
    root.classList.remove('light', 'dark', 'cyberpunk');
    
    // Aplicar nueva clase de tema
    root.classList.add(newTheme);
    
    // Guardar en localStorage
    localStorage.setItem('theme', newTheme);
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return { theme, changeTheme };
}

