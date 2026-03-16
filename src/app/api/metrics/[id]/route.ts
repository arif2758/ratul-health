import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connection";
import { Metrics } from "@/lib/db/models/Metrics";
import { ObjectId } from "mongoose";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const metric = await Metrics.findByIdAndDelete(id);

    if (!metric) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete metric",
      },
      { status: 500 },
    );
  }
}
