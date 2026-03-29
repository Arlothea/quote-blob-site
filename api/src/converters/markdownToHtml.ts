export function markdownToHtml(input: string): string {
  const lines = input.split(/\r?\n/);
  const output: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

    if (line.startsWith("# ")) {
      output.push(`<h1>${line.slice(2)}</h1>`);
    } else if (line.startsWith("## ")) {
      output.push(`<h2>${line.slice(3)}</h2>`);
    } else {
      output.push(`<p>${line}</p>`);
    }
  }

  return output.join("\n");
}