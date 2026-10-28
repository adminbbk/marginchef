-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('TRIAL', 'STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('g', 'kg', 'ml', 'l', 'pc');

-- CreateEnum
CREATE TYPE "InvoiceSource" AS ENUM ('PHOTO', 'PDF', 'EINVOICE_XML');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UPLOADED', 'PARSED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'TALABAT', 'DELIVEROO', 'CAREEM', 'KEETA', 'NOON', 'DIRECT');

-- CreateEnum
CREATE TYPE "CommissionBase" AS ENUM ('GROSS', 'NET');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'TRIAL',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emirate" TEXT NOT NULL DEFAULT 'Dubai',
    "vatRegistered" BOOLEAN NOT NULL DEFAULT true,
    "targetFoodCostPct" DECIMAL(7,4) NOT NULL DEFAULT 30,
    "whatsappNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trn" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUnit" "Unit" NOT NULL,
    "yieldPct" DECIMAL(7,4) NOT NULL DEFAULT 100,
    "currentCostPerBaseUnit" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientPrice" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "supplierId" TEXT,
    "invoiceLineId" TEXT,
    "packQty" DECIMAL(12,4) NOT NULL,
    "packUnit" "Unit" NOT NULL,
    "packPriceFils" INTEGER NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "supplierId" TEXT,
    "source" "InvoiceSource" NOT NULL,
    "fileUrl" TEXT,
    "invoiceNo" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "totalFils" INTEGER,
    "vatFils" INTEGER,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UPLOADED',
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPriceFils" INTEGER NOT NULL,
    "vatRatePct" DECIMAL(7,4) NOT NULL DEFAULT 5,
    "ingredientId" TEXT,
    "confidence" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "isSubRecipe" BOOLEAN NOT NULL DEFAULT false,
    "portions" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeLine" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "subRecipeId" TEXT,
    "qty" DECIMAL(12,4) NOT NULL,
    "unit" "Unit" NOT NULL,

    CONSTRAINT "RecipeLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "commissionPct" DECIMAL(7,4) NOT NULL,
    "commissionBase" "CommissionBase" NOT NULL DEFAULT 'NET',
    "fixedFeeFils" INTEGER NOT NULL DEFAULT 0,
    "paymentFeePct" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "pricesIncludeVat" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "packagingCostFils" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelPrice" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "priceFils" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "externalId" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL,
    "grossFils" INTEGER NOT NULL,
    "commissionFils" INTEGER NOT NULL DEFAULT 0,
    "feesFils" INTEGER NOT NULL DEFAULT 0,
    "restaurantFundedDiscountFils" INTEGER NOT NULL DEFAULT 0,
    "payoutFils" INTEGER,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPriceFils" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutImport" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_slug_key" ON "Outlet"("slug");

-- CreateIndex
CREATE INDEX "Outlet_orgId_idx" ON "Outlet"("orgId");

-- CreateIndex
CREATE INDEX "Membership_orgId_idx" ON "Membership"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_orgId_key" ON "Membership"("userId", "orgId");

-- CreateIndex
CREATE INDEX "Supplier_outletId_idx" ON "Supplier"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_id_outletId_key" ON "Supplier"("id", "outletId");

-- CreateIndex
CREATE INDEX "Ingredient_outletId_idx" ON "Ingredient"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_id_outletId_key" ON "Ingredient"("id", "outletId");

-- CreateIndex
CREATE INDEX "IngredientPrice_outletId_idx" ON "IngredientPrice"("outletId");

-- CreateIndex
CREATE INDEX "IngredientPrice_ingredientId_effectiveAt_idx" ON "IngredientPrice"("ingredientId", "effectiveAt");

