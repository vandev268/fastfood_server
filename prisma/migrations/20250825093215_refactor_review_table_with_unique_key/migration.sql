-- This is an empty migration.

CREATE UNIQUE INDEX review_product_id_order_id_unique
ON "Review" ("productId", "orderId")
WHERE "deletedAt" IS NULL;