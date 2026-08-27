import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import api from "../../api/api";

function ExportButton({ disabled = false }) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    try {
      const response = await api.get("/notes/export", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];

      link.href = url;
      link.download = `notes-export-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export notes", err);
      setError("Couldn't export your notes. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        aria-label="Export notes"
        title={disabled ? "No notes to export" : "Export notes"}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#121212]/10 text-sm font-medium text-[#121212] hover:bg-[#121212]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isExporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {isExporting ? "Exporting..." : "Export Notes"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default ExportButton;