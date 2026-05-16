"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { getRole } from "@/lib/auth";
import { formatLocation } from "@/lib/location";
import type { ReconcileReport } from "@/lib/reconcile";
import type { Asset, AssetState } from "@/lib/types";

const PAGE_SIZE = 25;
const STATES: AssetState[] = ["received", "stored", "in_service", "rma_pending", "disposed"];

export default function ManagerLandingPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [report, setReport] = useState<ReconcileReport | null>(null);
  const [state, setState] = useState("");
  const [site, setSite] = useState("");
  const [custodian, setCustodian] = useState("");
  const [assetClass, setAssetClass] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("tech");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.assets
      .list({ state, site, custodian })
      .then((rows) => {
        if (!cancelled) {
          setAssets(rows);
          setPage(1);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load assets. Check the API and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state, site, custodian]);

  useEffect(() => {
    fetch("/api/reconcile")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: ReconcileReport | null) => setReport(body))
      .catch(() => setReport(null));
  }, []);

  const issueByTag = useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of report?.issues ?? []) {
      if (issue.severity !== "info" && !map.has(issue.assetTag)) {
        map.set(issue.assetTag, `${issue.severity}: ${issue.title}`);
      }
    }
    return map;
  }, [report]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (assetClass && asset.asset_class !== assetClass) return false;
      if (!q) return true;
      return [asset.asset_tag, asset.model, asset.serial]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [assets, assetClass, search]);

  const summary = useMemo(
    () => ({
      total: assets.length,
      inService: assets.filter((asset) => asset.state === "in_service").length,
      stored: assets.filter((asset) => asset.state === "stored").length,
      received: assets.filter((asset) => asset.state === "received").length,
      recent: assets.filter((asset) => Date.now() - Date.parse(asset.updated_at) < 24 * 60 * 60 * 1000).length,
      needsReview: report?.summary.needsReview ?? 0,
    }),
    [assets, report],
  );

  const sites = Array.from(new Set(assets.map((asset) => asset.location.site).filter(Boolean))).sort();
  const custodians = Array.from(new Set(assets.map((asset) => asset.custodian).filter(Boolean))).sort();
  const classes = Array.from(new Set(assets.map((asset) => asset.asset_class))).sort();
  const recentMovement = [...assets]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, 6);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters(): void {
    setState("");
    setSite("");
    setCustodian("");
    setAssetClass("");
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manager dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Start with exceptions and movement, then drill into the table.
        </p>
      </div>

      {role === "tech" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You are viewing this as a tech demo user. Manager pages stay open for review, but write actions still use the selected role.
        </div>
      ) : null}

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div> : null}

      <section>
        <h2 className="text-lg font-semibold">Morning summary</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Loaded", summary.total],
            ["In service", summary.inService],
            ["Stored", summary.stored],
            ["Received", summary.received],
            ["Updated today", summary.recent],
            ["Needs review", summary.needsReview],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-white p-4">
              <div className="text-2xl font-semibold">{value}</div>
              <div className="text-sm text-gray-600">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Link href="/manager/reconcile" className="rounded-lg border border-blue-200 bg-blue-50 p-5 hover:border-blue-500">
          <h2 className="text-lg font-semibold">Needs review / reconciliation</h2>
          <p className="mt-2 text-sm text-gray-700">
            {summary.needsReview ? `${summary.needsReview} categorized issues need a decision.` : "Open the categorized three-way report."}
          </p>
        </Link>
        <div className="rounded-lg border bg-white p-5">
          <h2 className="text-lg font-semibold">Recent movement</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recentMovement.map((asset) => (
              <Link key={asset.asset_tag} href={`/manager/assets/${asset.asset_tag}`} className="rounded-md border p-3 text-sm hover:border-blue-500">
                <div className="font-semibold">{asset.asset_tag}</div>
                <div className="text-gray-600">{asset.state} at {formatLocation(asset.location)}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
          <label className="text-sm">
            <span className="block text-gray-600">State</span>
            <select className="mt-1 min-h-[44px] rounded-md border px-3" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">All</option>
              {STATES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-600">Site</span>
            <select className="mt-1 min-h-[44px] rounded-md border px-3" value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="">All</option>
              {sites.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-600">Custodian</span>
            <select className="mt-1 min-h-[44px] rounded-md border px-3" value={custodian} onChange={(e) => setCustodian(e.target.value)}>
              <option value="">All</option>
              {custodians.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-600">Class</span>
            <select className="mt-1 min-h-[44px] rounded-md border px-3" value={assetClass} onChange={(e) => setAssetClass(e.target.value)}>
              <option value="">All</option>
              {classes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="min-w-[220px] flex-1 text-sm">
            <span className="block text-gray-600">Search</span>
            <input className="mt-1 min-h-[44px] w-full rounded-md border px-3" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tag, model, serial" />
          </label>
          <button type="button" className="min-h-[44px] rounded-md border px-4 text-sm font-medium" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading assets...</div>
          ) : visible.length ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="p-3">Asset tag</th>
                  <th className="p-3">Model / class</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Location summary</th>
                  <th className="p-3">Custodian</th>
                  <th className="p-3">Last updated</th>
                  <th className="p-3">Attention</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((asset) => (
                  <tr key={asset.asset_tag} className="border-t">
                    <td className="p-3 font-semibold"><Link className="text-blue-700 hover:underline" href={`/manager/assets/${asset.asset_tag}`}>{asset.asset_tag}</Link></td>
                    <td className="p-3">{asset.model}<div className="text-xs text-gray-500">{asset.asset_class}</div></td>
                    <td className="p-3">{asset.state}</td>
                    <td className="p-3">{formatLocation(asset.location)}</td>
                    <td className="p-3">{asset.custodian}</td>
                    <td className="p-3">{new Date(asset.updated_at).toLocaleString()}</td>
                    <td className="p-3">{issueByTag.get(asset.asset_tag) ?? "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-600">
              No assets match these filters. Clear filters or search a different tag.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span>{filtered.length} matching assets</span>
          <div className="flex gap-2">
            <button className="min-h-[40px] rounded-md border px-3 disabled:opacity-40" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span className="py-2">Page {page} of {pages}</span>
            <button className="min-h-[40px] rounded-md border px-3 disabled:opacity-40" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
