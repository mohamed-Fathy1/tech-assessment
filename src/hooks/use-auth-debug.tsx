"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

/**
 * Hook to debug authentication issues
 * Add this to client components to understand auth state
 */
export function useAuthDebug() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("Auth Debug - Client Side:", {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userName: session?.user?.name,
      userEmail: session?.user?.email,
    });
  }, [session, status]);

  return { session, status };
}
