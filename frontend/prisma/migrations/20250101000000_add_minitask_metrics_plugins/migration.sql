-- AlterTable
ALTER TABLE "MiniTask" ADD COLUMN "unlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MiniTask" ADD COLUMN "metricsConfig" TEXT;

-- CreateTable
CREATE TABLE "MiniTaskMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miniTaskId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "metadata" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MiniTaskMetric_miniTaskId_fkey" FOREIGN KEY ("miniTaskId") REFERENCES "MiniTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MiniTaskPlugin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miniTaskId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MiniTaskPlugin_miniTaskId_fkey" FOREIGN KEY ("miniTaskId") REFERENCES "MiniTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MiniTaskMetric_miniTaskId_idx" ON "MiniTaskMetric"("miniTaskId");
CREATE INDEX "MiniTaskMetric_pluginId_idx" ON "MiniTaskMetric"("pluginId");
CREATE INDEX "MiniTaskMetric_recordedAt_idx" ON "MiniTaskMetric"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MiniTaskPlugin_miniTaskId_pluginId_key" ON "MiniTaskPlugin"("miniTaskId", "pluginId");
CREATE INDEX "MiniTaskPlugin_miniTaskId_idx" ON "MiniTaskPlugin"("miniTaskId");
CREATE INDEX "MiniTaskPlugin_pluginId_idx" ON "MiniTaskPlugin"("pluginId");

-- CreateIndex
CREATE INDEX "MiniTask_unlocked_idx" ON "MiniTask"("unlocked");

