INSERT INTO "Drinks" (title, description, abv, rating, price) VALUES
  ('Midnight Stout', 'Roasted barley with dark chocolate and espresso notes', 6.5, 4.5, 8.99),
  ('Citrus IPA', 'Bright hop aroma with grapefruit and pine bitterness', 6.2, 4.2, 7.50),
  ('Golden Lager', 'Crisp clean malt profile with a dry finish', 4.8, 3.8, 5.99),
  ('Smoky Porter', 'Subtle smoke over caramel and toasted malt', 5.6, 4.1, 7.25),
  ('Wheat Haze', 'Hazy ale with banana and clove yeast character', 5.0, 4.0, 6.75),
  ('Amber Ale', 'Balanced caramel malt and gentle hop bite', 5.4, 3.9, 6.49),
  ('Session Pale', 'Light body with citrus and floral hops', 4.2, 3.7, 5.49),
  ('Belgian Tripel', 'Spicy yeast profile with a dry warming finish', 8.5, 4.6, 11.99),
  ('Farmhouse Saison', 'Dry peppery ale with rustic fermentation notes', 6.0, 4.3, 8.49),
  ('Cherry Sour', 'Tart cherry acidity over a light malt base', 4.5, 4.4, 9.99),
  ('Oatmeal Stout', 'Silky mouthfeel with coffee and cocoa tones', 5.8, 4.2, 7.99),
  ('Mango Sour', 'Tropical fruit tang with a refreshing tart edge', 4.3, 4.1, 8.75),
  ('Rye IPA', 'Spicy rye backbone supporting resinous hops', 6.8, 4.0, 7.89),
  ('Honey Blonde', 'Soft honey sweetness with a light floral hop', 4.9, 3.6, 5.79),
  ('Imperial Stout', 'Dense dark fruit, molasses, and roasted depth', 9.2, 4.8, 12.50),
  ('Pilsner Classic', 'Crisp noble hops over delicate bready malt', 4.6, 3.8, 5.29),
  ('Red Ale', 'Toasty malt sweetness with mild hop balance', 5.2, 3.9, 6.29)
ON CONFLICT (title) DO NOTHING;
