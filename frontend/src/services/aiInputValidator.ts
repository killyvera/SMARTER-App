/**
 * Input Validator Service para proteger el Agent Core de IA
 * 
 * Valida y sanitiza inputs antes de llamar a la IA
 * Previene injection attacks y inputs inválidos
 */

interface ValidationRules {
  maxLength?: number;
  requiredFields?: string[];
  fieldTypes?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;
  customValidator?: (input: any) => boolean;
}

// Configuración de validación por operación
const VALIDATION_RULES: Record<string, ValidationRules> = {
  validateGoal: {
    maxLength: 5000, // Máximo 5000 caracteres en total
    requiredFields: ['title'],
    fieldTypes: {
      title: 'string',
      description: 'string',
      deadline: 'string',
      userContext: 'string',
    },
    customValidator: (input) => {
      // Validar que title no esté vacío después de trim
      if (input.title && typeof input.title === 'string') {
        return input.title.trim().length > 0;
      }
      return false;
    },
  },
  unlockMiniTask: {
    maxLength: 5000,
    requiredFields: ['title'],
    fieldTypes: {
      title: 'string',
      description: 'string',
      deadline: 'string',
      goalContext: 'object',
    },
    customValidator: (input) => {
      if (input.title && typeof input.title === 'string') {
        return input.title.trim().length > 0;
      }
      if (input.goalContext && typeof input.goalContext === 'object') {
        return !!input.goalContext.title;
      }
      return false;
    },
  },
  queryCoach: {
    maxLength: 2000, // Queries más cortas
    requiredFields: ['query'],
    fieldTypes: {
      query: 'string',
    },
    customValidator: (input) => {
      if (input.query && typeof input.query === 'string') {
        const trimmed = input.query.trim();
        return trimmed.length > 0 && trimmed.length <= 2000;
      }
      return false;
    },
  },
  validateMiniTask: {
    maxLength: 3000,
    requiredFields: ['title'],
    fieldTypes: {
      title: 'string',
      description: 'string',
      deadline: 'string',
      goalContext: 'object',
    },
    customValidator: (input) => {
      if (input.title && typeof input.title === 'string') {
        return input.title.trim().length > 0;
      }
      return false;
    },
  },
};

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
function sanitizeString(value: string): string {
  // Remover caracteres de control excepto newlines y tabs
  return value
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Calcula la longitud total de un input (recursivo)
 */
function calculateInputLength(input: any): number {
  if (typeof input === 'string') {
    return input.length;
  }
  
  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input).length;
  }
  
  if (Array.isArray(input)) {
    return input.reduce((sum, item) => sum + calculateInputLength(item), 0);
  }
  
  if (input && typeof input === 'object') {
    return Object.values(input).reduce(
      (sum, value) => sum + calculateInputLength(value),
      0
    );
  }
  
  return 0;
}

/**
 * Valida el tipo de un campo
 */
function validateFieldType(
  value: any,
  expectedType: string,
  fieldName: string
): boolean {
  if (expectedType === 'string' && typeof value !== 'string') {
    return false;
  }
  
  if (expectedType === 'number' && typeof value !== 'number') {
    return false;
  }
  
  if (expectedType === 'boolean' && typeof value !== 'boolean') {
    return false;
  }
  
  if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value) || value === null)) {
    return false;
  }
  
  if (expectedType === 'array' && !Array.isArray(value)) {
    return false;
  }
  
  return true;
}

/**
 * Valida un input según las reglas de la operación
 */
export async function validateInput(
  operation: string,
  input: any
): Promise<void> {
  const rules = VALIDATION_RULES[operation];
  
  if (!rules) {
    // Si no hay reglas, validación básica
    if (!input || typeof input !== 'object') {
      throw new ValidationError(`Input inválido para ${operation}: debe ser un objeto`);
    }
    return;
  }
  
  // 1. Validar campos requeridos
  if (rules.requiredFields) {
    for (const field of rules.requiredFields) {
      if (!(field in input) || input[field] === null || input[field] === undefined) {
        throw new ValidationError(
          `Campo requerido faltante para ${operation}: ${field}`
        );
      }
    }
  }
  
  // 2. Validar tipos de campos
  if (rules.fieldTypes) {
    for (const [field, expectedType] of Object.entries(rules.fieldTypes)) {
      if (field in input && input[field] !== null && input[field] !== undefined) {
        if (!validateFieldType(input[field], expectedType, field)) {
          throw new ValidationError(
            `Tipo inválido para campo ${field} en ${operation}: esperado ${expectedType}, recibido ${typeof input[field]}`
          );
        }
      }
    }
  }
  
  // 3. Validar longitud máxima
  if (rules.maxLength) {
    const totalLength = calculateInputLength(input);
    if (totalLength > rules.maxLength) {
      throw new ValidationError(
        `Input demasiado largo para ${operation}: ${totalLength} caracteres (máximo ${rules.maxLength})`
      );
    }
  }
  
  // 4. Validación personalizada
  if (rules.customValidator) {
    if (!rules.customValidator(input)) {
      throw new ValidationError(
        `Validación personalizada falló para ${operation}`
      );
    }
  }
  
  // 5. Sanitizar strings
  sanitizeInputStrings(input);
}

/**
 * Sanitiza todos los strings en el input (recursivo)
 */
function sanitizeInputStrings(input: any): void {
  if (typeof input === 'string') {
    // No podemos modificar el input directamente, pero podemos validar
    // La sanitización real se hace en el servicio que usa el input
    return;
  }
  
  if (Array.isArray(input)) {
    input.forEach((item) => sanitizeInputStrings(item));
    return;
  }
  
  if (input && typeof input === 'object') {
    Object.keys(input).forEach((key) => {
      if (typeof input[key] === 'string') {
        input[key] = sanitizeString(input[key]);
      } else {
        sanitizeInputStrings(input[key]);
      }
    });
  }
}

/**
 * Sanitiza un input completo (modifica el objeto)
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }
  
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item));
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Error personalizado para validación
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

