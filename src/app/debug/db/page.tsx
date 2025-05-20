import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DebugDatabasePage() {
  let isConnected = false;
  let error = null;

  try {
    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Debug: Database Connection</h1>

      <div className={`p-4 rounded-lg mb-6 ${isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        <p className="font-semibold">
          {isConnected ? "✓ Database connection successful" : "✗ Database connection failed"}
        </p>
        {error && <p className="mt-2">{error}</p>}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Database URL</h2>
          <div className="bg-slate-100 p-3 rounded-lg">
            <p className="font-mono text-sm break-all">
              {process.env.DATABASE_URL
                ? process.env.DATABASE_URL.replace(/(.*?):\/\/.*?:.*?@/g, "$1://[username]:[password]@")
                : "DATABASE_URL environment variable not set"}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Prisma Client Status</h2>
          <div className="bg-slate-100 p-3 rounded-lg">
            <p>{isConnected ? "Prisma client is working properly" : "Prisma client connection issue"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Debug Links</h2>
        <ul className="list-disc pl-6">
          <li>
            <Link
              href="/debug/session"
              className="text-blue-600 hover:underline"
            >
              View Session Information
            </Link>
          </li>
          <li>
            <Link
              href="/debug/users"
              className="text-blue-600 hover:underline"
            >
              View Users in Database
            </Link>
          </li>
          <li>
            <Link
              href="/seed"
              className="text-blue-600 hover:underline"
            >
              Seed Database
            </Link>
          </li>
          <li>
            <Link
              href="/login"
              className="text-blue-600 hover:underline"
            >
              Login Page
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
