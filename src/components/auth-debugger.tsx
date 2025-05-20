"use client";

import { useAuthDebug } from "@/hooks/use-auth-debug";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Component to debug authentication issues
 * Place this on pages to see authentication state
 */
export function AuthDebugger() {
  const { session, status } = useAuthDebug();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-lg border p-4 my-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Auth Debugger</h3>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-mono">{status}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
      </div>

      {showDetails && (
        <div className="mt-4">
          <pre className="text-xs p-2 bg-slate-100 rounded overflow-auto">{JSON.stringify(session, null, 2)}</pre>

          <div className="mt-2 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                window.location.href = "/api/auth/signout";
              }}
            >
              Force Sign Out
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                window.location.href = "/api/auth/signin";
              }}
            >
              Force Sign In
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
