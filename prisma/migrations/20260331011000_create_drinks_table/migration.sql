-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Drinks" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(40) NOT NULL,
    "description" TEXT NOT NULL,
    "abv" DECIMAL(5,2) NOT NULL,
    "rating" SMALLINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Drinks_pkey" PRIMARY KEY ("id")
);
