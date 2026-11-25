import React from "react";
import { Search, X, Layers } from "lucide-react";

interface CategoryFilterBarProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalFiltered: number;
  totalAll: number;
}

export default function CategoryFilterBar({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalFiltered,
  totalAll,
}: CategoryFilterBarProps) {
  return (
    <div
      className="jarida-filter-bar z-15 w-full max-w-[840px] mx-auto px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs"
      dir="rtl"
    >
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full sm:max-w-[65%]">
        <span className="text-[#6d5b3d] flex items-center gap-1 text-[11px] font-bold flex-shrink-0">
          <Layers className="w-3 h-3 text-[#947743]" />
          الأقسام:
        </span>
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex-shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-[#233c30] text-[#dcb45b] shadow-sm ring-1 ring-[#dcb45b]/50"
                  : "bg-[#efe5ce]/90 text-[#4c3f2b] hover:bg-[#e4d6b6] border border-[#d8c8a5]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Instant Search Input */}
      <div className="relative flex-1 sm:flex-initial sm:w-56 min-w-[150px]">
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#7d6948]">
          <Search className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث في الأخبار والتقارير..."
          className="w-full pr-7 pl-6 py-1 text-xs bg-[#f7efdc]/95 text-[#241a0d] placeholder-[#8a7657] border border-[#cfbd97] rounded-full focus:outline-none focus:ring-1 focus:ring-[#233c30] focus:border-[#233c30] shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 left-0 pl-2 flex items-center text-[#7d6948] hover:text-black cursor-pointer"
            aria-label="مسح البحث"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter result counter */}
      {(searchQuery || activeCategory !== "الكل") && (
        <div className="w-full text-center text-[11px] text-[#786341] py-0.5">
          عرض <strong>{totalFiltered}</strong> من أصل {totalAll} مادة صحفية
        </div>
      )}
    </div>
  );
}
