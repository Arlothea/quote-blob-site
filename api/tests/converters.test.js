const test = require("node:test");
const assert = require("node:assert/strict");

const { txtToJson } = require("../dist/converters/txtToJson");
const { csvToJson } = require("../dist/converters/csvToJson");
const { jsonToCsv } = require("../dist/converters/jsonToCsv");
const { markdownToHtml } = require("../dist/converters/markdownToHtml");

test("txtToJson converts newline-separated text into a JSON array", () => {
  const input = "apple\nbanana\norange";
  const result = txtToJson(input);

  assert.equal(
    result,
    JSON.stringify(["apple", "banana", "orange"], null, 2)
  );
});

test("txtToJson ignores empty lines", () => {
  const input = "apple\n\nbanana\n   \norange";
  const result = txtToJson(input);

  assert.equal(
    result,
    JSON.stringify(["apple", "banana", "orange"], null, 2)
  );
});

test("csvToJson converts CSV rows into JSON objects", () => {
  const input = "name,course,level\nJamie,Cloud Platforms,5";
  const result = csvToJson(input);

  assert.equal(
    result,
    JSON.stringify(
      [
        {
          name: "Jamie",
          course: "Cloud Platforms",
          level: "5"
        }
      ],
      null,
      2
    )
  );
});

test("csvToJson throws an error when row length does not match headers", () => {
  const input = "name,course\nJamie";
  assert.throws(() => csvToJson(input), /does not match the header column count/i);
});

test("jsonToCsv converts a JSON array of objects into CSV", () => {
  const input = JSON.stringify([
    { name: "Ignacy", score: 10 },
    { name: "Asha", score: 12 }
  ]);

  const result = jsonToCsv(input);

  assert.equal(result, "name,score\nIgnacy,10\nAsha,12");
});

test("jsonToCsv throws an error for invalid JSON", () => {
  const input = "{ bad json }";
  assert.throws(() => jsonToCsv(input), /invalid json input/i);
});

test("jsonToCsv throws an error if JSON is not an array", () => {
  const input = JSON.stringify({ name: "Jamie", score: 10 });
  assert.throws(() => jsonToCsv(input), /must be a non-empty array of objects/i);
});

test("markdownToHtml converts headings and paragraphs", () => {
  const input = "# Title\nThis is a paragraph.\n## Subtitle\nAnother line.";
  const result = markdownToHtml(input);

  assert.equal(
    result,
    "<h1>Title</h1>\n<p>This is a paragraph.</p>\n<h2>Subtitle</h2>\n<p>Another line.</p>"
  );
});