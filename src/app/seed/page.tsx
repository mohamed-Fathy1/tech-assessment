"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SeedForm } from "@/components/debug/seed-form";
import Link from "next/link";

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message?: string;
    error?: string;
    user?: {
      id: string;
      email: string | null;
      name: string | null;
    };
  } | null>(null);

  const handleSeed = async () => {
    try {
      setIsLoading(true);

      // Use our existing GET API endpoint
      const response = await fetch("/api/seed");

      const data = await response.json();

      setResult(data);

      if (response.ok) {
        toast.success(data.message || "Database seeded successfully!");
      } else {
        toast.error(data.error || "Failed to seed database");
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      toast.error("An error occurred while seeding the database");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Seed Database</h1>

      <div className="mb-6 bg-yellow-100 p-4 rounded-lg text-yellow-800">
        <p className="font-medium">⚠️ Warning: For testing purposes only</p>
        <p className="mt-1">This will create test users and data in your database.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-3">Create Test User</h2>
          <div className="bg-white p-4 rounded-lg border">
            <SeedForm />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Pre-configured Test Users</h2>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium">Admin User</h3>
              <p className="text-sm text-muted-foreground">Email: admin@example.com</p>
              <p className="text-sm text-muted-foreground">Password: password123</p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium">Test User</h3>
              <p className="text-sm text-muted-foreground">Email: user@example.com</p>
              <p className="text-sm text-muted-foreground">Password: password123</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Navigation</h2>
        <ul className="list-disc pl-6">
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
              href="/debug/session"
              className="text-blue-600 hover:underline"
            >
              Check Current Session
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
          <li>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:underline"
            >
              Dashboard
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
