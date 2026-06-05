-- B-tree indexes for catalog range filters and sort columns
CREATE INDEX "Drinks_abv_idx" ON "Drinks"("abv");
CREATE INDEX "Drinks_rating_idx" ON "Drinks"("rating");
CREATE INDEX "Drinks_price_idx" ON "Drinks"("price");
CREATE INDEX "Drinks_imageUrl_idx" ON "Drinks"("imageUrl");

-- Trigram GIN index for case-insensitive title search (ILIKE / contains)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Drinks_title_trgm_idx" ON "Drinks" USING gin ("title" gin_trgm_ops);
