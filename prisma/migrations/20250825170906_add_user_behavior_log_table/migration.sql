-- CreateTable
CREATE TABLE "UserBehaviorLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBehaviorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBehaviorLog_userId_idx" ON "UserBehaviorLog"("userId");

-- CreateIndex
CREATE INDEX "UserBehaviorLog_productId_idx" ON "UserBehaviorLog"("productId");

-- CreateIndex
CREATE INDEX "UserBehaviorLog_action_idx" ON "UserBehaviorLog"("action");

-- CreateIndex
CREATE INDEX "UserBehaviorLog_lastSeen_idx" ON "UserBehaviorLog"("lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "UserBehaviorLog_userId_productId_action_key" ON "UserBehaviorLog"("userId", "productId", "action");

-- AddForeignKey
ALTER TABLE "UserBehaviorLog" ADD CONSTRAINT "UserBehaviorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserBehaviorLog" ADD CONSTRAINT "UserBehaviorLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
