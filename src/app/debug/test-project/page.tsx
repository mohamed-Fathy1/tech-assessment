"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function TestProjectPage() {
  const [name, setName] = useState("Test Project");
  const [description, setDescription] = useState("This is a test project created via the debug page");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleTestCreate() {
    try {
      setIsLoading(true);
      setResult(null);

      const response = await fetch("/api/test/create-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        statusText: response.statusText,
        ...data,
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Debug: Test Project Creation</h1>

      <div className="mb-6 bg-blue-100 p-4 rounded-lg text-blue-800">
        <p>This page allows you to test the project creation functionality directly without going through the UI.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-3">Create Test Project</h2>
          <div className="bg-white p-4 rounded-lg border space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>

            <Button
              onClick={handleTestCreate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Result</h2>
          <div className="bg-white p-4 rounded-lg border min-h-[200px]">
            {result ? (
              <div>
                <div className="mb-2 flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${result.success ? "bg-green-500" : "bg-red-500"}`}></div>
                  <span className="font-medium">
                    {result.success ? "Success" : `Error: ${result.error || "Unknown error"}`}
                  </span>
                </div>
                <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto mt-3 max-h-[300px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No result yet. Click "Create Project" to test.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Navigation</h2>
        <ul className="list-disc pl-6">
          <li>
            <Link
              href="/debug/session"
              className="text-blue-600 hover:underline"
            >
              Check Session
            </Link>
          </li>
          <li>
            <Link
              href="/debug/users"
              className="text-blue-600 hover:underline"
            >
              View Users
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/projects"
              className="text-blue-600 hover:underline"
            >
              Projects Dashboard
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
