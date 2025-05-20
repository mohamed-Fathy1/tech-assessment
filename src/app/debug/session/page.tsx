import { auth } from "@/auth";

export default async function DebugSessionPage() {
  const session = await auth();

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Debug: Session Information</h1>

      <div className="bg-slate-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Session Status</h2>
        <p>Session exists: {session ? "Yes" : "No"}</p>
        <p>User in session: {session?.user ? "Yes" : "No"}</p>
        <p>User ID: {session?.user?.id || "Not available"}</p>
        <p>User email: {session?.user?.email || "Not available"}</p>
      </div>

      <pre className="mt-6 p-4 bg-slate-100 rounded-lg overflow-auto">{JSON.stringify(session, null, 2)}</pre>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Debug Links</h2>
        <ul className="list-disc pl-6">
          <li>
            <a
              href="/debug/users"
              className="text-blue-600 hover:underline"
            >
              View Users in Database
            </a>
          </li>
          <li>
            <a
              href="/debug/db"
              className="text-blue-600 hover:underline"
            >
              Check Database Connection
            </a>
          </li>
          <li>
            <a
              href="/login"
              className="text-blue-600 hover:underline"
            >
              Login Page
            </a>
          </li>
          <li>
            <a
              href="/dashboard"
              className="text-blue-600 hover:underline"
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/api/auth/signout"
              className="text-blue-600 hover:underline"
            >
              Sign Out
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
