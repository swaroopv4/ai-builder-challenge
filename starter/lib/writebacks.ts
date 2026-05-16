import { ApiError, api } from "./api-client";
import { formatRackLocation } from "./location";
import type { Asset, DeployScanInput, StoreScanInput } from "./types";

export type SyncStatus = "success" | "failed" | "skipped";

export type CombinedOperationResult = {
  ok: boolean;
  asset: Asset | null;
  sync: {
    operations: SyncStatus;
    facilities: SyncStatus;
    finance: SyncStatus;
  };
  warnings: string[];
};

function failedWarning(system: string, error: unknown): string {
  if (error instanceof ApiError) {
    return `${system} did not sync (${error.code}).`;
  }
  if (error instanceof Error) return `${system} did not sync (${error.message}).`;
  return `${system} did not sync.`;
}

export async function deployWithWritebacks(
  input: DeployScanInput,
): Promise<CombinedOperationResult> {
  const result: CombinedOperationResult = {
    ok: false,
    asset: null,
    sync: { operations: "failed", facilities: "skipped", finance: "skipped" },
    warnings: [],
  };

  const asset = await api.scans.deploy(input);
  result.ok = true;
  result.asset = asset;
  result.sync.operations = "success";

  try {
    await api.mock.updateFacilities({
      tagged_id: asset.asset_tag,
      rack_location: formatRackLocation(asset.location),
    });
    result.sync.facilities = "success";
  } catch (error) {
    result.sync.facilities = "failed";
    result.warnings.push(failedWarning("Facilities", error));
  }

  try {
    await api.mock.updateFinance({
      tag: asset.asset_tag,
      site: asset.location.site,
      status: "capitalized",
      capitalized_on: new Date().toISOString(),
    });
    result.sync.finance = "success";
  } catch (error) {
    result.sync.finance = "failed";
    result.warnings.push(failedWarning("Finance", error));
  }

  return result;
}

export async function storeWithWritebacks(
  input: StoreScanInput,
): Promise<CombinedOperationResult & { previousState: Asset["state"] | null }> {
  const before = await api.assets.get(input.asset_tag);
  const result: CombinedOperationResult & { previousState: Asset["state"] | null } = {
    ok: false,
    asset: null,
    sync: { operations: "failed", facilities: "skipped", finance: "skipped" },
    warnings: [],
    previousState: before.state,
  };

  const asset = await api.scans.store(input);
  result.ok = true;
  result.asset = asset;
  result.sync.operations = "success";

  if (before.state !== "in_service") {
    return result;
  }

  try {
    await api.mock.updateFacilities({
      tagged_id: asset.asset_tag,
      rack_location: null,
    });
    result.sync.facilities = "success";
  } catch (error) {
    result.sync.facilities = "failed";
    result.warnings.push(failedWarning("Facilities", error));
  }

  return result;
}
