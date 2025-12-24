-- AlterTable: Agregar campos de orden, prioridad y dependencias a MiniTask
ALTER TABLE "MiniTask" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MiniTask" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE "MiniTask" ADD COLUMN "dependsOn" TEXT;
ALTER TABLE "MiniTask" ADD COLUMN "schedulingType" TEXT NOT NULL DEFAULT 'sequential';
ALTER TABLE "MiniTask" ADD COLUMN "scheduledDate" DATETIME;
ALTER TABLE "MiniTask" ADD COLUMN "scheduledTime" TEXT;

-- CreateIndex: Índices para mejorar queries de ordenamiento y dependencias
CREATE INDEX "MiniTask_goalId_order_idx" ON "MiniTask"("goalId", "order");
CREATE INDEX "MiniTask_dependsOn_idx" ON "MiniTask"("dependsOn");
CREATE INDEX "MiniTask_schedulingType_idx" ON "MiniTask"("schedulingType");

