"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="min-h-screen bg-blue-50 dark:bg-slate-900">
      {/* Top nav bar */}
      <header className="bg-white border-b shadow-sm dark:bg-slate-800 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{user.email}</p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                {user.role || "User"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-700 dark:text-slate-200 hidden sm:block">RBAC Dashboard</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-semibold"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* RBAC tabs */}
        <Tabs defaultValue="posts" className="w-full space-y-4">
          <TabsList className="bg-white border shadow-sm dark:bg-slate-800 dark:border-slate-700 p-1 h-auto">
            <TabsTrigger value="posts" className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-1.5">
              Posts
            </TabsTrigger>

            {/* REQUIREMENT 1: Only Admin can see User Management Tab */}
            {isAdmin && (
              <TabsTrigger
                value="users"
                className="text-sm font-medium data-[state=active]:bg-amber-500 data-[state=active]:text-white px-4 py-1.5"
              >
                User Management
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts">
            <PostManagement user={user} hasPermissions={hasPermissions} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
