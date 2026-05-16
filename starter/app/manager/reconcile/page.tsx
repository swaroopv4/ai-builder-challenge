"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReconcileIssue, ReconcileReport, ReconcileSeverity } from "@/lib/reconcile";

const SEVERITIES: ReconcileSeverity[] = ["critical", "high", "medium", "low", "info"];

export default function ManagerReconcilePage() {
  const [report, setReport] = useState<ReconcileReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [site, setSite] = useState("");
  const [state, setState] = useState("");
  const [actionableOnly, setActionableOnly] = useState(true);

  useEffect(() => {
    fetch("/api/reconcile")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json() as Promise<ReconcileReport>;
      })
      .then(setReport)
      .catch(() => setError("Could not build reconciliation report. Check the API and try again."))
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set((report?.issues ?? []).map((issue) => issue.category))).sort();
  const sites = Array.from(new Set((report?.issues ?? []).map((issue) => issue.site).filter(Boolean) as string[])).sort();
  const states = Array.from(new Set((report?.issues ?? []).map((issue) => issue.state).filter(Boolean) as string[])).sort();

  const filtered = useMemo(() => {
    return (report?.issues ?? []).filter((issue) => {
      if (actionableOnly && issue.severity === "info") return false;
      if (severity && issue.severity !== severity) return false;
      if (category && issue.category !== category) return false;
      if (site && issue.site !== site) return false;
      if (state && issue.state !== state) return false;
      return true;
    });
  }, [report, actionableOnly, severity, category, site, state]);

  const bySeverity = useMemo(() => {
    const map = new Map<ReconcileSeverity, ReconcileIssue[]>();
    for (const sev of SEVERITIES) map.set(sev, []);
    for (const issue of filtered) map.get(issue.severity)?.push(issue);
    return map;
  }, [filtered]);

  if (loading) return <div className="p-8 text-center text-gray-600">Building reconciliation report...</div>;
  if (error || !report) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>;

  const hasIssues = filtered.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Three-way reconciliation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generated {new Date(report.generatedAt).toLocaleString()}. Differences are categorized by action needed.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-5">
        {[
          ["Total checked", report.summary.totalChecked],
          ["Clean", report.summary.clean],
          ["Expected", report.summary.expectedDifferences],
          ["Needs review", report.summary.needsReview],
          ["Critical", report.summary.critical],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-sm text-gray-600">{label}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <label className="text-sm">
          <span className="block text-gray-600">Severity</span>
          <select className="mt-1 min-h-[44px] rounded-md border px-3" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All</option>
            {SEVERITIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-600">Category</span>
          <select className="mt-1 min-h-[44px] rounded-md border px-3" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
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
          <span className="block text-gray-600">State</span>
          <select className="mt-1 min-h-[44px] rounded-md border px-3" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All</option>
            {states.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex min-h-[44px] items-center gap-2 text-sm">
          <input type="checkbox" checked={actionableOnly} onChange={(e) => setActionableOnly(e.target.checked)} />
          Actionable only
        </label>
      </section>

      {!hasIssues ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-600">
          No reconciliation issues found. Operations, facilities, and finance are aligned for the current dataset.
        </div>
      ) : (
        <div className="space-y-5">
          {SEVERITIES.map((sev) => {
            const issues = bySeverity.get(sev) ?? [];
            if (!issues.length) return null;
            return (
              <section key={sev} className={sev === "info" ? "rounded-lg border bg-white p-4" : "space-y-3"}>
                <h2 className="text-lg font-semibold capitalize">{sev}</h2>
                <div className="mt-3 space-y-3">
                  {issues.map((issue) => (
                    <IssueCard key={`${issue.assetTag}-${issue.category}-${issue.title}`} issue={issue} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue }: { issue: ReconcileIssue }) {
  return (
    <article className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={issue.detailUrl} className="text-lg font-semibold text-blue-700 hover:underline">
            {issue.assetTag}
          </Link>
          <div className="mt-1 text-sm text-gray-600">{issue.category}</div>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">{issue.severity}</span>
      </div>
      <p className="mt-3 text-sm text-gray-800">{issue.explanation}</p>
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
        <Value label="Operations" value={issue.operations} />
        <Value label="Facilities" value={issue.facilities} />
        <Value label="Finance" value={issue.finance} />
      </div>
      <p className="mt-3 text-sm font-medium">Suggested action: {issue.suggestedAction}</p>
    </article>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-gray-50 p-3">
      <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
