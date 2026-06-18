// src/hooks/usePdfExport.ts
import { useCallback } from "react";

export interface PdfColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
  width?: number;
}

export interface PdfExportOptions<T> {
  title: string;
  subtitle?: string;
  columns: PdfColumn<T>[];
  data: T[];
  filename?: string;
}

export function usePdfExport() {
  const exportToPdf = useCallback(<T,>(options: PdfExportOptions<T>) => {
    const { title, subtitle, columns, data, filename } = options;

    const PAGE_W = 794;
    const PAGE_H = 1123;
    const MARGIN = 40;
    const COL_PAD = 10;
    const ROW_H = 32;
    const HEADER_H = 36;

    const totalWeight = columns.reduce((s, c) => s + (c.width ?? 1), 0);
    const tableW = PAGE_W - MARGIN * 2;
    const colWidths = columns.map((c) => (tableW * (c.width ?? 1)) / totalWeight);

    const canvas = document.createElement("canvas");
    canvas.width = PAGE_W;

    const contentH = MARGIN * 2 + 90 + HEADER_H + data.length * ROW_H + 40;
    const pages = Math.ceil(contentH / PAGE_H);
    canvas.height = PAGE_H * pages;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = MARGIN;

    // Top accent bar
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(0, 0, PAGE_W, 6);

    // Title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.fillText(title, MARGIN, y + 34);
    y += 44;

    // Subtitle
    if (subtitle) {
      ctx.fillStyle = "#64748b";
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText(subtitle, MARGIN, y + 4);
      y += 20;
    }

    // Export date
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px system-ui, sans-serif";
    const now = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    ctx.fillText(`Exported on ${now}`, MARGIN, y + 4);
    y += 20;

    // Entry count
    ctx.fillStyle = "#475569";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(`${data.length} entr${data.length !== 1 ? "ies" : "y"}`, MARGIN, y + 4);
    y += 24;

    // Separator line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(PAGE_W - MARGIN, y);
    ctx.stroke();
    y += 16;

    // Table header
    ctx.fillStyle = "#1e3a5f";
    ctx.fillRect(MARGIN, y, tableW, HEADER_H);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px system-ui, sans-serif";
    let x = MARGIN + COL_PAD;
    columns.forEach((col, i) => {
      ctx.fillText(col.header, x, y + 23, colWidths[i] - COL_PAD * 2);
      x += colWidths[i];
    });
    y += HEADER_H;

    // Data rows
    data.forEach((row, rowIdx) => {
      ctx.fillStyle = rowIdx % 2 === 0 ? "#f8fafc" : "#ffffff";
      ctx.fillRect(MARGIN, y, tableW, ROW_H);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y + ROW_H);
      ctx.lineTo(PAGE_W - MARGIN, y + ROW_H);
      ctx.stroke();

      ctx.fillStyle = "#334155";
      ctx.font = "13px system-ui, sans-serif";
      x = MARGIN + COL_PAD;
      columns.forEach((col, i) => {
        const val = String(col.accessor(row) ?? "—");
        const maxW = colWidths[i] - COL_PAD * 2;
        let text = val;
        while (ctx.measureText(text).width > maxW && text.length > 1) {
          text = text.slice(0, -1);
        }
        if (text !== val) text += "…";
        ctx.fillText(text, x, y + 21);
        x += colWidths[i];
      });

      y += ROW_H;

      // Page break handling
      if (y + ROW_H > PAGE_H * Math.ceil(y / PAGE_H) - MARGIN) {
        const nextPage = Math.ceil((y + 1) / PAGE_H);
        y = PAGE_H * nextPage + MARGIN;
        ctx.fillStyle = "#1d4ed8";
        ctx.fillRect(0, PAGE_H * (nextPage - 1), PAGE_W, 4);
      }
    });

    // Footer
    for (let p = 0; p < pages; p++) {
      const footerY = PAGE_H * (p + 1) - 20;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText("GestAssoc — Automatic Export", MARGIN, footerY);
      ctx.textAlign = "right";
      ctx.fillText(`Page ${p + 1} / ${pages}`, PAGE_W - MARGIN, footerY);
      ctx.textAlign = "left";
    }

    // Download
    const link = document.createElement("a");
    link.download = `${filename ?? title.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.png`;
    canvas.toBlob((blob) => {
      if (!blob) return;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, "image/png");

  }, []);

  return { exportToPdf };
}