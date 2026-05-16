import {
  formatLocation,
  formatRackLocation,
  normalizeRackComparable,
} from "./location";
import type { Asset, AssetState, FacilitiesRecord, FinanceRecord } from "./types";

export type ReconcileSeverity = "critical" | "high" | "medium" | "low" | "info";
export type ReconcileCategory =
  | "clean"
  | "expected_difference"
  | "missing_facilities_record"
  | "rack_location_mismatch"
  | "orphan_facilities_record"
  | "finance_status_mismatch"
  | "finance_site_mismatch"
  | "missing_finance_record"
  | "stale_observation"
  | "recent_writeback_gap"
  | "needs_human_review";

export type ReconcileIssue = {
  assetTag: string;
  severity: ReconcileSeverity;
  category: ReconcileCategory;
  confidence: "high" | "medium" | "low";
  title: string;
  explanation: string;
  suggestedAction: string;
  operations: string;
  facilities: string;
  finance: string;
  timestamps: {
    operationsUpdatedAt?: string;
    facilitiesObservedAt?: string;
    generatedAt: string;
  };
  detailUrl: string;
  state?: AssetState;
  site?: string;
};

export type ReconcileReport = {
  generatedAt: string;
  summary: {
    totalChecked: number;
    clean: number;
    expectedDifferences: number;
    needsReview: number;
    critical: number;
  };
  groups: Record<ReconcileSeverity, ReconcileIssue[]>;
  issues: ReconcileIssue[];
};

type Joined = {
  tag: string;
  operations?: Asset;
  facilities?: FacilitiesRecord;
  finance?: FinanceRecord;
};

const ACTIONABLE = new Set<ReconcileSeverity>([
  "critical",
  "high",
  "medium",
  "low",
]);

function agoMinutes(date: string, generatedAt: string): number {
  return (Date.parse(generatedAt) - Date.parse(date)) / 60000;
}

function recentlyChanged(asset: Asset | undefined, generatedAt: string): boolean {
  if (!asset) return false;
  return agoMinutes(asset.updated_at, generatedAt) <= 10;
}

function financeText(finance?: FinanceRecord): string {
  if (!finance) return "No finance record";
  return `${finance.status} at ${finance.site}`;
}

function facilitiesText(record?: FacilitiesRecord): string {
  if (!record) return "No rack record";
  return record.rack_location;
}

function opsText(asset?: Asset): string {
  if (!asset) return "No operations asset";
  return `${asset.state} at ${formatLocation(asset.location)}`;
}

function issue(
  joined: Joined,
  generatedAt: string,
  input: Omit<
    ReconcileIssue,
    | "assetTag"
    | "operations"
    | "facilities"
    | "finance"
    | "timestamps"
    | "detailUrl"
    | "state"
    | "site"
  >,
): ReconcileIssue {
  return {
    ...input,
    assetTag: joined.tag,
    operations: opsText(joined.operations),
    facilities: facilitiesText(joined.facilities),
    finance: financeText(joined.finance),
    timestamps: {
      operationsUpdatedAt: joined.operations?.updated_at,
      facilitiesObservedAt: joined.facilities?.last_observed,
      generatedAt,
    },
    detailUrl: `/manager/assets/${joined.tag}`,
    state: joined.operations?.state,
    site: joined.operations?.location.site ?? joined.finance?.site,
  };
}

function expectedFacilitiesMissing(joined: Joined, generatedAt: string): ReconcileIssue {
  return issue(joined, generatedAt, {
    severity: "info",
    category: "expected_difference",
    confidence: "high",
    title: "Facilities row not expected",
    explanation:
      "This asset is not currently racked, so the missing Facilities row is expected. Facilities only tracks racked assets.",
    suggestedAction: "No action needed.",
  });
}

