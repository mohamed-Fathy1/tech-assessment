"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SeedForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Test User");

  async function handleSeed() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Test user created successfully");
      } else {
        toast.error(`Failed to create test user: ${data.error}`);
      }
    } catch (error) {
      toast.error("An error occurred while seeding the database");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="User name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
      </div>

      <Button
        onClick={handleSeed}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Creating..." : "Create Test User"}
      </Button>
    </div>
  );
}
