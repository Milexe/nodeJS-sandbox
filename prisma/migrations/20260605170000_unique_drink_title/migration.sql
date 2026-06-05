-- Enforce unique drink titles at the database level.
CREATE UNIQUE INDEX "Drinks_title_key" ON "Drinks"("title");
