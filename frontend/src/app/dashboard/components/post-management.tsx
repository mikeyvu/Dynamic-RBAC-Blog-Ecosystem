"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function PostManagement({
  user,
  hasPermissions,
}: PostManagementProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLoading, setPostsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const BACKEND_URL = "http://localhost:3000";

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
      // Initiate form data for both create and edit
      const formData = new FormData();
      formData.append("title", formTitle);
      formData.append("content", formContent);

      // If user choose image, put that file in FormData with key=image
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      if (dialogMode === "create") {
        //Post API for create new record
        // Send API with special Content-Type for File
        await api.post("/posts", formData, {
          headers: {
            "Content-Type": "multipart/form-data", // Let Axios know there is file in the request
          },
        });
        toast.success("Created new post successfully!");
      } else if (dialogMode === "edit" && selectedPostId) {
        // Send post update request to backend
        await api.patch(`/posts/${selectedPostId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Updated post successfully!");
      }
      setIsDialogOpen(false);
      setSelectedFile(null); //reset file input back to null after we done
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
    const currentUserName = user?.email
      ? user.email.split("@")[0].toUpperCase()
      : "User";
    if (
      !window.confirm(
        `Are you sure you want to delete this post, ${currentUserName}?`,
      )
    )
      return;

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
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm dark:bg-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                System Articles
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your content or explore other authors&apos; work.
              </p>
            </div>
            {hasPermissions("post:create") && (
              <Button
                onClick={openCreateModal}
                className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-sm gap-1.5"
              >
                + New Post
              </Button>
            )}
          </div>

          {postLoading ? (
            <p className="text-center text-sm text-slate-500 animate-pulse py-10">
              Fetching posts from database...
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Group Card: Your Posts */}
              <Card className="border-blue-200 bg-white shadow-md dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-blue-700 text-base font-bold">
                      Your Posts
                    </CardTitle>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                      {yourPosts.length}
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    Articles you authored — full edit and delete access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {yourPosts.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <p className="text-2xl mb-2">✍️</p>
                      <p className="text-sm font-medium">No posts yet</p>
                      <p className="text-xs mt-1">
                        Hit &quot;New Post&quot; to publish your first article.
                      </p>
                    </div>
                  ) : (
                    yourPosts.map((post) => (
                      <div
                        key={post.id}
                        className="border rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {post.title}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {post.content}
                            </p>
                            {post.imageUrl && (
                              <img
                                src={`${BACKEND_URL}${post.imageUrl}`} // Ghép host của NestJS vào đầu URL tĩnh
                                alt={post.title}
                                className="w-full h-40 object-cover rounded-md mb-2 mt-1"
                              />
                            )}
                            <span className="text-[10px] text-slate-400 block pt-1">
                              {new Date(post.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {hasPermissions("post:update") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(post)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-2.5"
                              >
                                Edit
                              </Button>
                            )}
                            {hasPermissions("post:delete") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2.5"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Second Group Card: Other People's Posts */}
              <Card className="border-slate-200 bg-white shadow-md dark:bg-slate-800 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-700 dark:text-slate-300 text-base font-bold">
                      Community Posts
                    </CardTitle>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      {otherPosts.length}
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    Articles from other authors — read only.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {otherPosts.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <p className="text-2xl mb-2">🌐</p>
                      <p className="text-sm font-medium">
                        No community posts yet
                      </p>
                      <p className="text-xs mt-1">
                        Other authors&apos; articles will appear here.
                      </p>
                    </div>
                  ) : (
                    otherPosts.map((post) => (
                      <div
                        key={post.id}
                        className="border rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {post.title}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {post.content}
                            </p>
                            {post.imageUrl && (
                              <img
                                src={`${BACKEND_URL}${post.imageUrl}`} // Ghép host của NestJS vào đầu URL tĩnh
                                alt={post.title}
                                className="w-full h-40 object-cover rounded-md mb-2 mt-1"
                              />
                            )}
                            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 mt-1 border-t border-slate-100">
                              <span className="font-medium">
                                {post.user?.email?.split("@")[0] ||
                                  "Unknown Author"}
                              </span>
                              <span>
                                {new Date(post.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {hasPermissions("post:manage") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(post)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-2.5"
                              >
                                Edit
                              </Button>
                            )}
                            {hasPermissions("post:manage") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2.5"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
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
        <DialogContent className="sm:max-w-[540px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg">
                {dialogMode === "create" ? "Create New Post" : "Edit Post"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "create"
                  ? "Publish a new article to the community."
                  : "Update your article's title or content."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title" className="font-semibold text-slate-700">
                  Title
                </Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Enter a clear, descriptive title..."
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="content"
                  className="font-semibold text-slate-700"
                >
                  Content
                </Label>
                <textarea
                  id="content"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write your article content here..."
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right font-semibold">
                  Cover Image
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*" // Only show image file when select
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]); // Save file to state
                    }
                  }}
                  className="col-span-3 cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                {actionLoading
                  ? "Saving..."
                  : dialogMode === "create"
                    ? "Publish"
                    : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
