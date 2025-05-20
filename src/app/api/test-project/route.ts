import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    // If no session or user ID, return error
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          session: JSON.stringify(session),
        },
        { status: 401 },
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found in database",
          sessionUserId: session.user.id,
        },
        { status: 400 },
      );
    }

    // Try to create a test project
    const project = await prisma.project.create({
      data: {
        name: "Test Project via API",
        description: "Created for testing purposes",
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      project,
      user,
    });
  } catch (error) {
    console.error("Test project creation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorObject: JSON.stringify(error),
      },
      { status: 500 },
    );
  }
}
