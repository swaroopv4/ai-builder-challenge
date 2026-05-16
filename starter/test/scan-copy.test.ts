import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-client";
import { describeScanError } from "@/lib/scan-copy";

describe("scan error copy", () => {
  it("uses actionable copy for missing RU", () => {
    expect(describeScanError(new ApiError(422, "incomplete_deploy_location", "bad"))).toContain("RU");
  });

  it("uses same custodian recovery copy", () => {
    expect(describeScanError(new ApiError(422, "same_custodian", "bad"))).toContain("Scan a different receiving badge");
  });
});
