import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import api from "../../api/api";

function ImportButton({ onImportSuccess }) {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const isJson = file.type === "application/json" || file.name.endsWith(".json");
  const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");

  if (!isJson && !isTxt) {
    setError("Please select a valid JSON or TXT file.");
    e.target.value = "";
    return;
  }

  setIsImporting(true);
  setError(null);
  setResult(null);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post("/notes/import", formData);

    const { imported = 0, skipped = 0 } = response.data || {};
    setResult({ imported, skipped });
    onImportSuccess?.();
  } catch (err) {
    console.error("Failed to import notes", err);
    setError("Couldn't import notes. Please check the file and try again.");
  } finally {
    setIsImporting(false);
    e.target.value = "";
  }
}

  return (
    <div className="flex flex-col items-start">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json,text/plain,.txt"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Select JSON or TXT file to import"
        title="Import notes"
      />
      <button
        onClick={handleButtonClick}
        disabled={isImporting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F4C430] text-[#121212] text-sm font-medium hover:bg-[#F4C430]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isImporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Upload size={16} />
        )}
        {isImporting ? "Importing..." : "Import Notes"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {result && (
        <p className="text-xs text-[#121212]/70 mt-1">
          Imported {result.imported} note{result.imported !== 1 ? "s" : ""}
          {result.skipped > 0 ? `, skipped ${result.skipped} note${result.skipped !== 1 ? "s" : ""}` : ""}.
        </p>
      )}
    </div>
  );
}

export default ImportButton;