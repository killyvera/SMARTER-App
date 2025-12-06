-- AlterTable
ALTER TABLE "Goal" ADD COLUMN "plannedHours" REAL;
ALTER TABLE "Goal" ADD COLUMN "isSingleDayGoal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MiniTask" ADD COLUMN "plannedHours" REAL;
ALTER TABLE "MiniTask" ADD COLUMN "isSingleDayTask" BOOLEAN NOT NULL DEFAULT false;

