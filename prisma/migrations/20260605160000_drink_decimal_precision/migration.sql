-- Align drink numeric columns with API precision rules.
ALTER TABLE "Drinks" ALTER COLUMN "abv" TYPE DECIMAL(4, 1);
ALTER TABLE "Drinks" ALTER COLUMN "rating" TYPE DECIMAL(2, 1) USING "rating"::decimal;
