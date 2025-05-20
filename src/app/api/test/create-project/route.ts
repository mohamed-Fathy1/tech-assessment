import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: "User does not exist in the database" }, { status: 400 });
    }

    // Get the data from the request
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        description: description || "",
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Test create project error:", error);
    let errorMessage = "Failed to create project";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
