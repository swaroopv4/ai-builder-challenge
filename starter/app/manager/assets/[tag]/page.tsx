export default async function ManagerAssetDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<React.ReactElement> {
  const { tag } = await params;
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">Asset {tag} (stub)</h1>
      <p className="text-gray-600 mt-2">
        Build the asset detail view. Fetch the asset and its event history from
        the API and render them in a way an asset manager can scan quickly. See{" "}
        <code>docs/tips.md</code>.
      </p>
    </div>
  );
}
