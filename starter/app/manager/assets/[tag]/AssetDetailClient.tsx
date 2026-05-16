"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { formatLocation } from "@/lib/location";
import type { ReconcileIssue, ReconcileReport } from "@/lib/reconcile";
import type { Asset, Event } from "@/lib/types";

export function AssetDetailClient({ tag }: { tag: string }) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [issue, setIssue] = useState<ReconcileIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.assets.get(tag),
      api.assets.history(tag),
      fetch("/api/reconcile").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([assetResult, eventResult, report]) => {
        if (cancelled) return;
        setAsset(assetResult);
        setEvents(eventResult);
        const reconcile = report as ReconcileReport | null;
        setIssue(reconcile?.issues.find((item) => item.assetTag === tag && item.severity !== "info") ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this asset. Check the tag and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tag]);

  const newestEvents = useMemo(
    () => [...events].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),
    [events],
  );

  if (loading) return <div className="p-8 text-center text-gray-600">Loading asset...</div>;
  if (error || !asset) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>;

  return (
    <div className="space-y-6">
      <Link href="/manager" className="text-sm text-blue-700 hover:underline">Back to manager dashboard</Link>
      <header className="rounded-lg border bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{asset.asset_tag}</h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">{asset.state}</span>
        </div>
        <p className="mt-2 text-gray-700">{asset.model} / {asset.asset_class}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Current truth</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Location</dt>
              <dd className="font-medium">{formatLocation(asset.location)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Custodian</dt>
              <dd className="font-medium">{asset.custodian}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Serial</dt>
              <dd className="font-medium">{asset.serial}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Last updated</dt>
              <dd className="font-medium">{new Date(asset.updated_at).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
        <div className={`rounded-lg border p-5 ${issue ? "border-amber-200 bg-amber-50" : "bg-white"}`}>
          <h2 className="text-lg font-semibold">{issue ? "Why flagged" : "Reconciliation"}</h2>
          {issue ? (
            <div className="mt-2 text-sm text-amber-950">
              <p className="font-medium">{issue.title}</p>
              <p className="mt-2">{issue.explanation}</p>
              <p className="mt-2 font-medium">Action: {issue.suggestedAction}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-600">No actionable reconciliation issue is currently flagged for this asset.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="text-lg font-semibold">Operations / Facilities / Finance</h2>
        {issue ? (
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <Comparison label="Operations" value={issue.operations} />
            <Comparison label="Facilities" value={issue.facilities} />
            <Comparison label="Finance" value={issue.finance} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-600">Open reconciliation for the full system comparison.</p>
        )}
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="text-lg font-semibold">Event timeline</h2>
        {newestEvents.length ? (
          <ol className="mt-4 space-y-3">
            {newestEvents.map((event) => (
              <li key={event.id} className="border-l-2 border-gray-200 pl-4">
                <div className="font-medium">{eventText(event)}</div>
                <div className="text-sm text-gray-600">{new Date(event.timestamp).toLocaleString()}</div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No events recorded for this asset yet.</p>
        )}
      </section>

      <details className="rounded-lg border bg-white p-5">
        <summary className="cursor-pointer font-semibold">Raw metadata</summary>
        <pre className="mt-4 overflow-auto rounded-md bg-gray-950 p-4 text-xs text-gray-100">{JSON.stringify(asset, null, 2)}</pre>
      </details>
    </div>
  );
}

function Comparison({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-gray-50 p-3">
      <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function eventText(event: Event): string {
  if (event.event_type === "deploy") {
    return `Deployed by ${event.user_id} to ${formatLocation(event.to_location)}`;
  }
  if (event.event_type === "store") {
    return `Moved from ${formatLocation(event.from_location)} to ${formatLocation(event.to_location)}`;
  }
  if (event.event_type === "transfer_custody") {
    return `Transferred custody from ${event.user_id} to ${event.scan_payload}`;
  }
  if (event.event_type === "receive") {
    return `Received by ${event.user_id} at ${formatLocation(event.to_location)}`;
  }
  if (event.event_type === "duplicate_receive") {
    return `Duplicate receive logged by ${event.user_id}`;
  }
  return `${event.event_type.replaceAll("_", " ")} by ${event.user_id}`;
}
