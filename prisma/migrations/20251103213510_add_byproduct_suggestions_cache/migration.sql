-- CreateTable
CREATE TABLE "byproduct_suggestions" (
    "id" TEXT NOT NULL,
    "ingredientsHash" TEXT NOT NULL,
    "ingredientsList" TEXT[],
    "suggestions" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "byproduct_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "byproduct_suggestions_ingredientsHash_key" ON "byproduct_suggestions"("ingredientsHash");

-- CreateIndex
CREATE INDEX "byproduct_suggestions_ingredientsHash_idx" ON "byproduct_suggestions"("ingredientsHash");

-- CreateIndex
CREATE INDEX "byproduct_suggestions_lastUsedAt_idx" ON "byproduct_suggestions"("lastUsedAt");
