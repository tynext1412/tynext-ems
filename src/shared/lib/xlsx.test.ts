import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { buildXlsx, columnLetter, safeFilename, sheetName } from "./xlsx";

describe("xlsx writer", () => {
  it("names columns and sheets the way Excel expects", () => {
    expect([0, 25, 26, 27, 701, 702].map(columnLetter)).toEqual(["A", "Z", "AA", "AB", "ZZ", "AAA"]);
    expect(sheetName("Energy / Day [kWh]")).toBe("Energy - Day -kWh-");
    expect(sheetName("A very long sheet name that exceeds the limit")).toHaveLength(31);
    expect(sheetName("Data", new Set(["data"]))).toBe("Data 2");
    expect(safeFilename("Pabrik Kelapa Sawit Siak", "Day", "2026-11-02")).toBe("Pabrik-Kelapa-Sawit-Siak_Day_2026-11-02");
  });

  it("packs sheets with meta rows, a frozen bold header, numeric cells and escaped text", () => {
    const bytes = buildXlsx([
      { name: "Operating Data", meta: [["Plant", "A & B <Siak>\u0007"]], columns: ["Parameter", "Value"], rows: [["PV Production", 1234.5], ["Diesel", null], ["Bad", Number.NaN]] },
      { name: "Operating Data", columns: ["Time"], rows: [["00:00"]] },
    ]);
    const files = unzipSync(bytes);
    expect(Object.keys(files).sort()).toEqual(["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]);

    const workbook = strFromU8(files["xl/workbook.xml"]);
    expect(workbook).toContain('name="Operating Data"');
    expect(workbook).toContain('name="Operating Data 2"'); // nama sheet unik

    const sheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
    expect(sheet).toContain("A &amp; B &lt;Siak&gt;");
    expect(sheet).toContain('<c r="B4"><v>1234.5</v></c>'); // meta (baris 1) + kosong (2) + header (3) → data di baris 4
    expect(sheet).toContain('<c r="A3" s="2" t="inlineStr">'); // header tebal
    expect(sheet).toContain('ySplit="3"');
    expect(sheet).not.toContain("NaN");
    expect(sheet).not.toContain('r="B5"'); // sel kosong tidak ditulis
  });
});
