import { NextRequest, NextResponse } from "next/server";
import { markDlcAsConsumed } from "@/lib/services/dlc.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dlc = await markDlcAsConsumed(params.id);

    return NextResponse.json(dlc);
  } catch (error) {
    console.error("Error marking DLC as consumed:", error);
    return NextResponse.json(
      { error: "Failed to mark DLC as consumed" },
      { status: 500 }
    );
  }
}
