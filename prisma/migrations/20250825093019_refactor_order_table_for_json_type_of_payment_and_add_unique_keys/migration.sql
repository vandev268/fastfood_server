-- This is an empty migration.

CREATE UNIQUE INDEX coupon_code_unique
ON "Coupon" ("code")
WHERE "deletedAt" IS NULL;