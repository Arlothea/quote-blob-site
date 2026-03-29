export function txtToJson(input: string): string {
  const items = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return JSON.stringify(items, null, 2);
}