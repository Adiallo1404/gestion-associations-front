import { useState } from "react";
import { usePdfExport } from "../hooks/usePdfExport";          // ✅
import type { PdfExportOptions } from "../hooks/usePdfExport"; // ✅

interface Props<T> {
  options: PdfExportOptions<T>;
  isMobile?: boolean;
}

export default function ExportPdfButton<T>({ options, isMobile = false }: Props<T>) {
  const { exportToPdf } = usePdfExport();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 50));
      await exportToPdf(options);
    } catch (err) {
      console.error("Erreur export PDF", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: isMobile ? "8px 10px" : "8px 16px",
        background: loading ? "#e2e8f0" : "#0f172a",
        color: loading ? "#94a3b8" : "#fff",
        border: "none", borderRadius: 8,
        cursor: loading ? "default" : "pointer",
        fontSize: isMobile ? 12 : 13, fontWeight: 600,
        transition: "background 0.15s", whiteSpace: "nowrap",
      }}
    >
      {loading ? "⏳" : "📥"}{" "}
      {!isMobile && (loading ? "Export..." : "Export PDF")}
    </button>
  );
}