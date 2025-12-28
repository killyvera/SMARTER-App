-- ============================================================================
-- Script SQL para crear todas las tablas en Supabase
-- 
-- Este script crea el esquema completo de la base de datos SMARTER App
-- Ejecutar directamente en el SQL Editor de Supabase
-- ============================================================================

-- Habilitar extensiones necesarias (si no están habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA: User
-- ============================================================================
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "biometricEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ============================================================================
-- TABLA: Goal
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "deadline" TIMESTAMP(3),
    "plannedHours" DOUBLE PRECISION,
    "isSingleDayGoal" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para Goal
CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX IF NOT EXISTS "Goal_status_idx" ON "Goal"("status");

-- ============================================================================
-- TABLA: SmarterScore
-- ============================================================================
CREATE TABLE IF NOT EXISTS "SmarterScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL UNIQUE,
    "specific" DOUBLE PRECISION NOT NULL,
    "measurable" DOUBLE PRECISION NOT NULL,
    "achievable" DOUBLE PRECISION NOT NULL,
    "relevant" DOUBLE PRECISION NOT NULL,
    "timebound" DOUBLE PRECISION NOT NULL,
    "evaluate" DOUBLE PRECISION NOT NULL,
    "readjust" DOUBLE PRECISION NOT NULL,
    "average" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmarterScore_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- TABLA: MiniTask
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MiniTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "deadline" TIMESTAMP(3),
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "plannedHours" DOUBLE PRECISION,
    "isSingleDayTask" BOOLEAN NOT NULL DEFAULT false,
    "metricsConfig" TEXT,
    "color" TEXT,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "order" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dependsOn" TEXT,
    "schedulingType" TEXT NOT NULL DEFAULT 'sequential',
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MiniTask_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para MiniTask
CREATE INDEX IF NOT EXISTS "MiniTask_goalId_idx" ON "MiniTask"("goalId");
CREATE INDEX IF NOT EXISTS "MiniTask_status_idx" ON "MiniTask"("status");
CREATE INDEX IF NOT EXISTS "MiniTask_unlocked_idx" ON "MiniTask"("unlocked");
CREATE INDEX IF NOT EXISTS "MiniTask_goalId_order_idx" ON "MiniTask"("goalId", "order");
CREATE INDEX IF NOT EXISTS "MiniTask_dependsOn_idx" ON "MiniTask"("dependsOn");
CREATE INDEX IF NOT EXISTS "MiniTask_schedulingType_idx" ON "MiniTask"("schedulingType");

-- ============================================================================
-- TABLA: MiniTaskScore
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MiniTaskScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miniTaskId" TEXT NOT NULL UNIQUE,
    "specific" DOUBLE PRECISION NOT NULL,
    "measurable" DOUBLE PRECISION NOT NULL,
    "achievable" DOUBLE PRECISION NOT NULL,
    "relevant" DOUBLE PRECISION NOT NULL,
    "timebound" DOUBLE PRECISION NOT NULL,
    "average" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MiniTaskScore_miniTaskId_fkey" FOREIGN KEY ("miniTaskId") REFERENCES "MiniTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- TABLA: Readjustment
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Readjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "previousSnapshot" TEXT NOT NULL,
    "newSnapshot" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Readjustment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para Readjustment
CREATE INDEX IF NOT EXISTS "Readjustment_goalId_idx" ON "Readjustment"("goalId");

-- ============================================================================
-- TABLA: SuggestedMiniTask
-- ============================================================================
CREATE TABLE IF NOT EXISTS "SuggestedMiniTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SuggestedMiniTask_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para SuggestedMiniTask
CREATE INDEX IF NOT EXISTS "SuggestedMiniTask_goalId_idx" ON "SuggestedMiniTask"("goalId");

-- ============================================================================
-- TABLA: MiniTaskMetric
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MiniTaskMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miniTaskId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "metadata" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MiniTaskMetric_miniTaskId_fkey" FOREIGN KEY ("miniTaskId") REFERENCES "MiniTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para MiniTaskMetric
CREATE INDEX IF NOT EXISTS "MiniTaskMetric_miniTaskId_idx" ON "MiniTaskMetric"("miniTaskId");
CREATE INDEX IF NOT EXISTS "MiniTaskMetric_pluginId_idx" ON "MiniTaskMetric"("pluginId");
CREATE INDEX IF NOT EXISTS "MiniTaskMetric_recordedAt_idx" ON "MiniTaskMetric"("recordedAt");

-- ============================================================================
-- TABLA: MiniTaskPlugin
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MiniTaskPlugin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miniTaskId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MiniTaskPlugin_miniTaskId_fkey" FOREIGN KEY ("miniTaskId") REFERENCES "MiniTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para MiniTaskPlugin
CREATE UNIQUE INDEX IF NOT EXISTS "MiniTaskPlugin_miniTaskId_pluginId_key" ON "MiniTaskPlugin"("miniTaskId", "pluginId");
CREATE INDEX IF NOT EXISTS "MiniTaskPlugin_miniTaskId_idx" ON "MiniTaskPlugin"("miniTaskId");
CREATE INDEX IF NOT EXISTS "MiniTaskPlugin_pluginId_idx" ON "MiniTaskPlugin"("pluginId");

-- ============================================================================
-- TABLA: MiniTaskJournalEntry
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MiniTaskJournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miniTaskId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "progressValue" DOUBLE PRECISION,
    "progressUnit" TEXT,
    "notes" TEXT,
    "obstacles" TEXT,
    "mood" TEXT,
    "timeSpent" INTEGER,
    "checklistCompleted" BOOLEAN,
    "metricsData" TEXT,
    "coachQuery" TEXT,
    "coachResponse" TEXT,
    "coachSuggestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MiniTaskJournalEntry_miniTaskId_fkey" FOREIGN KEY ("miniTaskId") REFERENCES "MiniTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para MiniTaskJournalEntry
CREATE UNIQUE INDEX IF NOT EXISTS "MiniTaskJournalEntry_miniTaskId_entryDate_key" ON "MiniTaskJournalEntry"("miniTaskId", "entryDate");
CREATE INDEX IF NOT EXISTS "MiniTaskJournalEntry_miniTaskId_idx" ON "MiniTaskJournalEntry"("miniTaskId");
CREATE INDEX IF NOT EXISTS "MiniTaskJournalEntry_entryDate_idx" ON "MiniTaskJournalEntry"("entryDate");

-- ============================================================================
-- TABLA: MiniTaskChecklistItem
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MiniTaskChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miniTaskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MiniTaskChecklistItem_miniTaskId_fkey" FOREIGN KEY ("miniTaskId") REFERENCES "MiniTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para MiniTaskChecklistItem
CREATE INDEX IF NOT EXISTS "MiniTaskChecklistItem_miniTaskId_idx" ON "MiniTaskChecklistItem"("miniTaskId");
CREATE INDEX IF NOT EXISTS "MiniTaskChecklistItem_completed_idx" ON "MiniTaskChecklistItem"("completed");

-- ============================================================================
-- TABLA: BiometricCredential
-- ============================================================================
CREATE TABLE IF NOT EXISTS "BiometricCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL UNIQUE,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "deviceName" TEXT,
    "authenticatorType" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    CONSTRAINT "BiometricCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para BiometricCredential
CREATE INDEX IF NOT EXISTS "BiometricCredential_userId_idx" ON "BiometricCredential"("userId");
CREATE INDEX IF NOT EXISTS "BiometricCredential_credentialId_idx" ON "BiometricCredential"("credentialId");
CREATE INDEX IF NOT EXISTS "BiometricCredential_userId_enabled_idx" ON "BiometricCredential"("userId", "enabled");

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Verificar que todas las tablas fueron creadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'User', 'Goal', 'SmarterScore', 'MiniTask', 'MiniTaskScore',
        'Readjustment', 'SuggestedMiniTask', 'MiniTaskMetric',
        'MiniTaskPlugin', 'MiniTaskJournalEntry', 'MiniTaskChecklistItem',
        'BiometricCredential'
    );
    
    IF table_count = 12 THEN
        RAISE NOTICE '✅ Todas las tablas fueron creadas exitosamente (% tablas)', table_count;
    ELSE
        RAISE WARNING '⚠️  Solo se crearon % de 12 tablas esperadas', table_count;
    END IF;
END $$;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Para verificar las tablas creadas, ejecuta:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

