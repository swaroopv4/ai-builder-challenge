import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: {
        code: "not_implemented",
        message:
          "Build the reconciliation logic in app/api/reconcile/route.ts",
        hint: "Pull from api.assets.list(), api.mock.facilities(), api.mock.finance(); compare; classify; return.",
      },
    },
    { status: 501 },
  );
}