-- CreateIndex
CREATE INDEX "Invoice_outletId_status_idx" ON "Invoice"("outletId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_id_outletId_key" ON "Invoice"("id", "outletId");

-- CreateIndex
CREATE INDEX "InvoiceLine_outletId_idx" ON "InvoiceLine"("outletId");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceLine_id_outletId_key" ON "InvoiceLine"("id", "outletId");

-- CreateIndex
CREATE INDEX "Recipe_outletId_idx" ON "Recipe"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_id_outletId_key" ON "Recipe"("id", "outletId");

-- CreateIndex
CREATE INDEX "RecipeLine_outletId_idx" ON "RecipeLine"("outletId");

-- CreateIndex
CREATE INDEX "RecipeLine_recipeId_idx" ON "RecipeLine"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeLine_ingredientId_idx" ON "RecipeLine"("ingredientId");

-- CreateIndex
CREATE INDEX "RecipeLine_subRecipeId_idx" ON "RecipeLine"("subRecipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_id_outletId_key" ON "Channel"("id", "outletId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_outletId_type_key" ON "Channel"("outletId", "type");

-- CreateIndex
CREATE INDEX "MenuItem_outletId_idx" ON "MenuItem"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_id_outletId_key" ON "MenuItem"("id", "outletId");

-- CreateIndex
CREATE INDEX "ChannelPrice_outletId_idx" ON "ChannelPrice"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelPrice_menuItemId_channelId_key" ON "ChannelPrice"("menuItemId", "channelId");

-- CreateIndex
CREATE INDEX "Order_outletId_placedAt_idx" ON "Order"("outletId", "placedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_id_outletId_key" ON "Order"("id", "outletId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_outletId_channelId_externalId_key" ON "Order"("outletId", "channelId", "externalId");

-- CreateIndex
CREATE INDEX "OrderItem_outletId_idx" ON "OrderItem"("outletId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");

-- CreateIndex
CREATE INDEX "PayoutImport_outletId_idx" ON "PayoutImport"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutImport_id_outletId_key" ON "PayoutImport"("id", "outletId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPrice" ADD CONSTRAINT "IngredientPrice_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPrice" ADD CONSTRAINT "IngredientPrice_ingredientId_outletId_fkey" FOREIGN KEY ("ingredientId", "outletId") REFERENCES "Ingredient"("id", "outletId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPrice" ADD CONSTRAINT "IngredientPrice_supplierId_outletId_fkey" FOREIGN KEY ("supplierId", "outletId") REFERENCES "Supplier"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPrice" ADD CONSTRAINT "IngredientPrice_invoiceLineId_outletId_fkey" FOREIGN KEY ("invoiceLineId", "outletId") REFERENCES "InvoiceLine"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supplierId_outletId_fkey" FOREIGN KEY ("supplierId", "outletId") REFERENCES "Supplier"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_outletId_fkey" FOREIGN KEY ("invoiceId", "outletId") REFERENCES "Invoice"("id", "outletId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_ingredientId_outletId_fkey" FOREIGN KEY ("ingredientId", "outletId") REFERENCES "Ingredient"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeLine" ADD CONSTRAINT "RecipeLine_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeLine" ADD CONSTRAINT "RecipeLine_recipeId_outletId_fkey" FOREIGN KEY ("recipeId", "outletId") REFERENCES "Recipe"("id", "outletId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeLine" ADD CONSTRAINT "RecipeLine_ingredientId_outletId_fkey" FOREIGN KEY ("ingredientId", "outletId") REFERENCES "Ingredient"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeLine" ADD CONSTRAINT "RecipeLine_subRecipeId_outletId_fkey" FOREIGN KEY ("subRecipeId", "outletId") REFERENCES "Recipe"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_recipeId_outletId_fkey" FOREIGN KEY ("recipeId", "outletId") REFERENCES "Recipe"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelPrice" ADD CONSTRAINT "ChannelPrice_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelPrice" ADD CONSTRAINT "ChannelPrice_menuItemId_outletId_fkey" FOREIGN KEY ("menuItemId", "outletId") REFERENCES "MenuItem"("id", "outletId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelPrice" ADD CONSTRAINT "ChannelPrice_channelId_outletId_fkey" FOREIGN KEY ("channelId", "outletId") REFERENCES "Channel"("id", "outletId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_channelId_outletId_fkey" FOREIGN KEY ("channelId", "outletId") REFERENCES "Channel"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_importBatchId_outletId_fkey" FOREIGN KEY ("importBatchId", "outletId") REFERENCES "PayoutImport"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_outletId_fkey" FOREIGN KEY ("orderId", "outletId") REFERENCES "Order"("id", "outletId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_outletId_fkey" FOREIGN KEY ("menuItemId", "outletId") REFERENCES "MenuItem"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutImport" ADD CONSTRAINT "PayoutImport_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutImport" ADD CONSTRAINT "PayoutImport_channelId_outletId_fkey" FOREIGN KEY ("channelId", "outletId") REFERENCES "Channel"("id", "outletId") ON DELETE NO ACTION ON UPDATE CASCADE;
