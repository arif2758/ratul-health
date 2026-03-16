import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      status: "ok",
      supabaseConfigured: false, // Not using Supabase anymore
      mongodbConfigured: !!process.env.MONGODB_URI,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Status check failed",
      },
      { status: 500 },
    );
  }
}
