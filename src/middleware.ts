import { NextResponse } from "next/server";

// Temporarily disable middleware to troubleshoot login redirection issues
export const config = {
  matcher: [],
};

export async function middleware() {
  // Skip all auth checks, let the page components handle authentication
  return NextResponse.next();
}
