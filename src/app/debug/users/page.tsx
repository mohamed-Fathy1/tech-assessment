import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DebugUsersPage() {
  let users = [];
  let error = null;

  try {
    users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            employees: true,
          },
        },
      },
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Debug: Users in Database</h1>

      {error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error fetching users:</p>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <p className="mb-4">Total users: {users.length}</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-2 text-left">ID</th>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Created At</th>
                  <th className="border p-2 text-left">Projects</th>
                  <th className="border p-2 text-left">Employees</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border p-2 font-mono text-xs">{user.id}</td>
                    <td className="border p-2">{user.name || "—"}</td>
                    <td className="border p-2">{user.email || "—"}</td>
                    <td className="border p-2">{new Date(user.createdAt).toLocaleString()}</td>
                    <td className="border p-2">{user._count.projects}</td>
                    <td className="border p-2">{user._count.employees}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="border p-4 text-center text-muted-foreground"
                    >
                      No users found in the database
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

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
              href="/debug/db"
              className="text-blue-600 hover:underline"
            >
              Check Database Connection
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
