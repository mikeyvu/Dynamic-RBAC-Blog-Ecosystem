// 📄 Vị trí file: @/components/posts/post-toolbar.tsx
import { Button } from "@/components/ui/button";

interface PostToolbarProps {
  hasPermissions: (permission: string) => boolean;
  onOpenCreateModal: () => void;
}

export function PostToolbar({ hasPermissions, onOpenCreateModal }: PostToolbarProps) {
  return (
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
          onClick={onOpenCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-sm gap-1.5"
        >
          + New Post
        </Button>
      )}
    </div>
  );
}