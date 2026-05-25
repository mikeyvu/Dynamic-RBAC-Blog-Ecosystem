"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Post } from "@/types/post";
import api from "@/utils/axios";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, loading: authLoading, hasPermissions, isAdmin } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLoading, setPostsLoading] = useState(true);

  // Sync hydration state
  useEffect(() => {
    setMounted(true); // Only runs after the component has mounted on the client
  }, []);

  // Fetch posts from NestJS Backend
  useEffect(() => {
    const fetchPosts = async () => {
      if (!mounted || !user) return;
      try {
        setPostsLoading(true);
        const response = await api.get('/posts');
        setPosts(response.data);
      } catch (err: unknown) {
        let errorMsg = 'Failed to load posts!';
        if (axios.isAxiosError(err)) {
          errorMsg = err.response?.data?.message || errorMsg;
        }
        toast.error(errorMsg);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [mounted, user]);

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

  const loggedInUserId = user.userId;

  const yourPosts = posts.filter(post => post.authorId == loggedInUserId);
  const otherPosts = posts.filter(post => post.authorId !== loggedInUserId);

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

          {/* 🌟 REQUIREMENT 1: Only Admin can see User Management Tab */}
          {isAdmin && (
            <TabsTrigger
              value="users"
              className="bg-amber-100 data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              🛡️ User Management Tab 
            </TabsTrigger>
          )}
        </TabsList>

        {/* --- TAB CONTENT: POSTS --- */}
        <TabsContent value="posts">
          <div className="space-y-6">
            
            {/* Thanh công cụ hành động phía trên */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm dark:bg-slate-800">
              <div>
                <h2 className="text-xl font-bold">System Articles</h2>
                <p className="text-xs text-slate-400">Manage your contents or explore other authors' work.</p>
              </div>
              {hasPermissions('CREATE_POST') && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                  ➕ Create New Post
                </Button>
              )}
            </div>

            {postLoading ? (
              <p className="text-center text-sm text-slate-500 animate-pulse py-10">Fetching posts from database...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 🏡 NHÓM 1: YOUR POSTS (Bài viết của bạn) */}
                <Card className="border-blue-100 bg-blue-50/10">
                  <CardHeader>
                    <CardTitle className="text-blue-600 flex items-center gap-2">📝 Your Posts ({yourPosts.length})</CardTitle>
                    <CardDescription>Articles created by you. You have full edit/delete permissions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {yourPosts.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-4">You haven't posted anything yet.</p>
                    ) : (
                      yourPosts.map(post => (
                        <div key={post.id} className="border rounded-md p-4 bg-white dark:bg-slate-800 shadow-sm flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">{post.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{post.content}</p>
                            <span className="text-[10px] text-slate-400 block mt-2">
                              Created: {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* 🌟 Có toàn quyền Sửa/Xóa với bài viết của chính mình */}
                          <div className="flex flex-col gap-2 ml-4">
                            {hasPermissions('UPDATE_POST') && (
                              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">✏️ Edit</Button>
                            )}
                            {hasPermissions('DELETE_POST') && (
                              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">🗑️ Delete</Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* 🌍 NHÓM 2: OTHER POSTS (Bài viết của người khác) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-slate-700 dark:text-slate-300">🌐 Other Posts ({otherPosts.length})</CardTitle>
                    <CardDescription>Articles from other authors. Read-only mode active.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {otherPosts.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-4">No community posts available.</p>
                    ) : (
                      otherPosts.map(post => (
                        <div key={post.id} className="border rounded-md p-4 bg-white dark:bg-slate-800 shadow-sm">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">{post.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{post.content}</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 mt-2 border-t">
                              <span>By: {post.user?.email || 'Unknown Author'}</span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {/* 🌟 Ở ĐÂY HOÀN TOÀN KHÔNG CÓ NÚT SỬA/XÓA (Read-only đúng Requirement) */}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

              </div>
            )}
          </div>
        </TabsContent>

        {/* --- TAB CONTENT: USERS MANAGEMENT (only Admin can access) --- */}
        {isAdmin && (
          <TabsContent value="users">
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="text-amber-800">
                  🛡️ User Management Tab
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-white p-4 space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Dữ liệu tài khoản trong hệ thống:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    <li>
                      admin@gmail.com -{" "}
                      <span className="badge bg-slate-100 px-1 rounded text-xs font-bold text-amber-700">
                        ADMIN
                      </span>
                    </li>
                    <li>
                      author_mikey@gmail.com -{" "}
                      <span className="badge bg-slate-100 px-1 rounded text-xs font-bold text-blue-700">
                        AUTHOR
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
