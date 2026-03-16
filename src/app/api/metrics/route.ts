import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connection";
import { Metrics } from "@/lib/db/models/Metrics";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const data = await request.json();

    const metric = await Metrics.create({
      userId: session.user.id,
      ...data,
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save metric";
    console.error("Metrics creation error:", errorMessage);
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const metrics = await Metrics.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch metrics",
      },
      { status: 500 },
    );
  }
}
