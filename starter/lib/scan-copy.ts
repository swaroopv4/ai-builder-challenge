import { ApiError } from "./api-client";
import { formatLocation } from "./location";
import type { Asset } from "./types";

export function describeScanError(error: unknown, context?: { asset?: Asset | null; scannedSerial?: string }): string {
  if (!(error instanceof ApiError)) {
    return "Upstream is not responding. Keep the asset aside and try again before moving to the next scan.";
  }

  if (error.status === 429) {
    return "The scanner is moving faster than the API limit. Wait a few seconds, then scan this same item again.";
  }

  const asset = context?.asset;
  switch (error.code) {
    case "unknown_asset":
      return "That tag is not in Operations yet. Use Receive first, or check the printed asset label.";
    case "and_match_failed": {
      const existingSerial =
        stringDetail(error.details, "existing_serial") ??
        stringDetail(error.details, "serial") ??
        asset?.serial ??
        "the existing serial";
      const scanned = context?.scannedSerial ?? "the serial you entered";
      return `Tag conflict: ${asset?.asset_tag ?? "this tag"} already exists with serial ${existingSerial}. You scanned ${scanned}. Check the physical label before continuing.`;
    }
    case "invalid_transition":
      return asset
        ? `This action is not allowed while ${asset.asset_tag} is ${asset.state} at ${formatLocation(asset.location)}. Choose the workflow that matches the physical move.`
        : "This action is not allowed from the asset's current state. Scan the tag again to refresh its state.";
    case "incomplete_deploy_location":
      return "Deploying puts an asset into service, so site, room, rack, and RU are required. Scan or enter the missing rack unit before continuing.";
    case "invalid_location":
      return "That location is not usable. Scan JSON, site=... pairs, or a path like Irvine/B12/R4/U12.";
    case "invalid_tag_format":
      return "Asset tags must look like C0009001. Check the barcode label and scan the asset tag again.";
    case "same_custodian":
      return "This asset is already assigned to that person. Scan a different receiving badge.";
    default:
      return `The API rejected this scan (${error.code}). Check the physical item and try the same scan once more.`;
  }
}

function stringDetail(details: Record<string, unknown> | undefined, key: string): string | null {
  const value = details?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}
