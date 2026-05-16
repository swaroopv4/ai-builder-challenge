"use client";

import { useEffect, useState } from "react";
import { ScanInput } from "@/components/ScanInput";
import { Alert, AssetCard, ScanHistory, StepHeader, SyncList, type ScanHistoryItem } from "@/components/tech-ui";
import { ApiError, api } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import { deployLocationMissing, formatLocation, isDeployLocationComplete, mergeLocation, parseLocationScan } from "@/lib/location";
import { describeScanError } from "@/lib/scan-copy";
import type { Asset, Location } from "@/lib/types";
import type { CombinedOperationResult } from "@/lib/writebacks";

export default function TechDeployPage() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [result, setResult] = useState<CombinedOperationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("asset-recent-deploy-locations");
    if (saved) setRecentLocations(JSON.parse(saved) as Location[]);
  }, []);

  function rememberLocation(next: Location): void {
    const unique = [next, ...recentLocations].filter(
      (item, index, arr) =>
        arr.findIndex((candidate) => formatLocation(candidate) === formatLocation(item)) === index,
    );
    const clipped = unique.slice(0, 5);
    setRecentLocations(clipped);
    window.localStorage.setItem("asset-recent-deploy-locations", JSON.stringify(clipped));
  }

  async function handleAssetScan(value: string): Promise<void> {
    setError(null);
    setResult(null);
    try {
      setAsset(await api.assets.get(value));
    } catch (scanError) {
      setAsset(null);
      setError(describeScanError(scanError));
    }
  }

  function handleLocationScan(value: string): void {
    const parsed = parseLocationScan(value);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const next = parsed.location;
    setLocation(next);
    rememberLocation(next);
    setError(
      isDeployLocationComplete(next)
        ? null
        : `Deploying puts an asset into service, so ${deployLocationMissing(next).join(", ")} is required. Scan or enter RU before continuing.`,
    );
  }

  function patchLocation(update: Partial<Location>): void {
    setLocation((current) => mergeLocation(current, update));
  }

  async function commitDeploy(): Promise<void> {
    if (!asset || !location) return;
    if (!isDeployLocationComplete(location)) {
      setError(`Deploying puts an asset into service, so ${deployLocationMissing(location).join(", ")} is required. Scan or enter RU before continuing.`);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tech/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: asset.asset_tag,
          location,
          user_id: getCurrentUserId(),
          scan_payload: `${asset.asset_tag}|${formatLocation(location)}`,
        }),
      });
      const body = (await res.json()) as CombinedOperationResult & {
        error?: { code: string; message: string; details?: Record<string, unknown> };
      };
      if (!res.ok) {
        throw new ApiError(res.status, body.error?.code ?? "upstream_error", body.error?.message ?? "Deploy failed", body.error?.details);
      }
      setResult(body);
      if (body.asset) {
        setHistory((items) =>
          [
            {
              tag: body.asset!.asset_tag,
              detail: `deployed to ${formatLocation(body.asset!.location)}`,
              at: new Date().toISOString(),
            },
            ...items,
          ].slice(0, 5),
        );
      }
      setAsset(null);
      setLocation((current) => (current ? { ...current, ru: null } : current));
    } catch (scanError) {
      setError(describeScanError(scanError, { asset }));
    } finally {
      setLoading(false);
    }
  }

  const step = !asset ? 1 : !location || !isDeployLocationComplete(location) ? 2 : 3;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Deploy asset</h1>
        <p className="mt-1 text-sm text-gray-600">Deploy requires site, room, rack, and RU.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {result ? (
        <Alert tone={result.warnings.length ? "warning" : "success"}>
          <div className="font-medium">{result.asset?.asset_tag} deployed to {formatLocation(result.asset?.location)} by {getCurrentUserId()}.</div>
          <SyncList result={result} />
          {result.warnings.length ? (
            <p className="mt-2">Asset deployed, but {result.warnings.join(" ")} Reconciliation may show drift until this is fixed.</p>
          ) : null}
        </Alert>
      ) : null}

      <section className="space-y-4 rounded-lg border bg-white p-4">
        <StepHeader
          step={step}
          total={3}
          title={step === 1 ? "Scan asset" : step === 2 ? "Scan deploy location" : "Commit deploy"}
          helper={step === 1 ? "Scan the asset tag first." : step === 2 ? "Use the same site/room/rack for repeated scans and change only RU." : "Commit after the asset is physically placed."}
        />
        {!asset ? (
          <ScanInput onScan={handleAssetScan} label="Asset tag" placeholder="Scan asset tag" />
        ) : (
          <div className="space-y-4">
            <AssetCard asset={asset} />
            <ScanInput onScan={handleLocationScan} label="Deploy location" placeholder="Irvine/B12/R4/U12" />
            <div className="grid gap-3 sm:grid-cols-4">
              <input className="rounded-lg border p-3" placeholder="Site" value={location?.site ?? ""} onChange={(e) => patchLocation({ site: e.target.value })} />
              <input className="rounded-lg border p-3" placeholder="Room" value={location?.room ?? ""} onChange={(e) => patchLocation({ room: e.target.value })} />
              <input className="rounded-lg border p-3" placeholder="Rack" value={location?.rack ?? ""} onChange={(e) => patchLocation({ rack: e.target.value })} />
              <input className="rounded-lg border p-3" placeholder="RU" value={location?.ru ?? ""} onChange={(e) => patchLocation({ ru: e.target.value })} />
            </div>
            {recentLocations.length ? (
              <div className="flex flex-wrap gap-2">
                {recentLocations.map((item) => (
                  <button key={formatLocation(item)} type="button" className="min-h-[44px] rounded-md border px-3 text-sm" onClick={() => setLocation(item)}>
                    {formatLocation(item)}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              Deploy location: <span className="font-semibold">{formatLocation(location)}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="min-h-[48px] rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:bg-gray-300" disabled={loading} onClick={commitDeploy}>
                {loading ? "Deploying..." : "Commit deploy"}
              </button>
              <button type="button" className="min-h-[48px] rounded-lg border px-4 font-semibold" onClick={() => setAsset(null)}>
                Scan another asset
              </button>
            </div>
          </div>
        )}
      </section>

      <ScanHistory items={history} />
    </div>
  );
}
