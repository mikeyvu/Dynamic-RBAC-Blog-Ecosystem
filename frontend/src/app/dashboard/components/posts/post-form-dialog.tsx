// 📄 Vị trí file: @/components/posts/post-form-dialog.tsx
import { Button } from "@/components/ui/button";
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

interface PostFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogMode: "create" | "edit";
  formTitle: string;
  setFormTitle: (title: string) => void;
  formContent: string;
  setFormContent: (content: string) => void;
  actionLoading: boolean;
  setSelectedFiles: (files: File[]) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PostFormDialog({
  isOpen,
  onOpenChange,
  dialogMode,
  formTitle,
  setFormTitle,
  formContent,
  setFormContent,
  actionLoading,
  setSelectedFiles,
  onSubmit,
}: PostFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <form onSubmit={onSubmit}>
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
              <Label htmlFor="content" className="font-semibold text-slate-700">
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
                Post Images
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedFiles(Array.from(e.target.files));
                  }
                }}
                className="col-span-3 cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 font-semibold">
              {actionLoading ? "Saving..." : dialogMode === "create" ? "Publish" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}