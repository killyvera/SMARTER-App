'use client';

import { useEffect } from 'react';
import { useTheme } from './useTheme';

/**
 * Hook que activa efectos de glitch periódicos en el tema cyberpunk
 * Con múltiples variaciones aleatorias y duración variable
 */
export function useCyberpunkGlitch() {
  const { theme } = useTheme();

  useEffect(() => {
    // Solo activar si el tema es cyberpunk
    if (theme !== 'cyberpunk') {
      return;
    }

    const htmlElement = document.documentElement;
    let glitchTimeout: NodeJS.Timeout;
    let nextGlitchTimeout: NodeJS.Timeout;

    const triggerGlitch = () => {
      // Seleccionar tipo de glitch aleatorio (1, 2 o 3)
      const glitchType = Math.floor(Math.random() * 3) + 1; // 1, 2 o 3
      
      // Duración aleatoria del glitch (entre 600ms y 1500ms) - más larga
      const glitchDuration = Math.random() * 900 + 600; // 600-1500ms
      
      // Establecer duración como variable CSS
      htmlElement.style.setProperty('--glitch-duration', `${glitchDuration}ms`);
      
      // Remover todas las clases de glitch anteriores
      htmlElement.classList.remove('glitch-active-1', 'glitch-active-2', 'glitch-active-3');
      
      // Agregar clase de glitch según el tipo seleccionado
      htmlElement.classList.add(`glitch-active-${glitchType}`);

      // Remover después de la animación
      setTimeout(() => {
        htmlElement.classList.remove('glitch-active-1', 'glitch-active-2', 'glitch-active-3');
        htmlElement.style.removeProperty('--glitch-duration');
      }, glitchDuration);

      // Programar próximo glitch (entre 2 y 5 segundos) - más frecuente
      const nextGlitchDelay = Math.random() * 3000 + 2000; // 2-5 segundos (aleatorio)
      nextGlitchTimeout = setTimeout(triggerGlitch, nextGlitchDelay);
    };

    // Iniciar primer glitch después de un delay aleatorio (2-4 segundos) - más rápido
    const initialDelay = Math.random() * 2000 + 2000; // 2-4 segundos (aleatorio)
    glitchTimeout = setTimeout(triggerGlitch, initialDelay);

    // Cleanup
    return () => {
      if (glitchTimeout) clearTimeout(glitchTimeout);
      if (nextGlitchTimeout) clearTimeout(nextGlitchTimeout);
      htmlElement.classList.remove('glitch-active-1', 'glitch-active-2', 'glitch-active-3');
      htmlElement.style.removeProperty('--glitch-duration');
    };
  }, [theme]);
}

