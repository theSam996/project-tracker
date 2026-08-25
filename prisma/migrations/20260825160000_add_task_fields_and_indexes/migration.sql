-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taskNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_projectId_status_order_idx" ON "Task"("projectId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Task_projectId_taskNumber_key" ON "Task"("projectId", "taskNumber");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
