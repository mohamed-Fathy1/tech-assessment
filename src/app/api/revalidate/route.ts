import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Path parameter is required" }, { status: 400 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ success: true, revalidated: path });
  } catch (error) {
    console.error("Error revalidating path:", error);
    return NextResponse.json({ error: "Failed to revalidate path" }, { status: 500 });
  }
}
