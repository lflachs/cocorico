import { NextRequest, NextResponse } from "next/server";
import { markDlcAsDiscarded } from "@/lib/services/dlc.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dlc = await markDlcAsDiscarded(params.id);

    return NextResponse.json(dlc);
  } catch (error) {
    console.error("Error marking DLC as discarded:", error);
    return NextResponse.json(
      { error: "Failed to mark DLC as discarded" },
      { status: 500 }
    );
  }
}
