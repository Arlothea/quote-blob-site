import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { CONVERTERS, ConverterAction } from "../converters";

type ConvertBody = {
  filename?: string;
  text?: string;
  targetFormat?: string;
};

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function detectConversion(filename: string, targetFormat: string): ConverterAction | null {
  const ext = getExtension(filename);
  const target = targetFormat.toLowerCase();

  if (ext === ".txt" && target === "json") return "txt-to-json";
  if (ext === ".csv" && target === "json") return "csv-to-json";
  if (ext === ".json" && target === "csv") return "json-to-csv";
  if (ext === ".md" && target === "html") return "md-to-html";
  if (ext === ".csv" && target === "xlsx") return "csv-to-excel";

  return null;
}

function buildOutputFilename(filename: string, targetFormat: string): string {
  const baseName = filename.replace(/\.[^.]+$/, "");
  return `${baseName}_converted.${targetFormat.toLowerCase()}`;
}

function sanitiseFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getContentType(extension: string): string {
  switch (extension.toLowerCase()) {
    case ".json":
      return "application/json; charset=utf-8";
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "text/plain; charset=utf-8";
  }
}

async function uploadBlob(
  containerClient: ReturnType<BlobServiceClient["getContainerClient"]>,
  blobName: string,
  content: string | Buffer,
  contentType: string
): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const buffer = Buffer.isBuffer(content)
    ? content
    : Buffer.from(content, "utf8");

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType
    }
  });
}

export async function convert(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as ConvertBody;

    const filename = body?.filename?.trim() ?? "";
    const text = body?.text ?? "";
    const targetFormat = body?.targetFormat?.trim().toLowerCase() ?? "";

    if (!filename) {
      return {
        status: 400,
        jsonBody: { error: "Missing 'filename' in JSON body." }
      };
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return {
        status: 400,
        jsonBody: { error: "Missing or empty 'text' in JSON body." }
      };
    }

    if (!targetFormat) {
      return {
        status: 400,
        jsonBody: { error: "Missing 'targetFormat' in JSON body." }
      };
    }

    if (text.length > 200_000) {
      return {
        status: 413,
        jsonBody: { error: "File content too large for this demo." }
      };
    }

    const action = detectConversion(filename, targetFormat);

    if (!action) {
      return {
        status: 400,
        jsonBody: {
          error: "Unsupported conversion route. Supported routes are TXT→JSON, CSV→JSON, CSV→EXCEL, JSON→CSV, and MD→HTML."
        }
      };
    }

    const converter = CONVERTERS[action];

    if (!converter) {
      return {
        status: 500,
        jsonBody: { error: `No converter registered for action '${action}'.` }
      };
    }

    let result: string | Buffer;

    try {
      result = await converter(text);
    } catch (err) {
      return {
        status: 400,
        jsonBody: {
          error: err instanceof Error ? err.message : "Conversion failed."
        }
      };
    }

    const outputFilename = buildOutputFilename(filename, targetFormat);

    const storageConnection = process.env.FILES_STORAGE;
    const containerName = process.env.FILES_CONTAINER || "files";

    if (!storageConnection) {
      return {
        status: 500,
        jsonBody: {
          error: "FILES_STORAGE is not configured in Function App settings."
        }
      };
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(storageConnection);

    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const safeInputName = sanitiseFilename(filename);
    const safeOutputName = sanitiseFilename(outputFilename);

    const originalBlobName = `originals/${safeInputName}-${Date.now()}`;
    const convertedBlobName = `converted/${safeOutputName}-${Date.now()}`;

    await uploadBlob(
      containerClient,
      originalBlobName,
      text,
      getContentType(getExtension(filename))
    );

    await uploadBlob(
      containerClient,
      convertedBlobName,
      result,
      getContentType(getExtension(outputFilename))
    );

    return {
      status: 200,
      jsonBody: {
        action,
        outputFilename,
        result: Buffer.isBuffer(result) ? null : result,
        binaryBase64: Buffer.isBuffer(result) ? result.toString("base64") : null,
        isBinary: Buffer.isBuffer(result),
        originalBlobName,
        convertedBlobName
      }
    };
  } catch (err) {
    context.error("Convert function failed", err);

    return {
      status: 400,
      jsonBody: { error: "Invalid request body or storage operation failed." }
    };
  }
}

app.http("convert", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "convert",
  handler: convert
});