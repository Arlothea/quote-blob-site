import ExcelJS from "exceljs";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(csv: string): string[][] {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(line => line.trim().length > 0);

  return lines.map(parseCsvLine);
}

export async function csvToExcel(input: string): Promise<Buffer> {
  const rows = parseCsv(input);

  if (rows.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Converted CSV");

  rows.forEach(row => {
    worksheet.addRow(row);
  });

  worksheet.getRow(1).font = { bold: true };

  worksheet.columns.forEach(column => {
    let maxLength = 10;

    column.eachCell?.({ includeEmpty: true }, cell => {
      const value = cell.value ? String(cell.value) : "";
      maxLength = Math.max(maxLength, value.length + 2);
    });

    column.width = maxLength;
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}