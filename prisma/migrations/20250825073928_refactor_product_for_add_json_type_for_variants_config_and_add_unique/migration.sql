-- This is an empty migration.
CREATE UNIQUE INDEX variant_product_id_value_unique
ON "Variant" ("productId", "value")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX tag_name_type_unique
ON "Tag" ("name", "type")
WHERE "deletedAt" IS NULL;