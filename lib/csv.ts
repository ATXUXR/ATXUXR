/** Client-side CSV download — admin tables use this. */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const esc = (v: unknown) =>
    '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
