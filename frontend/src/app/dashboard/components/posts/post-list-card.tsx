// 📄 Vị trí file: @/components/posts/post-list-card.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Post } from "@/types/post";

interface PostListCardProps {
  title: string;
  description: string;
  posts: Post[];
  titleClassName?: string;
  cardClassName?: string;
  countBadgeClassName?: string;
  emptyIcon: string;
  emptyText: string;
  emptyDescription: string;
  hasPermissions: (permission: string) => boolean;
  onOpenEditModal: (post: Post) => void;
  onDeletePost: (id: number) => void;
  showAuthor?: boolean;
}

export function PostListCard({
  title,
  description,
  posts,
  titleClassName = "text-slate-700 dark:text-slate-300",
  cardClassName = "border-slate-200 bg-white shadow-md dark:bg-slate-800",
  countBadgeClassName = "bg-slate-100 text-slate-600",
  emptyIcon,
  emptyText,
  emptyDescription,
  hasPermissions,
  onOpenEditModal,
  onDeletePost,
  showAuthor = false,
}: PostListCardProps) {
  const BACKEND_URL = "http://localhost:3000";

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-base font-bold ${titleClassName}`}>{title}</CardTitle>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${countBadgeClassName}`}>
            {posts.length}
          </span>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-2xl mb-2">{emptyIcon}</p>
            <p className="text-sm font-medium">{emptyText}</p>
            <p className="text-xs mt-1">{emptyDescription}</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{post.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {post.content}
                  </p>

                  {post.documents && post.documents.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2 mt-1">
                      {post.documents.map((doc: any) => (
                        <img
                          key={doc.id}
                          src={`${BACKEND_URL}${doc.imageUrl}`}
                          alt="Attachment"
                          className="w-full h-28 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 mt-1 border-t border-slate-100">
                    {showAuthor && (
                      <span className="font-medium">{post.user?.email?.split("@")[0] || "Unknown Author"}</span>
                    )}
                    <span>
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  {(hasPermissions("post:update") || (showAuthor && hasPermissions("post:manage"))) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenEditModal(post)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-2.5"
                    >
                      Edit
                    </Button>
                  )}
                  {(hasPermissions("post:delete") || (showAuthor && hasPermissions("post:manage"))) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeletePost(post.id)}
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
  );
}