"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Folders,
  DollarSign,
  UserPlus,
  FileSpreadsheet,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
}

function SidebarNavItem({ href, icon, title }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all hover:bg-accent",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
}

export function DashboardSidebar() {
  return (
    <div className="hidden w-56 border-r bg-background lg:block">
      <div className="flex h-full max-h-screen flex-col">
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-3">
            <SidebarNavItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-3.5 w-3.5" />}
              title="Overview"
            />

            <div className="mt-3 mb-1 text-xs font-medium uppercase text-muted-foreground">Employee Management</div>
            <SidebarNavItem
              href="/dashboard/employees"
              icon={<Users className="h-3.5 w-3.5" />}
              title="All Employees"
            />
            {/* <SidebarNavItem
              href="/dashboard/employees/new"
              icon={<UserPlus className="h-3.5 w-3.5" />}
              title="Add Employee"
            /> */}
            <SidebarNavItem
              href="/dashboard/employees/salary-table"
              icon={<DollarSign className="h-3.5 w-3.5" />}
              title="Salary Table"
            />

            <div className="mt-3 mb-1 text-xs font-medium uppercase text-muted-foreground">Projects</div>
            <SidebarNavItem
              href="/dashboard/projects"
              icon={<Folders className="h-3.5 w-3.5" />}
              title="All Projects"
            />
            <SidebarNavItem
              href="/dashboard/projects/tasks/kanban"
              icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
              title="Task Board"
            />

            <div className="mt-3 mb-1 text-xs font-medium uppercase text-muted-foreground">Tools</div>
            <SidebarNavItem
              href="/dashboard/chatbot"
              icon={<MessageCircle className="h-3.5 w-3.5" />}
              title="AI Assistant"
            />

            <div className="mt-3 mb-1 text-xs font-medium uppercase text-muted-foreground">Settings</div>
            <SidebarNavItem
              href="/dashboard/settings"
              icon={<Settings className="h-3.5 w-3.5" />}
              title="Settings"
            />
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-8"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
