export default function ManagerReconcilePage() {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">Reconciliation report (stub)</h1>
      <p className="text-gray-600 mt-2">
        Build the three-way reconciliation view. Pull the joined data from the
        server route at <code>/api/reconcile</code> (which you also need to
        build) and present mismatches in a way that helps an asset manager
        decide what to investigate. See <code>docs/tips.md</code>.
      </p>
    </div>
  );
}
