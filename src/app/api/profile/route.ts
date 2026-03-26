import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";

interface UpdateData {
  name?: string;
  image?: string;
  height?: number;
  birthdate?: string;
  gender?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, height, birthdate, gender } = body;

    const updateData: UpdateData & {
      height?: number;
      birthdate?: string;
      gender?: string;
    } = {};
    if (name) updateData.name = name;
    if (height) updateData.height = height;
    if (birthdate) updateData.birthdate = birthdate;
    if (gender) updateData.gender = gender;

    const user = await User.findByIdAndUpdate(session.user.id, updateData, {
      new: true,
      select: "-password",
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
