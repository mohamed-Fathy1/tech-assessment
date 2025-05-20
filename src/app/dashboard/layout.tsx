import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Add extensive debug logging
  console.log("Dashboard Layout - Session check:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userName: session?.user?.name,
    userEmail: session?.user?.email,
  });

  // Simple session check without database validation
  if (!session?.user) {
    console.log("No session or user, redirecting to login");
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-12 items-center border-b bg-background px-3 lg:hidden">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <span className="font-semibold">Blurr.so HR Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{session.user.name || session.user.email}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto pl-6 pr-6 py-5">{children}</main>
      </div>
    </div>
  );
}
