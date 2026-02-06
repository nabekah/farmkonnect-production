/**
 * CSV Import/Export utilities for bulk data operations
 */

export interface CSVRow {
  [key: string]: string | number | boolean | null;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: CSVRow[], filename: string) {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse CSV file and return array of objects
 */
export function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');

        if (lines.length < 2) {
          reject(new Error('CSV file must have at least headers and one data row'));
          return;
        }

        // Parse headers
        const headers = parseCSVLine(lines[0]);

        // Parse data rows
        const data: CSVRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines

          const values = parseCSVLine(line);
          const row: CSVRow = {};

          headers.forEach((header, index) => {
            row[header] = values[index] ?? '';
          });

          data.push(row);
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Validate CSV data against schema
 */
export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export function validateCSVData(data: CSVRow[], rules: ValidationRule[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  data.forEach((row, rowIndex) => {
    rules.forEach(rule => {
      const value = row[rule.field];

      // Check required
      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push(`Row ${rowIndex + 1}: ${rule.field} is required`);
        return;
      }

      if (value === null || value === undefined || value === '') {
        return; // Skip validation for empty optional fields
      }

      // Type validation
      switch (rule.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`Row ${rowIndex + 1}: ${rule.field} must be a number`);
          } else {
            const num = Number(value);
            if (rule.min !== undefined && num < rule.min) {
              errors.push(`Row ${rowIndex + 1}: ${rule.field} must be >= ${rule.min}`);
            }
            if (rule.max !== undefined && num > rule.max) {
              errors.push(`Row ${rowIndex + 1}: ${rule.field} must be <= ${rule.max}`);
            }
          }
          break;

        case 'date':
          if (isNaN(Date.parse(String(value)))) {
            errors.push(`Row ${rowIndex + 1}: ${rule.field} must be a valid date`);
          }
          break;

        case 'string':
          if (rule.pattern && !rule.pattern.test(String(value))) {
            errors.push(`Row ${rowIndex + 1}: ${rule.field} format is invalid`);
          }
          break;
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
