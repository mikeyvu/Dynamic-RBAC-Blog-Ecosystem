"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PostManagement from "./components/post-management";
import UserManagement from "./components/user-management";

export default function DashboardPage() {
  const { user, loading: authLoading, hasPermissions, isAdmin } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  // Sync hydration state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true); // Only runs after the component has mounted on the client
  }, []);

  //Check if loading does not have user -> kick back to login page
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login");
    }
  }, [mounted, authLoading, user, router]);

  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-semibold animate-pulse">
          Loading System Data...
        </p>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
      {/* Header Dashboard */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            RBAC Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Welcome,{" "}
            <span className="font-semibold text-blue-600">{user.email}</span>{" "}
            (with role:{" "}
            <span className="uppercase text-orange-600 font-bold">
              {user.role || "User"}
            </span>
            )
          </p>
        </div>
        <Button variant="destructive" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      {/* RBAC tabs */}
      <Tabs defaultValue="posts" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Post Management Tab</TabsTrigger>

          {/* REQUIREMENT 1: Only Admin can see User Management Tab */}
          {isAdmin && (
            <TabsTrigger
              value="users"
              className="bg-amber-100 data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              🛡️ User Management Tab
            </TabsTrigger>
          )}
        </TabsList>

        <PostManagement user={user} hasPermissions={hasPermissions} />
        <UserManagement isAdmin={isAdmin} />
      </Tabs>
    </div>
  );
}
