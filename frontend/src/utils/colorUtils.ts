/**
 * Utilidades para manejo de colores en goals y minitasks
 */

/**
 * Genera un color hexadecimal aleatorio
 * @returns Color hexadecimal en formato #RRGGBB
 */
export function generateRandomColor(): string {
  // Generar colores vibrantes pero no demasiado oscuros
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 30); // 60-90%
  const lightness = 45 + Math.floor(Math.random() * 20); // 45-65%
  
  return hslToHex(hue, saturation, lightness);
}

/**
 * Convierte HSL a hexadecimal
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Oscurece un color hexadecimal
 * @param color Color en formato #RRGGBB
 * @param amount Cantidad de oscurecimiento (0-100, donde 100 es completamente negro)
 * @returns Color oscurecido en formato #RRGGBB
 */
export function darkenColor(color: string, amount: number = 25): string {
  // Remover el # si existe
  const hex = color.replace('#', '');
  
  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Oscurecer cada componente
  const darkenedR = Math.max(0, Math.floor(r * (1 - amount / 100)));
  const darkenedG = Math.max(0, Math.floor(g * (1 - amount / 100)));
  const darkenedB = Math.max(0, Math.floor(b * (1 - amount / 100)));
  
  // Convertir de vuelta a hexadecimal
  return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
}

/**
 * Verifica si un goal tiene color, y si no, genera uno
 * @param goal Objeto Goal (puede tener color o no)
 * @returns Color hexadecimal
 */
export function ensureGoalHasColor(goal: { color?: string | null }): string {
  if (goal.color && goal.color.trim() !== '') {
    return goal.color;
  }
  return generateRandomColor();
}

/**
 * Asegura que una minitask tenga color, heredándolo del goal si es necesario
 * @param miniTask Objeto MiniTask (puede tener color o no)
 * @param goalColor Color del goal padre
 * @returns Color hexadecimal
 */
export function ensureMiniTaskHasColor(
  miniTask: { color?: string | null },
  goalColor: string
): string {
  if (miniTask.color && miniTask.color.trim() !== '') {
    return miniTask.color;
  }
  // Heredar del goal padre
  return goalColor;
}

/**
 * Obtiene el color complementario en el círculo cromático (útil para tema cyberpunk)
 * Convierte el color a HSL, suma 180 grados al hue, y lo convierte de vuelta a RGB
 * @param color Color en formato #RRGGBB
 * @returns Color complementario en formato #RRGGBB
 */
export function invertColor(color: string): string {
  // Remover el # si existe
  const hex = color.replace('#', '');
  
  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Convertir RGB a HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }
  
  // Convertir h de 0-1 a 0-360 grados, sumar 180 (complementario), y volver a 0-1
  const hDegrees = h * 360;
  const complementaryH = (hDegrees + 180) % 360;
  
  // Convertir HSL de vuelta a RGB usando la función hslToHex existente
  // hslToHex espera: h (0-360), s (0-100), l (0-100)
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return hslToHex(complementaryH, sPercent, lPercent);
}