function classifyOperationsAsset(joined: Joined, generatedAt: string): ReconcileIssue[] {
  const { operations, facilities, finance } = joined;
  if (!operations) return [];
  const issues: ReconcileIssue[] = [];
  const recent = recentlyChanged(operations, generatedAt);
  const state = operations.state;
  const financeStatus = finance?.status;

  if (state === "received" || state === "stored") {
    if (!facilities) {
      issues.push(expectedFacilitiesMissing(joined, generatedAt));
    } else {
      issues.push(
        issue(joined, generatedAt, {
          severity: state === "stored" ? "medium" : "low",
          category: "orphan_facilities_record",
          confidence: "medium",
          title: "Facilities still shows a rack",
          explanation:
            "Operations says this asset is not in service, but Facilities still has a rack record. That usually means an old rack record was not cleared.",
          suggestedAction:
            "Confirm the asset is not physically racked, then clear or refresh the Facilities record.",
        }),
      );
    }
    if (financeStatus === "retired") {
      issues.push(
        issue(joined, generatedAt, {
          severity: "high",
          category: "finance_status_mismatch",
          confidence: "high",
          title: "Finance retired an active asset",
          explanation:
            "Finance says this asset is retired, but Operations still treats it as active inventory.",
          suggestedAction: "Send to finance review before the next audit.",
        }),
      );
    }
    return issues;
  }

  if (state === "in_service") {
    if (!facilities) {
      issues.push(
        issue(joined, generatedAt, {
          severity: recent ? "medium" : "high",
          category: recent ? "recent_writeback_gap" : "missing_facilities_record",
          confidence: recent ? "medium" : "high",
          title: recent ? "Recent deploy not in Facilities yet" : "Missing rack record",
          explanation: recent
            ? "Operations was updated recently, but Facilities has no rack record yet. The deploy writeback may still need attention if this persists."
            : `Operations says this asset is in service at ${formatLocation(
                operations.location,
              )}, but Facilities has no rack record. The deploy writeback may have failed or the rack scan should be repeated.`,
          suggestedAction: recent
            ? "Check again after the scan settles, or repeat the rack scan if it remains missing."
            : "Repeat the deploy scan or update Facilities with the correct rack.",
        }),
      );
    } else if (
      normalizeRackComparable(facilities.rack_location) !==
      normalizeRackComparable(formatRackLocation(operations.location))
    ) {
      issues.push(
        issue(joined, generatedAt, {
          severity: recent ? "medium" : "critical",
          category: recent ? "recent_writeback_gap" : "rack_location_mismatch",
          confidence: recent ? "medium" : "high",
          title: recent ? "Recent rack change still settling" : "Rack locations disagree",
          explanation:
            "Operations and Facilities point to different rack locations for an asset that is currently in service.",
          suggestedAction:
            "Have a tech verify the physical rack position and repeat the deploy scan if Operations is right.",
        }),
      );
    }

    if (!finance) {
      issues.push(
        issue(joined, generatedAt, {
          severity: recent ? "medium" : "high",
          category: recent ? "recent_writeback_gap" : "missing_finance_record",
          confidence: "medium",
          title: "Missing finance record",
          explanation:
            "Operations says this asset is in service, but Finance has no equipment record.",
          suggestedAction: "Check whether capitalization writeback failed.",
        }),
      );
    } else {
      if (finance.status !== "capitalized") {
        issues.push(
          issue(joined, generatedAt, {
            severity: finance.status === "retired" || finance.status === "impaired" ? "critical" : "high",
            category: "finance_status_mismatch",
            confidence: "high",
            title: "Finance status does not match in-service asset",
            explanation:
              "Finance does not show this in-service asset as capitalized.",
            suggestedAction:
              "Send this to finance review before the next audit.",
          }),
        );
      }
      if (finance.site !== operations.location.site) {
        issues.push(
          issue(joined, generatedAt, {
            severity: "medium",
            category: "finance_site_mismatch",
            confidence: "medium",
            title: "Finance site differs from Operations",
            explanation:
              "Finance tracks only the site level, and that site does not match the Operations site.",
            suggestedAction:
              "Confirm the site and ask Finance to update the building-level record if Operations is correct.",
          }),
        );
      }
    }
    return issues;
  }

  if (state === "rma_pending") {
    if (facilities) {
      issues.push(
        issue(joined, generatedAt, {
          severity: "medium",
          category: "needs_human_review",
          confidence: "medium",
          title: "RMA asset still appears racked",
          explanation:
            "Operations says this asset is pending RMA, but Facilities still shows it in a rack.",
          suggestedAction:
            "Confirm whether it was removed for RMA or the Operations state is wrong.",
        }),
      );
    }
    return issues;
  }

  if (state === "disposed") {
    if (facilities) {
      issues.push(
        issue(joined, generatedAt, {
          severity: "critical",
          category: "orphan_facilities_record",
          confidence: "high",
          title: "Disposed asset still racked",
          explanation:
            "Operations says this asset is disposed, but Facilities still shows it in a rack.",
          suggestedAction:
            "Verify the physical space and remove the Facilities rack record if the asset is gone.",
        }),
      );
    }
    if (finance?.status === "capitalized") {
      issues.push(
        issue(joined, generatedAt, {
          severity: "high",
          category: "finance_status_mismatch",
          confidence: "medium",
          title: "Disposed asset still capitalized",
          explanation:
            "Operations says this asset is disposed, but Finance still has it capitalized.",
          suggestedAction:
            "Send to finance review; this may be a normal lag or a retirement miss.",
        }),
      );
    }
  }

  return issues;
}

export function buildReconcileReport(
  assets: Asset[],
  facilities: FacilitiesRecord[],
  finance: FinanceRecord[],
  generatedAt = new Date().toISOString(),
): ReconcileReport {
  const joined = new Map<string, Joined>();

  for (const asset of assets) {
    joined.set(asset.asset_tag, { tag: asset.asset_tag, operations: asset });
  }
  for (const row of facilities) {
    const current = joined.get(row.tagged_id) ?? { tag: row.tagged_id };
    joined.set(row.tagged_id, { ...current, facilities: row });
  }
  for (const row of finance) {
    const current = joined.get(row.tag) ?? { tag: row.tag };
    joined.set(row.tag, { ...current, finance: row });
  }

  const issues: ReconcileIssue[] = [];
  for (const record of joined.values()) {
    if (!record.operations) {
      issues.push(
        issue(record, generatedAt, {
          severity: record.facilities ? "high" : "medium",
          category: record.facilities ? "orphan_facilities_record" : "needs_human_review",
          confidence: "high",
          title: record.facilities
            ? "Facilities has an asset Operations does not know"
            : "Finance has an asset Operations does not know",
          explanation:
            "A downstream system has a row for this tag, but Operations has no asset with that tag.",
          suggestedAction:
            "Verify whether this is a stale downstream row or an asset missing from Operations.",
        }),
      );
      continue;
    }
    issues.push(...classifyOperationsAsset(record, generatedAt));
  }

  const assetTagsWithAction = new Set(
    issues
      .filter((item) => ACTIONABLE.has(item.severity))
      .map((item) => item.assetTag),
  );

  const groups: ReconcileReport["groups"] = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: [],
  };
  for (const item of issues) {
    groups[item.severity].push(item);
  }

  return {
    generatedAt,
    summary: {
      totalChecked: joined.size,
      clean: joined.size - assetTagsWithAction.size,
      expectedDifferences: issues.filter(
        (item) => item.category === "expected_difference",
      ).length,
      needsReview: issues.filter((item) => ACTIONABLE.has(item.severity)).length,
      critical: groups.critical.length,
    },
    groups,
    issues,
  };
}
