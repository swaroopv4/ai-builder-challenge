import { describe, expect, it } from "vitest";
import {
  formatRackLocation,
  isDeployLocationComplete,
  parseLocationScan,
} from "@/lib/location";

describe("location scan parser", () => {
  it("parses JSON payloads", () => {
    const result = parseLocationScan('{"site":"Irvine","room":"B12","rack":"R4","ru":"12"}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.location).toMatchObject({
        site: "Irvine",
        room: "B12",
        rack: "R4",
        ru: "12",
      });
    }
  });

  it("parses key-value payloads", () => {
    const result = parseLocationScan("site=Irvine;room=B12;rack=R4;ru=U12");
    expect(result.ok).toBe(true);
    if (result.ok) expect(formatRackLocation(result.location)).toBe("Irvine/B12/R4/U12");
  });

  it("parses storage-friendly slash payloads without RU", () => {
    const result = parseLocationScan("Irvine/Storage A");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.location.room).toBe("Storage A");
      expect(isDeployLocationComplete(result.location)).toBe(false);
    }
  });
});
