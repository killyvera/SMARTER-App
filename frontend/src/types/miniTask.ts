/**
 * Tipo para MiniTask compatible con Prisma
 * Se usa cuando el tipo de Prisma no está disponible directamente
 */

export interface MiniTask {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  status: string;
  deadline: Date | null;
  unlocked: boolean;
  plannedHours: number | null;
  isSingleDayTask: boolean;
  metricsConfig: string | null;
  color: string | null;
  positionX: number | null;
  positionY: number | null;
  order: number;
  priority: string;
  dependsOn: string | null;
  schedulingType: string;
  scheduledDate: Date | null;
  scheduledTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}

