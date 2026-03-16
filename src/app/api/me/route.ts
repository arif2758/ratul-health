import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(null, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("-password");

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch user",
      },
      { status: 500 },
    );
  }
}
