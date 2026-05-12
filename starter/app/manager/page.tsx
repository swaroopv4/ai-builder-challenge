import Link from "next/link";

export default function ManagerLandingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manager dashboard (stub)</h1>
        <p className="text-gray-600 mt-2">
          Build the asset list with filters (state, site, custodian) here.
          Linking to <code>/manager/assets/[tag]</code> for detail and{" "}
          <code>/manager/reconcile</code> for the three-way report.
        </p>
      </div>
      <ul className="space-y-2">
        <li>
          <Link
            className="text-blue-700 hover:underline"
            href="/manager/reconcile"
          >
            Three-way reconciliation
          </Link>
        </li>
      </ul>
    </div>
  );
}
