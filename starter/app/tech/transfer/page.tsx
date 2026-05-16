"use client";

import { useState } from "react";
import { ScanInput } from "@/components/ScanInput";
import { Alert, AssetCard, ScanHistory, StepHeader, type ScanHistoryItem } from "@/components/tech-ui";
import { api } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import { formatLocation } from "@/lib/location";
import { describeScanError } from "@/lib/scan-copy";
import type { Asset } from "@/lib/types";

export default function TechTransferPage() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAssetScan(value: string): Promise<void> {
    setError(null);
    setMessage(null);
    try {
      setAsset(await api.assets.get(value));
    } catch (scanError) {
      setAsset(null);
      setError(describeScanError(scanError));
    }
  }

  async function handleBadgeScan(toCustodian: string): Promise<void> {
    if (!asset || !toCustodian) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.scans.transfer({
        asset_tag: asset.asset_tag,
        to_custodian: toCustodian,
        user_id: getCurrentUserId(),
        scan_payload: toCustodian,
      });
      setMessage(
        `${updated.asset_tag} transferred from ${getCurrentUserId()} to ${updated.custodian}. State stayed ${updated.state}; location remains ${formatLocation(updated.location)}.`,
      );
      setHistory((items) =>
        [
          {
            tag: updated.asset_tag,
            detail: `custody transferred to ${updated.custodian}`,
            at: new Date().toISOString(),
          },
          ...items,
        ].slice(0, 5),
      );
      setAsset(null);
    } catch (scanError) {
      setError(
        describeScanError(scanError, { asset }).replace(
          "that person",
          asset.custodian,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Transfer custody</h1>
        <p className="mt-1 text-sm text-gray-600">
          The logged-in user is the giving side. Scan only the receiving badge.
        </p>
      </div>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="space-y-4 rounded-lg border bg-white p-4">
        <StepHeader
          step={asset ? 2 : 1}
          total={2}
          title={asset ? "Scan receiving badge" : "Scan asset"}
          helper={asset ? `Current custodian is ${asset.custodian}. Scan a different receiving badge.` : "Scan the asset tag before handing it off."}
        />
        {!asset ? (
          <ScanInput onScan={handleAssetScan} label="Asset tag" placeholder="Scan asset tag" />
        ) : (
          <div className="space-y-4">
            <AssetCard asset={asset} />
            <ScanInput disabled={loading} onScan={handleBadgeScan} label="Receiving badge" placeholder="tech-mike" />
            <button type="button" className="min-h-[48px] w-full rounded-lg border px-4 font-semibold" onClick={() => setAsset(null)}>
              Scan another asset
            </button>
          </div>
        )}
      </section>

      <ScanHistory items={history} />
    </div>
  );
}
