import type { ReactNode } from "react";
import { formatLocation } from "@/lib/location";
import type { Asset } from "@/lib/types";
import type { CombinedOperationResult } from "@/lib/writebacks";

export type ScanHistoryItem = {
  tag: string;
  detail: string;
  at: string;
};

export function StepHeader({
  title,
  step,
  total,
  helper,
}: {
  title: string;
  step: number;
  total: number;
  helper: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        Step {step} of {total}: {title}
      </p>
      <p className="mt-1 text-sm text-gray-600">{helper}</p>
    </div>
  );
}

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-semibold">{asset.asset_tag}</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {asset.state}
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">Model</dt>
          <dd className="font-medium">{asset.model}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Custodian</dt>
          <dd className="font-medium">{asset.custodian}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-gray-500">Current location</dt>
          <dd className="font-medium">{formatLocation(asset.location)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function Alert({
  tone,
  children,
}: {
  tone: "success" | "error" | "warning" | "info";
  children: ReactNode;
}) {
  const classes = {
    success: "border-green-200 bg-green-50 text-green-900",
    error: "border-red-200 bg-red-50 text-red-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-blue-200 bg-blue-50 text-blue-900",
  };
  return <div className={`rounded-lg border p-4 text-sm ${classes[tone]}`}>{children}</div>;
}

export function SyncList({ result }: { result: CombinedOperationResult }) {
  const labels = {
    operations: "Operations updated",
    facilities: "Facilities rack updated",
    finance: "Finance capitalized",
  };
  return (
    <ul className="mt-2 space-y-1">
      {(["operations", "facilities", "finance"] as const).map((key) => (
        <li key={key}>
          <span className="font-medium">{labels[key]}:</span> {result.sync[key]}
        </li>
      ))}
    </ul>
  );
}

export function ScanHistory({ items }: { items: ScanHistoryItem[] }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="text-base font-semibold">Last successful scans</h2>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={`${item.tag}-${item.at}`} className="border-t pt-2 first:border-t-0 first:pt-0">
              <span className="font-medium">{item.tag}</span>{" "}
              <span className="text-gray-600">{item.detail}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          Successful scans from this session will appear here.
        </p>
      )}
    </section>
  );
}
