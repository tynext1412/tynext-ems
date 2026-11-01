import { strToU8, zipSync } from "fflate";

// Penulis .xlsx minimal (Office Open XML) tanpa pustaka spreadsheet: tiap sheet berisi baris
// keterangan (label: nilai), baris kosong, lalu tabel dengan header tebal yang dibekukan.
// Angka ditulis sebagai sel angka (bisa dihitung di Excel), teks sebagai inline string.

export type CellValue = string | number | null | undefined;

export interface SheetSpec {
  name: string; // maks. 31 karakter; karakter terlarang diganti
  meta?: [string, CellValue][]; // baris keterangan di atas tabel (mis. Plant, Period)
  columns: string[];
  rows: CellValue[][];
}

const INVALID_SHEET_CHARS = /[[\]:*?/\\]/g;

export function sheetName(name: string, taken: ReadonlySet<string> = new Set()): string {
  const base = name.replace(INVALID_SHEET_CHARS, "-").trim().slice(0, 31) || "Sheet";
  let candidate = base;
  for (let i = 2; taken.has(candidate.toLowerCase()); i++) candidate = `${base.slice(0, 31 - String(i).length - 1)} ${i}`;
  return candidate;
}

export function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Karakter kontrol selain tab, LF, dan CR tidak sah di XML 1.0.
function stripControl(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 || code === 0x09 || code === 0x0a || code === 0x0d) out += ch;
  }
  return out;
}

function escapeXml(text: string): string {
  return stripControl(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Gaya (indeks cellXfs di styles.xml): 0 normal, 1 label keterangan (tebal), 2 header tabel.
const STYLE_META_LABEL = 1;
const STYLE_HEADER = 2;

function cell(ref: string, value: CellValue, style = 0): string {
  const s = style ? ` s="${style}"` : "";
  if (value === null || value === undefined || value === "") return style ? `<c r="${ref}"${s}/>` : "";
  if (typeof value === "number") return Number.isFinite(value) ? `<c r="${ref}"${s}><v>${value}</v></c>` : "";
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function textWidth(value: CellValue): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? String(Math.round(value * 100) / 100).length : value.length;
}

function sheetXml(spec: SheetSpec): string {
  const rows: string[] = [];
  let r = 1;
  for (const [label, value] of spec.meta ?? []) {
    rows.push(`<row r="${r}">${cell(`A${r}`, label, STYLE_META_LABEL)}${cell(`B${r}`, value)}</row>`);
    r++;
  }
  if (spec.meta?.length) r++; // baris kosong pemisah
  const headerRow = r;
  rows.push(`<row r="${r}">${spec.columns.map((c, i) => cell(`${columnLetter(i)}${r}`, c, STYLE_HEADER)).join("")}</row>`);
  r++;
  for (const row of spec.rows) {
    rows.push(`<row r="${r}">${row.map((v, i) => cell(`${columnLetter(i)}${r}`, v)).join("")}</row>`);
    r++;
  }

  // Lebar kolom dari isi terpanjang (header, data, dan label keterangan di kolom A/B), 8–48 karakter.
  const count = Math.max(spec.columns.length, spec.meta?.length ? 2 : 0);
  const widths = Array.from({ length: count }, (_, i) => {
    let w = textWidth(spec.columns[i]);
    for (const row of spec.rows) w = Math.max(w, textWidth(row[i]));
    for (const m of spec.meta ?? []) w = Math.max(w, textWidth(m[i]));
    return Math.min(48, Math.max(8, w + 2));
  });
  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
  const pane = `<pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/>`;

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${rows.join("")}</sheetData>` +
    `</worksheet>`
  );
}

const STYLES_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
  `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFEFEFF0"/><bgColor indexed="64"/></patternFill></fill></fills>` +
  `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>` +
  `<border><left/><right/><top/><bottom style="thin"><color rgb="FFCDCDCE"/></bottom><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="3">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`;

// Susun berkas .xlsx (zip) dari daftar sheet.
export function buildXlsx(sheets: readonly SheetSpec[]): Uint8Array {
  if (sheets.length === 0) throw new Error("Workbook needs at least one sheet");
  const taken = new Set<string>();
  const names = sheets.map((s) => {
    const n = sheetName(s.name, taken);
    taken.add(n.toLowerCase());
    return n;
  });

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
        `</Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>${names.map((n, i) => `<sheet name="${escapeXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
        `</workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
        `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    ),
    "xl/styles.xml": strToU8(STYLES_XML),
  };
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s));
  });
  return zipSync(files, { level: 6 });
}

// Unduh workbook di browser.
export function downloadXlsx(filename: string, sheets: readonly SheetSpec[]): void {
  const bytes = buildXlsx(sheets);
  const blob = new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Nama berkas aman: huruf, angka, titik, minus, garis bawah.
export function safeFilename(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join("_")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
