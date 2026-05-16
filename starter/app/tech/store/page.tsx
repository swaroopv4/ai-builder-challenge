"use client";

import { useEffect, useState } from "react";
import { ScanInput } from "@/components/ScanInput";
import { Alert, AssetCard, ScanHistory, StepHeader, SyncList, type ScanHistoryItem } from "@/components/tech-ui";
import { ApiError, api } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import { formatLocation, parseLocationScan } from "@/lib/location";
import { describeScanError } from "@/lib/scan-copy";
import type { Asset, Location } from "@/lib/types";
import type { CombinedOperationResult } from "@/lib/writebacks";

type StoreResult = CombinedOperationResult & { previousState: Asset["state"] | null };

export default function TechStorePage() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [result, setResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("asset-recent-storage-locations");
    if (saved) setRecentLocations(JSON.parse(saved) as Location[]);
  }, []);

  function rememberLocation(next: Location): void {
    const unique = [next, ...recentLocations].filter(
      (item, index, arr) =>
        arr.findIndex((candidate) => formatLocation(candidate) === formatLocation(item)) === index,
    );
    const clipped = unique.slice(0, 5);
    setRecentLocations(clipped);
    window.localStorage.setItem("asset-recent-storage-locations", JSON.stringify(clipped));
  }

  async function handleAssetScan(value: string): Promise<void> {
    setError(null);
    setResult(null);
    setLocation(null);
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
    setLocation(parsed.location);
    rememberLocation(parsed.location);
    setError(null);
  }

  async function commitStore(): Promise<void> {
    if (!asset || !location) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tech/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: asset.asset_tag,
          location,
          user_id: getCurrentUserId(),
          scan_payload: `${asset.asset_tag}|${formatLocation(location)}`,
        }),
      });
      const body = (await res.json()) as StoreResult & {
        error?: { code: string; message: string; details?: Record<string, unknown> };
      };
      if (!res.ok) {
        throw new ApiError(res.status, body.error?.code ?? "upstream_error", body.error?.message ?? "Store failed", body.error?.details);
      }
      setResult(body);
      if (body.asset) {
        setHistory((items) =>
          [
            {
              tag: body.asset!.asset_tag,
              detail: `stored at ${formatLocation(body.asset!.location)}`,
              at: new Date().toISOString(),
            },
            ...items,
          ].slice(0, 5),
        );
      }
      setAsset(null);
      setLocation(null);
    } catch (scanError) {
      setError(describeScanError(scanError, { asset }));
    } finally {
      setLoading(false);
    }
  }

  const step = !asset ? 1 : !location ? 2 : 3;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Store asset</h1>
        <p className="mt-1 text-sm text-gray-600">Move an asset to storage. Rack unit is not required.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {result ? (
        <Alert tone={result.warnings.length ? "warning" : "success"}>
          <div className="font-medium">{result.asset?.asset_tag} stored at {formatLocation(result.asset?.location)} by {getCurrentUserId()}.</div>
          <SyncList result={result} />
          {result.previousState === "in_service" ? (
            <p className="mt-2">Facilities removed the rack assignment because this was de-racked.</p>
          ) : (
            <p className="mt-2">Facilities and Finance were untouched.</p>
          )}
        </Alert>
      ) : null}

      <section className="space-y-4 rounded-lg border bg-white p-4">
        <StepHeader
          step={step}
          total={3}
          title={step === 1 ? "Scan asset" : step === 2 ? "Scan storage location" : "Commit store"}
          helper={step === 1 ? "Scan the asset tag before choosing storage." : step === 2 ? "Confirm current state, then scan a storage site/room." : "Commit once the physical item is in storage."}
        />
        {!asset ? (
          <ScanInput onScan={handleAssetScan} label="Asset tag" placeholder="Scan asset tag" />
        ) : (
          <div className="space-y-4">
            <AssetCard asset={asset} />
            {!location ? (
              <>
                <ScanInput onScan={handleLocationScan} label="Storage location" placeholder="Irvine/Storage A" />
                {recentLocations.length ? (
                  <div className="flex flex-wrap gap-2">
                    {recentLocations.map((item) => (
                      <button key={formatLocation(item)} type="button" className="min-h-[44px] rounded-md border px-3 text-sm" onClick={() => setLocation(item)}>
                        {formatLocation(item)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  Storage location: <span className="font-semibold">{formatLocation(location)}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" className="min-h-[48px] rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:bg-gray-300" disabled={loading} onClick={commitStore}>
                    {loading ? "Storing..." : "Commit store"}
                  </button>
                  <button type="button" className="min-h-[48px] rounded-lg border px-4 font-semibold" onClick={() => setLocation(null)}>
                    Change location
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <ScanHistory items={history} />
    </div>
  );
}
