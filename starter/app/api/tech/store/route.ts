import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { storeWithWritebacks } from "@/lib/writebacks";
import type { StoreScanInput } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const input = (await req.json()) as StoreScanInput;
    const result = await storeWithWritebacks(input);
    return NextResponse.json(result, { status: result.warnings.length ? 207 : 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          asset: null,
          previousState: null,
          sync: { operations: "failed", facilities: "skipped", finance: "skipped" },
          warnings: [error.message],
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        asset: null,
        previousState: null,
        sync: { operations: "failed", facilities: "skipped", finance: "skipped" },
        warnings: ["Unexpected store failure."],
        error: { code: "internal_error", message: "Unexpected store failure." },
      },
      { status: 500 },
    );
  }
}
