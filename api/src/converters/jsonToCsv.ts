export function jsonToCsv(input: string): string {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("Invalid JSON input.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("JSON input must be a non-empty array of objects.");
  }

  const firstItem = parsed[0];

  if (typeof firstItem !== "object" || firstItem === null || Array.isArray(firstItem)) {
    throw new Error("JSON array must contain objects.");
  }

  const headers = Object.keys(firstItem as Record<string, unknown>);
  const rows = [headers.join(",")];

  for (const item of parsed) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error("JSON array must contain only objects.");
    }

    const obj = item as Record<string, unknown>;
    const values = headers.map(header => String(obj[header] ?? ""));
    rows.push(values.join(","));
  }

  return rows.join("\n");
}