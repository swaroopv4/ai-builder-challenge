import { NextResponse } from "next/server";
import { api } from "@/lib/api-client";
import { buildReconcileReport } from "@/lib/reconcile";

export async function GET(): Promise<NextResponse> {
  const [assets, facilities, finance] = await Promise.all([
    api.assets.list(),
    api.mock.facilities(),
    api.mock.finance(),
  ]);

  return NextResponse.json(buildReconcileReport(assets, facilities, finance));
}
