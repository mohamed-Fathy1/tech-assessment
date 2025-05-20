"use client";

import Link from "next/link";

export default function DebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Debug Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DebugCard
          title="Session Info"
          description="View your current session details and authentication status"
          link="/debug/session"
          icon="🔑"
        />

        <DebugCard
          title="Database Users"
          description="List all users in the database with their details"
          link="/debug/users"
          icon="👥"
        />

        <DebugCard
          title="Database Connection"
          description="Check if the database connection is working properly"
          link="/debug/db"
          icon="🔌"
        />

        <DebugCard
          title="Seed Database"
          description="Create test user accounts for development"
          link="/seed"
          icon="🌱"
        />

        <DebugCard
          title="Test Project Creation"
          description="Test creating projects directly via API"
          link="/debug/test-project"
          icon="🧪"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Application Navigation</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-md text-slate-800 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-md text-slate-800 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-md text-slate-800 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper component for debug card
function DebugCard({
  title,
  description,
  link,
  icon,
}: {
  title: string;
  description: string;
  link: string;
  icon: string;
}) {
  return (
    <Link
      href={link}
      className="block border rounded-lg p-5 hover:shadow-md transition-shadow"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
