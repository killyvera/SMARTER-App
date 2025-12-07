import type { z } from 'zod';
import type {
  createGoalSchema,
  updateGoalSchema,
  smarterScoreSchema,
  goalResponseSchema,
  goalStatusSchema,
} from '../schemas/goalSchemas';
import type {
  createMiniTaskSchema,
  updateMiniTaskSchema,
  miniTaskResponseSchema,
  miniTaskStatusSchema,
} from '../schemas/miniTaskSchemas';
import type {
  registerSchema,
  loginSchema,
  authResponseSchema,
} from '../schemas/authSchemas';
import type {
  createReadjustmentSchema,
  readjustmentResponseSchema,
} from '../schemas/readjustmentSchemas';
import type {
  updateProfileSchema,
  changePasswordSchema,
  userProfileResponseSchema,
} from '../schemas/userSchemas';

export type GoalStatus = z.infer<typeof goalStatusSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type SmarterScore = z.infer<typeof smarterScoreSchema>;
export type GoalResponse = z.infer<typeof goalResponseSchema>;

export type MiniTaskStatus = z.infer<typeof miniTaskStatusSchema>;
export type CreateMiniTaskInput = z.infer<typeof createMiniTaskSchema>;
export type UpdateMiniTaskInput = z.infer<typeof updateMiniTaskSchema>;
export type MiniTaskResponse = z.infer<typeof miniTaskResponseSchema>;


export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

export type CreateReadjustmentInput = z.infer<typeof createReadjustmentSchema>;
export type ReadjustmentResponse = z.infer<typeof readjustmentResponseSchema>;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;

// Tipos adicionales para Azure AI
export interface SuggestedMiniTask {
  title: string;
  description?: string;
  priority: number;
}

// Exportar tipos de plugins
export * from './plugins';

