import { describe, expect, it } from "vitest";
import { buildReconcileReport } from "@/lib/reconcile";
import type { Asset, FacilitiesRecord, FinanceRecord } from "@/lib/types";

const baseAsset: Asset = {
  asset_tag: "C0009001",
  serial: "SN-1",
  model: "Sequencer",
  manufacturer: "Demo",
  asset_class: "instrument",
  state: "in_service",
  location: { site: "Irvine", room: "B12", row: null, rack: "R4", ru: "12" },
  custodian: "tech-jane",
  parent_asset_tag: null,
  procurement_note: null,
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z",
};

const facility: FacilitiesRecord = {
  space_id: "S1",
  tagged_id: "C0009001",
  rack_location: "Irvine/B12/R4/U12",
  last_observed: "2026-05-01T00:00:00.000Z",
};

const finance: FinanceRecord = {
  finance_id: "EQ-1",
  tag: "C0009001",
  site: "Irvine",
  book_value_usd: 100,
  status: "capitalized",
  capitalized_on: "2026-05-01T00:00:00.000Z",
};

describe("reconciliation classification", () => {
  it("does not flag a deployed asset when downstream systems match", () => {
    const report = buildReconcileReport([baseAsset], [facility], [finance], "2026-05-15T00:00:00.000Z");
    expect(report.summary.needsReview).toBe(0);
    expect(report.summary.clean).toBe(1);
  });

  it("classifies in-service rack mismatch as critical", () => {
    const report = buildReconcileReport(
      [baseAsset],
      [{ ...facility, rack_location: "Irvine/B12/R9/U12" }],
      [finance],
      "2026-05-15T00:00:00.000Z",
    );
    expect(report.issues[0]?.category).toBe("rack_location_mismatch");
    expect(report.issues[0]?.severity).toBe("critical");
  });

  it("treats missing facilities for stored assets as expected", () => {
    const stored: Asset = {
      ...baseAsset,
      state: "stored",
      location: { site: "Irvine", room: "Storage A", row: null, rack: null, ru: null },
    };
    const report = buildReconcileReport([stored], [], [finance], "2026-05-15T00:00:00.000Z");
    expect(report.issues[0]?.category).toBe("expected_difference");
    expect(report.issues[0]?.severity).toBe("info");
    expect(report.summary.needsReview).toBe(0);
  });

  it("includes orphan facilities records", () => {
    const report = buildReconcileReport([], [facility], [], "2026-05-15T00:00:00.000Z");
    expect(report.issues[0]?.category).toBe("orphan_facilities_record");
    expect(report.summary.needsReview).toBe(1);
  });
});
