"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Post } from "@/types/post";
import api from "@/utils/axios";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface PostManagementProps {
  user: { userId: string | number; email: string; role?: string | null };
  hasPermissions: (permission: string) => boolean;
}

export default function PostManagement({ user, hasPermissions }: PostManagementProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLoading, setPostsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch posts từ NestJS Backend
  const fetchPosts = async () => {
    try {
      const response = await api.get("/posts");
      setPosts(response.data);
    } catch (err: unknown) {
      let errorMsg = "Failed to load posts!";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.message || errorMsg;
      }
      toast.error(errorMsg);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPosts();
    }
  }, [user]);

  const loggedInUserId = Number(user.userId);
  const yourPosts = posts.filter((post) => post.authorId === loggedInUserId);
  const otherPosts = posts.filter((post) => post.authorId !== loggedInUserId);

  // Open modal in create mode
  const openCreateModal = () => {
    setDialogMode("create");
    setFormTitle("");
    setFormContent("");
    setIsDialogOpen(true);
  };

  // Open modal in edit mode(insert original data from the old post)
  const openEditModal = (post: Post) => {
    setDialogMode("edit");
    setSelectedPostId(post.id);
    setFormTitle(post.title);
    setFormContent(post.content);
    setIsDialogOpen(true);
  };

  // Handle Form Submission(create or update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error("Please fill in all fields!");
      return;
    }
    setActionLoading(true);
    try {
      if (dialogMode === "create") {
        // Send post create request to backend
        await api.post("/posts", { title: formTitle, content: formContent });
        toast.success("Created new post successfully!");
      } else if (dialogMode === "edit" && selectedPostId) {
        // Send post update request to backend
        await api.patch(`/posts/${selectedPostId}`, { title: formTitle, content: formContent });
        toast.success("Updated post successfully!");
      }
      setIsDialogOpen(false);
      fetchPosts(); // Pull new data from database to update the dashboard
    } catch (err: unknown) {
      let errorMsg = "Action failed!";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.message || errorMsg;
      }
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  //Handle Delete Post
  const handleDeletePost = async (id: number) => {
    const currentUserName = user?.email ? user.email.split("@")[0].toUpperCase() : "User";
    if (!window.confirm(`Are you sure you want to delete this post, ${currentUserName}?`)) return;

    try {
      await api.delete(`/posts/${id}`);
      toast.success("Deleted post successfully!");
      fetchPosts(); // Update the new Dashboard
    } catch (err: unknown) {
      let errorMsg = "Failed to delete post!";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.message || errorMsg;
      }
      toast.error(errorMsg);
    }
  };

  return (
    <>
      {/* --- TAB CONTENT: POSTS --- */}
      <TabsContent value="posts">
        <div className="space-y-6">

          {/* Tool Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm dark:bg-slate-800">
            <div>
              <h2 className="text-xl font-bold">System Articles</h2>
              <p className="text-xs text-slate-400">Manage your contents or explore other authors&apos; work.</p>
            </div>
            {hasPermissions('post:create') && (
              <Button
              onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                ➕ Create New Post
              </Button>
            )}
          </div>

          {postLoading ? (
            <p className="text-center text-sm text-slate-500 animate-pulse py-10">Fetching posts from database...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* First Group Card: Your Post */}
              <Card className="border-blue-100 bg-blue-50/10">
                <CardHeader>
                  <CardTitle className="text-blue-600 flex items-center gap-2">📝 Your Posts ({yourPosts.length})</CardTitle>
                  <CardDescription>Articles created by you. You have full edit/delete permissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {yourPosts.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-4">You haven&apos;t posted anything yet.</p>
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

                        {/* User can create/delete the post they created */}
                        <div className="flex flex-col gap-2 ml-4">
                          {hasPermissions('post:update') && (
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(post)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50">✏️ Edit</Button>
                          )}
                          {hasPermissions('post:delete') && (
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50">🗑️ Delete</Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Second Group Card: Other People's Posts */}
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
                        {/* Does not have edit or delete button on others' posts */}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </TabsContent>

      {/* Dynamic Dialog Form(Modal for both Create and Edit Posts) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" ? "✨ Create New Post" : "✏️ Edit Your Post"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "create"
                  ? "Publish a new article to the community ecosystem."
                  : "Modify your current article content here."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right font-semibold">Title</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right font-semibold">Content</Label>
                <textarea
                  id="content"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Type your article content here..."
                  className="col-span-3 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 font-bold">
                {actionLoading ? "Processing..." : dialogMode === "create" ? "Publish Now" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
