import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connection";
import { Goal } from "@/lib/db/models/Goal";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const data = await request.json();

    const goal = await Goal.create({
      userId: session.user.id,
      ...data,
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save goal";
    console.error("Goal creation error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const goals = await Goal.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(goals);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch goals";
    console.error("Goals fetch error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
