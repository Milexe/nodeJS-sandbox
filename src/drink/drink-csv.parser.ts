import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportDrinkCsvRowDto } from './dto/import-drink-csv-row.dto';
import type { ParsedDrinkCsvRow } from './drink-csv.types';

const REQUIRED_HEADERS = ['title', 'abv', 'price'] as const;

const HEADER_ALIASES: Record<string, string> = {
  image: 'imageurl',
  image_url: 'imageurl',
  imageurl: 'imageurl',
};

function normalizeHeader(value: string): string {
  const normalized = value.trim().toLowerCase();
  return HEADER_ALIASES[normalized] ?? normalized;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function parseCsvRecords(content: string): string[][] {
  const normalized = content.replace(/^\uFEFF/, '').trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

function rowToRecord(
  headers: string[],
  values: string[],
): Record<string, string> {
  const record: Record<string, string> = {};

  headers.forEach((header, index) => {
    record[header] = values[index]?.trim() ?? '';
  });

  return record;
}

async function validateRow(
  rowNumber: number,
  record: Record<string, string>,
): Promise<{ row?: ParsedDrinkCsvRow; errors: string[] }> {
  const dto = plainToInstance(ImportDrinkCsvRowDto, {
    title: record.title,
    description: record.description || undefined,
    abv: record.abv,
    rating: record.rating || undefined,
    price: record.price,
    imageUrl: record.imageurl || undefined,
  });

  const validationErrors = await validate(dto);
  if (validationErrors.length > 0) {
    const messages = validationErrors.flatMap((error) =>
      error.constraints ? Object.values(error.constraints) : [],
    );
    return { errors: messages.length > 0 ? messages : ['Invalid row data.'] };
  }

  return {
    row: {
      rowNumber,
      title: dto.title.trim(),
      description: dto.description?.trim() || undefined,
      abv: dto.abv,
      rating: dto.rating,
      price: dto.price,
      imageUrl: dto.imageUrl,
    },
    errors: [],
  };
}

export async function parseDrinkCsv(content: string): Promise<{
  validRows: ParsedDrinkCsvRow[];
  invalidRows: Array<{ row: number; title?: string; messages: string[] }>;
}> {
  const records = parseCsvRecords(content);
  if (records.length === 0) {
    throw new BadRequestException('CSV file is empty.');
  }

  const headers = records[0].map(normalizeHeader);
  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headers.includes(requiredHeader)) {
      throw new BadRequestException(
        `CSV must include columns: title, abv, price (optional: description, rating, imageUrl).`,
      );
    }
  }

  const validRows: ParsedDrinkCsvRow[] = [];
  const invalidRows: Array<{
    row: number;
    title?: string;
    messages: string[];
  }> = [];
  const titlesInFile = new Set<string>();

  for (let index = 1; index < records.length; index += 1) {
    const rowNumber = index + 1;
    const record = rowToRecord(headers, records[index]);
    const { row, errors } = await validateRow(rowNumber, record);

    if (errors.length > 0 || !row) {
      invalidRows.push({
        row: rowNumber,
        title: record.title || undefined,
        messages: errors,
      });
      continue;
    }

    const titleKey = row.title.toLowerCase();
    if (titlesInFile.has(titleKey)) {
      invalidRows.push({
        row: rowNumber,
        title: row.title,
        messages: ['Duplicate title in CSV file.'],
      });
      continue;
    }

    titlesInFile.add(titleKey);
    validRows.push(row);
  }

  if (validRows.length === 0 && invalidRows.length === 0) {
    throw new BadRequestException('CSV file has headers but no data rows.');
  }

  return { validRows, invalidRows };
}
