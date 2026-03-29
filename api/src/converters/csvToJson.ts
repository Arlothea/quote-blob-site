export function csvToJson(input: string): string {
  const lines = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must contain a header row and at least one data row.");
  }

  const headers = lines[0].split(",").map(h => h.trim());
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());

    if (values.length !== headers.length) {
      throw new Error(`CSV row ${i + 1} does not match the header column count.`);
    }

    const row: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }

    result.push(row);
  }

  return JSON.stringify(result, null, 2);
}