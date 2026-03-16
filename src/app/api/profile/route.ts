import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";

interface UpdateData {
  name?: string;
  image?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const image = formData.get("image") as File | null;

    const updateData: UpdateData = {};
    if (name) updateData.name = name;

    // Handle image upload if needed - you might want to use a service like Cloudinary or S3
    // For now, storing as base64 for simplicity
    if (image) {
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      updateData.image = `data:${image.type};base64,${base64}`;
    }

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
