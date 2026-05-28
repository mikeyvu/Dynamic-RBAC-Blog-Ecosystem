// 📄 Vị trí file: @/components/post-management.tsx
"use client";

import { TabsContent } from "@/components/ui/tabs";
import { Post } from "@/types/post";
import api from "@/utils/axios";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DateRange } from "react-day-picker"; // Import kiểu dữ liệu của bộ lịch

// Import các component con
import { PostToolbar } from "./posts/post-toolbar";
import { PostFilterBar } from "./posts/post-filter-bar"; // 🌟 Import thanh lọc mới
import { PostListCard } from "./posts/post-list-card";
import { PostFormDialog } from "./posts/post-form-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  // 🌟 KHỞI TẠO CÁC STATE CHO BỘ LỌC
  const [hasImage, setHasImage] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  // 🌟 KHỞI TẠO CÁC STATE PHÂN TRANG
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10); // Đặt cứng mỗi trang hiển thị 10 bài viết

  // State lưu giá trị tạm thời trong ô gõ (dạng chuỗi để user dễ xóa/sửa)
  const [pageInput, setPageInput] = useState<string>(String(currentPage));

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // 🌟 CẬP NHẬT HÀM FETCH: Đưa các query params vào Axios request gửi lên NestJS
  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const params: any = {
        _t: new Date().getTime(),
        page: currentPage,
        limit: itemsPerPage,
      };

      if (hasImage !== "all") {
        params.hasImage = hasImage;
      }
      if (dateRange?.from) {
        params.startDate = dateRange.from.toISOString();
      }
      if (dateRange?.to) {
        params.endDate = dateRange.to.toISOString();
      }

      // Gửi request kèm theo bộ params lọc thông minh
      const response = await api.get("/posts", { params });
      setPosts(response.data.items);
      // Cập nhật tổng số trang lấy từ metadata `.meta.totalPages`
      setTotalPages(response.data.meta.totalPages || 1);
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

  // 🌟 KÍCH HOẠT LẠI API: Mỗi khi user thay đổi bộ lọc trên UI, useEffect sẽ tự động gọi lại fetchPosts
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, hasImage, dateRange, currentPage]);

  // Mỗi khi currentPage thay đổi từ bên ngoài (như bấm Next/Prev/Reset bộ lọc), đồng bộ lại vào ô gõ
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // Nếu người dùng thay đổi bộ lọc, ép trang quay về trang 1 để tránh lỗi lệch trang
  const handleFilterChange = (val: string) => {
    setHasImage(val);
    setCurrentPage(1);
  };

  // Hàm Reset bộ lọc về mặc định ban đầu
  const handleClearFilters = () => {
    setHasImage("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const handleDateRangeChange = (range: any) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const loggedInUserId = Number(user.userId);
  const yourPosts = posts.filter((post) => post.authorId === loggedInUserId);
  const otherPosts = posts.filter((post) => post.authorId !== loggedInUserId);

  const openCreateModal = () => {
    setDialogMode("create");
    setFormTitle("");
    setFormContent("");
    setSelectedFiles([]);
    setIsDialogOpen(true);
  };

  const openEditModal = (post: Post) => {
    setDialogMode("edit");
    setSelectedPostId(post.id);
    setFormTitle(post.title);
    setFormContent(post.content);
    setSelectedFiles([]);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error("Please fill in all fields!");
      return;
    }
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", formTitle);
      formData.append("content", formContent);

      if (selectedFiles && selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      if (dialogMode === "create") {
        await api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Created new post successfully!");
      } else if (dialogMode === "edit" && selectedPostId) {
        await api.patch(`/posts/${selectedPostId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Updated post successfully!");
      }
      setIsDialogOpen(false);
      setSelectedFiles([]);
      fetchPosts();
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

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Chặn reload trang

    const targetPage = Math.floor(Number(pageInput));

    // Kiểm tra tính hợp lệ: phải là số, lớn hơn 0 và không vượt quá tổng số trang
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
    } else {
      // Nếu gõ bậy bạ thì reset ô nhập về số trang hiện tại và báo lỗi nhẹ
      setPageInput(String(currentPage));
      toast.error(`Vui lòng nhập số trang hợp lệ từ 1 đến ${totalPages}!`);
    }
  };

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
      fetchPosts();
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
      <TabsContent value="posts">
        <div className="space-y-4">
          {" "}
          {/* Chỉnh lại khoảng cách cho khít và đẹp */}
          {/* 1. Thanh công cụ Toolbar */}
          <PostToolbar
            hasPermissions={hasPermissions}
            onOpenCreateModal={openCreateModal}
          />
          {/* 🌟 2. CHÈN THANH BỘ LỌC ĐA NĂNG SHADCN VÀO GIỮA TOOLBAR VÀ LIST */}
          <PostFilterBar
            hasImage={hasImage}
            onHasImageChange={handleFilterChange}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onClearFilters={handleClearFilters}
          />
          {postLoading ? (
            <p className="text-center text-sm text-slate-500 animate-pulse py-10">
              Filtering system articles from database...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3. Danh sách bài viết của tôi */}
                <PostListCard
                  title="Your Posts"
                  description="Articles you authored — full edit and delete access."
                  posts={yourPosts}
                  titleClassName="text-blue-700"
                  cardClassName="border-blue-200 bg-white shadow-md dark:bg-slate-800"
                  countBadgeClassName="bg-blue-100 text-blue-700 border-blue-200"
                  emptyIcon="✍️"
                  emptyText="No posts matched"
                  emptyDescription="Try adjusting your filters or publish a new post."
                  hasPermissions={hasPermissions}
                  onOpenEditModal={openEditModal}
                  onDeletePost={handleDeletePost}
                />

                {/* 4. Danh sách bài viết cộng đồng */}
                <PostListCard
                  title="Community Posts"
                  description="Articles from other authors — read only."
                  posts={otherPosts}
                  hasPermissions={hasPermissions}
                  onOpenEditModal={openEditModal}
                  onDeletePost={handleDeletePost}
                  emptyIcon="🌐"
                  emptyText="No community articles found"
                  emptyDescription="No articles match your current criteria."
                  showAuthor={true}
                />
              </div>

              {/* 🌟 THANH ĐIỀU HƯỚNG PHÂN TRANG KÈM Ô GÕ JUMP TO PAGE */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-medium dark:text-slate-400">
                  Total{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {totalPages}
                  </strong>{" "}
                  pages
                </span>

                <div className="flex items-center space-x-3">
                  {/* Nút Trang Trước */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>

                  {/* 🌟 HỘP DISPLAY SỐ TRANG CHO PHÉP EDIT & NHẤN ENTER */}
                  <form
                    onSubmit={handlePageSubmit}
                    className="flex items-center space-x-1.5"
                  >
                    <span className="text-xs text-slate-500">Page</span>
                    <Input
                      type="text"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      // Khi user bấm chuột ra ngoài ô gõ, tự động trigger nhảy trang luôn cho tiện
                      onBlur={handlePageSubmit}
                      className="w-12 h-8 text-center text-xs p-0 font-semibold focus-visible:ring-1 border-slate-200 dark:border-slate-700"
                    />
                    <span className="text-xs text-slate-500">
                      of {totalPages}
                    </span>
                  </form>

                  {/* Nút Trang Sau */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </TabsContent>

      {/* 5. Dialog Form độc lập */}
      <PostFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        dialogMode={dialogMode}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formContent={formContent}
        setFormContent={setFormContent}
        actionLoading={actionLoading}
        setSelectedFiles={setSelectedFiles}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
