import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { deployWithWritebacks } from "@/lib/writebacks";
import type { DeployScanInput } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const input = (await req.json()) as DeployScanInput;
    const result = await deployWithWritebacks(input);
    return NextResponse.json(result, { status: result.warnings.length ? 207 : 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          asset: null,
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
        sync: { operations: "failed", facilities: "skipped", finance: "skipped" },
        warnings: ["Unexpected deploy failure."],
        error: { code: "internal_error", message: "Unexpected deploy failure." },
      },
      { status: 500 },
    );
  }
}
