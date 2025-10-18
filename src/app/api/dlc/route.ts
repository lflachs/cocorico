import { NextRequest, NextResponse } from "next/server";
import { dlcSchema } from "@/lib/validations/dlc.schema";
import { createDlc, getAllDlcs, getUpcomingDlcs, getDlcStats } from "@/lib/services/dlc.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter");
    const productId = searchParams.get("productId");

    if (filter === "upcoming") {
      const days = parseInt(searchParams.get("days") || "7");
      const dlcs = await getUpcomingDlcs(days);
      return NextResponse.json(dlcs);
    }

    if (filter === "stats") {
      const stats = await getDlcStats();
      return NextResponse.json(stats);
    }

    const dlcs = await getAllDlcs({
      productId: productId || undefined,
    });

    return NextResponse.json(dlcs);
  } catch (error) {
    console.error("Error fetching DLCs:", error);
    return NextResponse.json(
      { error: "Failed to fetch DLCs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = dlcSchema.parse(body);

    const dlc = await createDlc(validated);

    return NextResponse.json(dlc, { status: 201 });
  } catch (error) {
    console.error("Error creating DLC:", error);
    return NextResponse.json(
      { error: "Failed to create DLC", details: error },
      { status: 400 }
    );
  }
}
