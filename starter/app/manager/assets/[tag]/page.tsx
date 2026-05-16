import { AssetDetailClient } from "./AssetDetailClient";

export default async function ManagerAssetDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return <AssetDetailClient tag={tag} />;
}
