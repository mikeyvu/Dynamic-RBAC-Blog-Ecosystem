// 📄 Vị trí file: @/components/posts/post-filter-bar.tsx
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./date-range-picker";
import { DateRange } from "react-day-picker";
import { X } from "lucide-react";

interface PostFilterBarProps {
  hasImage: string;
  onHasImageChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (date: DateRange | undefined) => void;
  onClearFilters: () => void;
}

export function PostFilterBar({
  hasImage,
  onHasImageChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
}: PostFilterBarProps) {
  // Kiểm tra xem user có đang sử dụng bộ lọc nào không để hiển thị nút Reset
  const isFiltering = hasImage !== "all" || !!dateRange?.from;

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
        Filters:
      </span>

      {/* 1. Bộ lọc trạng thái ảnh */}
      <Select value={hasImage} onValueChange={onHasImageChange}>
        <SelectTrigger className="w-[160px] text-xs h-9">
          <SelectValue placeholder="Image status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Articles</SelectItem>
          <SelectItem value="true">🖼️ Has Images</SelectItem>
          <SelectItem value="false">📝 Text Only</SelectItem>
        </SelectContent>
      </Select>

      {/* 2. Bộ lọc khoảng ngày */}
      <DateRangePicker date={dateRange} onDateChange={onDateRangeChange} />

      {/* 3. Nút xóa nhanh bộ lọc */}
      {isFiltering && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-xs text-slate-500 hover:text-slate-800 h-9 gap-1 px-2"
        >
          <X className="h-3.5 w-3.5" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}