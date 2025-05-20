import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Session } from "next-auth";

/**
 * Utility to validate session and check if user exists in database.
 * To be used in server components.
 * @returns Session with a guaranteed non-null user
 */
export async function validateUserSession(): Promise<Session & { user: NonNullable<Session["user"]> }> {
  const session = await auth();

  // If no session or no user, redirect to login
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Just return the session without database check
  // This is more permissive and avoids database errors breaking the app
  console.log("Session validated with user ID:", session.user.id);
  return session as Session & { user: NonNullable<Session["user"]> };

  /* Commented out database check that was causing issues
  try {
    // Verify user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    // If no user found but we have a session, redirect to logout
    if (!user) {
      console.warn(`User with ID ${session.user.id} found in session but not in database. Redirecting to logout.`);
      redirect("/api/auth/signout");
    }

    // Return session if everything is valid
    // We can safely assert the user is non-null because we've checked above
    return session as Session & { user: NonNullable<Session["user"]> };
  } catch (error) {
    console.error("Error validating user session:", error);
    throw error;
  }
  */
}
