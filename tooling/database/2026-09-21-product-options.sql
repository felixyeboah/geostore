-- Additive production upgrade for product options and admin order search.
-- Apply once, in a transaction, after checking PRAGMA table_info for these fields.
ALTER TABLE "store_product" ADD COLUMN "condition" TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE "store_product" ADD COLUMN "optionStyles" JSONB;
ALTER TABLE "store_product_image" ADD COLUMN "optionAxis" TEXT;
ALTER TABLE "store_product_image" ADD COLUMN "optionValue" TEXT;
ALTER TABLE "store_order" ADD COLUMN "recipientName" TEXT;
