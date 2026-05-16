"use client";

import { useEffect, useState } from "react";
import { ScanInput } from "@/components/ScanInput";
import { Alert, ScanHistory, StepHeader, type ScanHistoryItem } from "@/components/tech-ui";
import { ApiError, api } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import { formatLocation, parseLocationScan } from "@/lib/location";
import { describeScanError } from "@/lib/scan-copy";
import type { Asset, AssetClass, Location } from "@/lib/types";

const CLASSES: AssetClass[] = [
  "instrument",
  "compute",
  "network",
  "power",
  "consumable_durable",
];

const DEFAULT_LOCATION: Location = {
  site: "Irvine",
  room: "Receiving",
  row: null,
  rack: null,
  ru: null,
};

export default function TechReceivePage() {
  const [assetTag, setAssetTag] = useState("");
  const [existingAsset, setExistingAsset] = useState<Asset | null>(null);
  const [serial, setSerial] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [assetClass, setAssetClass] = useState<AssetClass>("instrument");
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("asset-recent-locations");
    if (saved) setRecentLocations(JSON.parse(saved) as Location[]);
  }, []);

  function rememberLocation(next: Location): void {
    const unique = [next, ...recentLocations].filter(
      (item, index, arr) =>
        arr.findIndex((candidate) => formatLocation(candidate) === formatLocation(item)) === index,
    );
    const clipped = unique.slice(0, 5);
    setRecentLocations(clipped);
    window.localStorage.setItem("asset-recent-locations", JSON.stringify(clipped));
  }

  async function handleAssetScan(value: string): Promise<void> {
    setAssetTag(value);
    setExistingAsset(null);
    setMessage(null);
    setError(null);
    try {
      setExistingAsset(await api.assets.get(value));
    } catch (scanError) {
      if (scanError instanceof ApiError && scanError.code === "unknown_asset") return;
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

  async function submitReceive(): Promise<void> {
    if (!assetTag || !serial || !model || !manufacturer || !location.site) {
      setError("Receive needs tag, serial, model, manufacturer, class, and a receiving location.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const asset = await api.scans.receive({
        asset_tag: assetTag,
        serial,
        model,
        manufacturer,
        asset_class: assetClass,
        location,
        user_id: getCurrentUserId(),
        scan_payload: assetTag,
      });
      const duplicate = existingAsset?.serial === serial;
      setMessage(
        duplicate
          ? `Already received; duplicate event logged for ${asset.asset_tag}. ${getCurrentUserId()} confirmed ${formatLocation(asset.location)}.`
          : `Received ${asset.asset_tag} at ${formatLocation(asset.location)} by ${getCurrentUserId()}. Operations updated.`,
      );
      setHistory((items) =>
        [
          {
            tag: asset.asset_tag,
            detail: duplicate ? "duplicate receive logged" : `received at ${formatLocation(asset.location)}`,
            at: new Date().toISOString(),
          },
          ...items,
        ].slice(0, 5),
      );
      setAssetTag("");
      setExistingAsset(null);
      setSerial("");
      setModel("");
      setManufacturer("");
    } catch (scanError) {
      let asset = existingAsset;
      if (scanError instanceof ApiError && scanError.code === "and_match_failed" && assetTag) {
        try {
          asset = await api.assets.get(assetTag);
          setExistingAsset(asset);
        } catch {
          asset = existingAsset;
        }
      }
      setError(describeScanError(scanError, { asset, scannedSerial: serial }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Receive asset</h1>
        <p className="mt-1 text-sm text-gray-600">Create the Operations record at the dock.</p>
      </div>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="space-y-4 rounded-lg border bg-white p-4">
        <StepHeader
          step={assetTag ? 2 : 1}
          total={2}
          title={assetTag ? "Enter receive details" : "Scan asset"}
          helper={assetTag ? "Confirm the physical serial and receiving location before committing." : "Scan the C-tag. New tags are expected here."}
        />
        {!assetTag ? (
          <ScanInput onScan={handleAssetScan} label="Asset tag" placeholder="Scan asset tag, e.g. C0009001" />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <span className="font-semibold">{assetTag}</span>
              {existingAsset ? (
                <span className="ml-2 text-amber-700">
                  Existing tag found with serial {existingAsset.serial}
                </span>
              ) : (
                <span className="ml-2 text-gray-600">New tag</span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="rounded-lg border p-3" placeholder="Serial" value={serial} onChange={(e) => setSerial(e.target.value)} />
              <input className="rounded-lg border p-3" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
              <input className="rounded-lg border p-3" placeholder="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
              <select className="rounded-lg border p-3" value={assetClass} onChange={(e) => setAssetClass(e.target.value as AssetClass)}>
                {CLASSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <ScanInput onScan={handleLocationScan} label="Receiving location" placeholder="Scan location, e.g. Irvine/Receiving" />
            <div className="text-sm text-gray-700">Location: {formatLocation(location)}</div>
            {recentLocations.length ? (
              <div className="flex flex-wrap gap-2">
                {recentLocations.map((item) => (
                  <button
                    key={formatLocation(item)}
                    type="button"
                    className="min-h-[44px] rounded-md border px-3 text-sm"
                    onClick={() => setLocation(item)}
                  >
                    {formatLocation(item)}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="min-h-[48px] rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:bg-gray-300" disabled={loading} onClick={submitReceive}>
                {loading ? "Receiving..." : "Commit receive"}
              </button>
              <button type="button" className="min-h-[48px] rounded-lg border px-4 font-semibold" onClick={() => setAssetTag("")}>
                Scan another tag
              </button>
            </div>
          </div>
        )}
      </section>

      <ScanHistory items={history} />
    </div>
  );
}
