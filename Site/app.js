const FUNCTION_BASE_URL = 

  "https://quotesapptutorial-cmh9h5dafyfnene9.francecentral-01.azurewebsites.net"; 

 

/* ========================================================= 

   PART 1: Quotes App (existing feature) 

   ========================================================= */ 

 

const btn = document.getElementById("btn"); 

const quoteEl = document.getElementById("quote"); 

const statusEl = document.getElementById("status"); 

 

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

 

/* ========================================================= 

   PART 2: Sentence Case Formatter (new feature) 

   Requires these elements in index.html: 

   - fileInput (input type="file") 

   - btnFormat (button) 

   - btnCopy (button) 

   - formatStatus (p or span) 

   - output (textarea) 

   ========================================================= */ 

 

const fileInput = document.getElementById("fileInput"); 

const btnFormat = document.getElementById("btnFormat"); 

const btnCopy = document.getElementById("btnCopy"); 

const formatStatusEl = document.getElementById("formatStatus"); 

const outputEl = document.getElementById("output"); 

 

let selectedFile = null; 

 

// If the formatter UI isn't on the page yet, quietly do nothing. 

// This allows you to merge the JS before you add the HTML. 

if (fileInput && btnFormat && btnCopy && formatStatusEl && outputEl) { 

  fileInput.addEventListener("change", () => { 

    selectedFile = fileInput.files?.[0] ?? null; 

    outputEl.value = ""; 

    btnCopy.disabled = true; 

 

    if (!selectedFile) { 

      btnFormat.disabled = true; 

      formatStatusEl.textContent = ""; 

      return; 

    } 

 

    // Basic validation 

    const const nameOk = selectedFile.name.toLowerCase().endsWith(".txt"); 

    const typeOk = (selectedFile.type || "").startsWith("text/"); 

    const isText = nameOk || typeOk; 

    const maxBytes = 200 * 1024; // 200KB for a demo 

 

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

    formatStatusEl.textContent = "Sending text to the API..."; 

 

    try { 

      const text = await selectedFile.text(); 

 

      const res = await fetch(`${FUNCTION_BASE_URL}/api/sentencecase`, { 

        method: "POST", 

        headers: { "Content-Type": "application/json" }, 

        body: JSON.stringify({ text }) 

      }); 

 

      if (!res.ok) { 

        const errText = await res.text(); 

        throw new Error(`API error (${res.status}): ${errText}`); 

      } 

 

      const data = await res.json(); 

      outputEl.value = data.result ?? ""; 

      btnCopy.disabled = outputEl.value.length === 0; 

 

      formatStatusEl.textContent = "Done."; 

    } catch (err) { 

      formatStatusEl.textContent = `Failed: ${err.message}`; 

    } finally { 

      btnFormat.disabled = !selectedFile; 

    } 

  }); 

 

  btnCopy.addEventListener("click", async () => { 

    await navigator.clipboard.writeText(outputEl.value); 

    formatStatusEl.textContent = "Copied output to clipboard."; 

  }); 

} 