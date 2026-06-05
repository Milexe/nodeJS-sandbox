export type DrinkCsvImportRowError = {
  row: number;
  title?: string;
  messages: string[];
};

export type DrinkCsvImportResult = {
  imported: number;
  failed: DrinkCsvImportRowError[];
  catalogTotal: number;
};

export type ParsedDrinkCsvRow = {
  rowNumber: number;
  title: string;
  description?: string;
  abv: number;
  rating?: number;
  price: number;
  imageUrl?: string;
};
