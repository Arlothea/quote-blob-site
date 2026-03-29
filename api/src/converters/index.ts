import { txtToJson } from "./txtToJson";
import { csvToJson } from "./csvToJson";
import { jsonToCsv } from "./jsonToCsv";
import { markdownToHtml } from "./markdownToHtml";

export type ConverterAction =
  | "txt-to-json"
  | "csv-to-json"
  | "json-to-csv"
  | "md-to-html";

export type ConverterFn = (input: string) => string;

export const CONVERTERS: Record<ConverterAction, ConverterFn> = {
  "txt-to-json": txtToJson,
  "csv-to-json": csvToJson,
  "json-to-csv": jsonToCsv,
  "md-to-html": markdownToHtml
};