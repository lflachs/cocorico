-- CreateTable
CREATE TABLE "daily_menu_configs" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "dishId" TEXT,
    "ingredients" JSONB NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_menu_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_menu_configs_restaurantId_idx" ON "daily_menu_configs"("restaurantId");

-- CreateIndex
CREATE INDEX "daily_menu_configs_date_idx" ON "daily_menu_configs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_menu_configs_restaurantId_date_key" ON "daily_menu_configs"("restaurantId", "date");

-- AddForeignKey
ALTER TABLE "daily_menu_configs" ADD CONSTRAINT "daily_menu_configs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_menu_configs" ADD CONSTRAINT "daily_menu_configs_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
