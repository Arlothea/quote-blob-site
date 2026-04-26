const FUNCTION_BASE_URL =
  "https://quotesapptutorial-cmh9h5dafyfnene9.francecentral-01.azurewebsites.net";

/* =========================================================
   PART 1: Quotes App (existing feature)
   ========================================================= */

const btn = document.getElementById("btn");
const quoteEl = document.getElementById("quote");
const statusEl = document.getElementById("status");

if (btn && quoteEl && statusEl) {
  btn.addEventListener("click", async () => {
    statusEl.textContent = "Fetching...";
    btn.disabled = true;

    try {
      const res = await fetch(`${FUNCTION_BASE_URL}/api/quote`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      quoteEl.textContent = data.quote ?? "No quote returned.";
      statusEl.textContent = "";
    } catch (err) {
      quoteEl.textContent = "Could not fetch a quote.";
      statusEl.textContent = String(err);
    } finally {
      btn.disabled = false;
    }
  });
}

/* =========================================================
   PART 2: Existing text formatter with file download
   ========================================================= */

const fileInput = document.getElementById("fileInput");
const btnFormat = document.getElementById("btnFormat");
const btnDownload = document.getElementById("btnDownload");
const formatStatusEl = document.getElementById("formatStatus");
const outputEl = document.getElementById("output");

let selectedFile = null;
let downloadedFilename = "formatted.txt";

if (fileInput && btnFormat && btnDownload && formatStatusEl && outputEl) {
  fileInput.addEventListener("change", () => {
    selectedFile = fileInput.files?.[0] ?? null;
    outputEl.value = "";
    btnDownload.disabled = true;

    if (!selectedFile) {
      btnFormat.disabled = true;
      formatStatusEl.textContent = "";
      return;
    }

    const nameOk = selectedFile.name.toLowerCase().endsWith(".txt");
    const typeOk = (selectedFile.type || "").startsWith("text/");
    const isText = nameOk || typeOk;
    const maxBytes = 200 * 1024;

    if (!isText) {
      btnFormat.disabled = true;
      formatStatusEl.textContent = "Please select a plain text (.txt) file.";
      selectedFile = null;
      return;
    }

    if (selectedFile.size > maxBytes) {
      btnFormat.disabled = true;
      formatStatusEl.textContent = "File is too large for this demo (max 200KB).";
      selectedFile = null;
      return;
    }

    btnFormat.disabled = false;
    formatStatusEl.textContent = `Selected: ${selectedFile.name} (${selectedFile.size} bytes)`;
  });

  btnFormat.addEventListener("click", async () => {
    if (!selectedFile) return;

    btnFormat.disabled = true;
    btnDownload.disabled = true;
    formatStatusEl.textContent = "Sending text to the API...";

    try {
      const text = await selectedFile.text();

      const res = await fetch(`${FUNCTION_BASE_URL}/api/format`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          text
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error (${res.status}): ${errText}`);
      }

      const data = await res.json();

      convertedDownloadFilename = data.outputFilename ?? "converted.txt";

      if (data.isBinary) {
        console.log("Binary response:", data);
        
        convertOutputEl.value =
          "Excel file converted successfully. Click download to save the Excel file.";

        convertedDownloadFilename = data.outputFilename ?? "converted.xlsx";
        btnConvertDownload.disabled = !data.binaryBase64;
        btnConvertDownload.dataset.binaryBase64 = data.binaryBase64 || "";

        convertStatusEl.textContent =
          `Done. Route used: ${data.action}. Stored as ${data.originalBlobName} and ${data.convertedBlobName}. You can now download the Excel file.`;
      } else {
        convertOutputEl.value = data.result ?? "";
        btnConvertDownload.disabled = convertOutputEl.value.length === 0;

        convertStatusEl.textContent =
          `Done. Route used: ${data.action}. Stored as ${data.originalBlobName} and ${data.convertedBlobName}. You can now download the converted file.`;
      }
    } catch (err) {
      outputEl.value = "";
      btnDownload.disabled = true;
      formatStatusEl.textContent = `Failed: ${err.message}`;
    } finally {
      btnFormat.disabled = !selectedFile;
    }
  });

  btnDownload.addEventListener("click", () => {
    const blob = new Blob([outputEl.value], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadedFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

/* =========================================================
   PART 3: New file converter with separate upload/download
   ========================================================= */

const convertFileInput = document.getElementById("convertFileInput");
const targetFormatEl = document.getElementById("targetFormat");
const btnConvert = document.getElementById("btnConvert");
const btnConvertDownload = document.getElementById("btnConvertDownload");
const convertStatusEl = document.getElementById("convertStatus");
const convertOutputEl = document.getElementById("convertOutput");

let selectedConvertFile = null;
let convertedDownloadFilename = "converted.txt";

function getExtension(filename) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function isSupportedInputFile(file) {
  const allowedExtensions = [".txt", ".csv", ".json", ".md"];
  const ext = getExtension(file.name);
  return allowedExtensions.includes(ext);
}

function isValidConversion(file, targetFormat) {
  const ext = getExtension(file.name);

  if (ext === ".txt" && targetFormat === "json") return true;
  if (ext === ".csv" && targetFormat === "json") return true;
  if (ext === ".json" && targetFormat === "csv") return true;
  if (ext === ".md" && targetFormat === "html") return true;
  if (ext === ".csv" && targetFormat === "xlsx") return true;

  return false;
}

function updateConvertButtonState() {
  if (!selectedConvertFile || !targetFormatEl.value) {
    btnConvert.disabled = true;
    return;
  }

  btnConvert.disabled = !isValidConversion(selectedConvertFile, targetFormatEl.value);
}

if (
  convertFileInput &&
  targetFormatEl &&
  btnConvert &&
  btnConvertDownload &&
  convertStatusEl &&
  convertOutputEl
) {
  convertFileInput.addEventListener("change", () => {
    selectedConvertFile = convertFileInput.files?.[0] ?? null;
    convertOutputEl.value = "";
    btnConvertDownload.disabled = true;
    delete btnConvertDownload.dataset.binaryBase64;

    if (!selectedConvertFile) {
      convertStatusEl.textContent = "";
      btnConvert.disabled = true;
      return;
    }

    const maxBytes = 200 * 1024;

    if (!isSupportedInputFile(selectedConvertFile)) {
      convertStatusEl.textContent =
        "Unsupported file type. Please upload a .txt, .csv, .json, or .md file.";
      selectedConvertFile = null;
      btnConvert.disabled = true;
      return;
    }

    if (selectedConvertFile.size > maxBytes) {
      convertStatusEl.textContent = "File is too large for this demo (max 200KB).";
      selectedConvertFile = null;
      btnConvert.disabled = true;
      return;
    }

    const targetFormat = targetFormatEl.value;

    if (targetFormat && !isValidConversion(selectedConvertFile, targetFormat)) {
      convertStatusEl.textContent =
        `Selected file: ${selectedConvertFile.name}. That conversion route is not supported.`;
    } else {
      convertStatusEl.textContent =
        `Selected: ${selectedConvertFile.name} (${selectedConvertFile.size} bytes)`;
    }

    updateConvertButtonState();
  });

  targetFormatEl.addEventListener("change", () => {
    convertOutputEl.value = "";
    btnConvertDownload.disabled = true;
    delete btnConvertDownload.dataset.binaryBase64;

    if (!selectedConvertFile) {
      convertStatusEl.textContent = "Please choose a file first.";
      btnConvert.disabled = true;
      return;
    }

    if (!targetFormatEl.value) {
      convertStatusEl.textContent = "Please choose a target format.";
      btnConvert.disabled = true;
      return;
    }

    if (!isValidConversion(selectedConvertFile, targetFormatEl.value)) {
      convertStatusEl.textContent =
        "That conversion route is not supported. Supported routes are TXT→JSON, CSV→JSON, JSON→CSV, CSV→EXCEL and MD→HTML.";
      btnConvert.disabled = true;
      return;
    }

    convertStatusEl.textContent =
      `Ready to convert ${selectedConvertFile.name} to ${targetFormatEl.value.toUpperCase()}.`;
    updateConvertButtonState();
  });

  btnConvert.addEventListener("click", async () => {
    if (!selectedConvertFile) return;
    if (!targetFormatEl.value) return;

    btnConvert.disabled = true;
    btnConvertDownload.disabled = true;
    delete btnConvertDownload.dataset.binaryBase64;
    convertStatusEl.textContent = "Sending file to the conversion API...";

    try {
      const text = await selectedConvertFile.text();

      const res = await fetch(`${FUNCTION_BASE_URL}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedConvertFile.name,
          text,
          targetFormat: targetFormatEl.value
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error (${res.status}): ${errText}`);
      }

      const data = await res.json();

      convertOutputEl.value = data.result ?? "";
      convertedDownloadFilename = data.outputFilename ?? "converted.txt";
      btnConvertDownload.disabled = convertOutputEl.value.length === 0;

      convertStatusEl.textContent =
        `Done. Route used: ${data.action}. Stored as ${data.originalBlobName} and ${data.convertedBlobName}. You can now download the converted file.`;
    } catch (err) {
      convertOutputEl.value = "";
      btnConvertDownload.disabled = true;
      delete btnConvertDownload.dataset.binaryBase64;
      convertStatusEl.textContent = `Failed: ${err.message}`;
    } finally {
      updateConvertButtonState();
    }
  });

  btnConvertDownload.addEventListener("click", () => {
    const binaryBase64 = btnConvertDownload.dataset.binaryBase64;

    if (binaryBase64) {
      const binaryString = atob(binaryBase64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = convertedDownloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      return;
    }

    let contentType = "text/plain;charset=utf-8";

    if (convertedDownloadFilename.toLowerCase().endsWith(".json")) {
      contentType = "application/json;charset=utf-8";
    } else if (convertedDownloadFilename.toLowerCase().endsWith(".csv")) {
      contentType = "text/csv;charset=utf-8";
    } else if (convertedDownloadFilename.toLowerCase().endsWith(".html")) {
      contentType = "text/html;charset=utf-8";
    }

    const blob = new Blob([convertOutputEl.value], { type: contentType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = convertedDownloadFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  });
}