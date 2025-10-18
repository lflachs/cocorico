import { NextRequest, NextResponse } from "next/server";
import { updateDlcSchema } from "@/lib/validations/dlc.schema";
import {
  getDlcById,
  updateDlc,
  deleteDlc,
  markDlcAsConsumed,
  markDlcAsDiscarded,
} from "@/lib/services/dlc.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dlc = await getDlcById(params.id);

    if (!dlc) {
      return NextResponse.json(
        { error: "DLC not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dlc);
  } catch (error) {
    console.error("Error fetching DLC:", error);
    return NextResponse.json(
      { error: "Failed to fetch DLC" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateDlcSchema.parse(body);

    const dlc = await updateDlc(params.id, validated);

    return NextResponse.json(dlc);
  } catch (error) {
    console.error("Error updating DLC:", error);
    return NextResponse.json(
      { error: "Failed to update DLC", details: error },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteDlc(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting DLC:", error);
    return NextResponse.json(
      { error: "Failed to delete DLC" },
      { status: 500 }
    );
  }
}
