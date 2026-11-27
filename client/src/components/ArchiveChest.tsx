import { useState, useMemo } from "react";
import { X, Calendar, BookOpen, Layers, Search, Sparkles, Archive } from "lucide-react";

export interface ArchivedEditionItem {
  key: string;
  pageIndex: number;
  count: number;
  lead: any;
}

interface ArchiveChestProps {
  isOpen: boolean;
  onClose: () => void;
  editions: ArchivedEditionItem[];
  onSelectEdition: (pageIndex: number, key: string) => void;
}

export default function ArchiveChest({
  isOpen,
  onClose,
  editions,
  onSelectEdition,
}: ArchiveChestProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filteredEditions = useMemo(() => {
    return editions.filter((ed) => {
      const matchesMonth = selectedMonth === "all" || ed.key.startsWith(selectedMonth);
      if (!matchesMonth) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = ed.lead?.title?.toLowerCase() || "";
      const summary = ed.lead?.summary?.toLowerCase() || "";
      const dateStr = new Date(ed.key)
        .toLocaleDateString("ar-MA", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .toLowerCase();
      return title.includes(q) || summary.includes(q) || dateStr.includes(q);
    });
  }, [editions, searchQuery, selectedMonth]);

  if (!isOpen) return null;

  const handlePick = (pageIndex: number, key: string) => {
    setSelectedKey(key);
    setTimeout(() => {
      onSelectEdition(pageIndex, key);
      setSelectedKey(null);
    }, 350);
  };

  return (
    <div
      className="jarida-archive-overlay fixed inset-0 z-[250] flex flex-col items-center justify-start overflow-y-auto px-3 py-4 sm:py-8"
      style={{
        background: "radial-gradient(circle at 50% 20%, rgba(26, 20, 14, 0.96), rgba(10, 8, 5, 0.98))",
        backdropFilter: "blur(8px)",
      }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="أرشيف الأعداد السابقة"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl my-auto flex flex-col items-center bg-[#1e1710]/95 border border-[#b48d56]/40 rounded-2xl p-4 sm:p-7 shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-30 w-9 h-9 rounded-full bg-[#2d1e12] border border-[#a8824f]/60 text-[#eddcc4] hover:text-white hover:bg-[#452e1b] transition flex items-center justify-center cursor-pointer shadow-md"
          aria-label="إغلاق الأرشيف"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modern Header */}
        <div className="text-center mb-5 sm:mb-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2d1e12] border border-[#d4af37]/40 shadow-sm mb-2">
            <Archive className="w-4 h-4 text-[#d4af37]" />
            <span className="font-serif text-[#d4af37] text-xs sm:text-sm font-bold tracking-wide">
              السجل التاريخي والأرشيف الوطني
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#f5ebd7] tracking-tight">
            أرشيف الأعداد السابقة
          </h2>
          <p className="text-xs sm:text-sm text-[#bda482] max-w-lg mx-auto mt-1 leading-relaxed">
            استعرض واقرأ الأعداد اليومية السابقة والتقارير الصحفية الموثقة بجريدة الأفق
          </p>
        </div>

        {/* Toolbar: Search & Month Filters */}
        <div className="w-full flex flex-col gap-3 mb-5 px-1">
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="ابحث في عناوين وتقارير الأرشيف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pr-9 pl-4 py-2 rounded-xl bg-[#140e09] border border-[#7a5932]/70 text-[#f7efe1] placeholder-[#8c7457] focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37]"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88657]" />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#d8c2a3] bg-[#2d1e12]/80 px-3 py-2 rounded-xl border border-[#5a3f24]">
              <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>
                الأعداد المعروضة: <strong>{filteredEditions.length}</strong>
              </span>
            </div>
          </div>

          {/* Month Quick Tabs (Starting from Month 9 - September) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-bold text-[#bba17f] flex-shrink-0 ml-1">
              تصفح حسب الشهر:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMonth("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                selectedMonth === "all"
                  ? "bg-[#d4af37] text-black shadow-sm"
                  : "bg-[#2d1e12] text-[#d8c2a3] hover:bg-[#3d2a1b] border border-[#6b4c2b]"
              }`}
            >
              جميع الأعداد
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonth("2026-11")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                selectedMonth === "2026-11"
                  ? "bg-[#d4af37] text-black shadow-sm"
                  : "bg-[#2d1e12] text-[#d8c2a3] hover:bg-[#3d2a1b] border border-[#6b4c2b]"
              }`}
            >
              نونبر 2026 (شهر 11)
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonth("2026-10")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                selectedMonth === "2026-10"
                  ? "bg-[#d4af37] text-black shadow-sm"
                  : "bg-[#2d1e12] text-[#d8c2a3] hover:bg-[#3d2a1b] border border-[#6b4c2b]"
              }`}
            >
              أكتوبر 2026 (شهر 10)
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonth("2026-09")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                selectedMonth === "2026-09"
                  ? "bg-[#d4af37] text-black shadow-sm"
                  : "bg-[#2d1e12] text-[#d8c2a3] hover:bg-[#3d2a1b] border border-[#6b4c2b]"
              }`}
            >
              شتنبر 2026 (شهر 9 - الانطلاق) 🌟
            </button>
          </div>
        </div>

        {/* Editions Grid */}
        <div className="w-full">
          {filteredEditions.length === 0 ? (
            <div className="text-center py-16 text-[#9e8564]">
              <p className="text-sm">لم يتم العثور على أعداد تطابق عبارة البحث.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 max-h-[58vh] overflow-y-auto pl-1 pr-1 custom-chest-scrollbar">
              {filteredEditions.map((ed) => {
                const isPicked = selectedKey === ed.key;
                const dateObj = new Date(ed.key);
                const arabicDate = dateObj.toLocaleDateString("ar-MA", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });

                return (
                  <button
                    key={ed.key}
                    type="button"
                    onClick={() => handlePick(ed.pageIndex, ed.key)}
                    className={`jarida-archive-card group relative text-right p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${
                      isPicked
                        ? "bg-[#faf0d9] text-black ring-4 ring-[#d4af37] -translate-y-2 scale-102 shadow-2xl z-30"
                        : "bg-[#f8f5ed] text-[#241a10] border-[#d8c7a8] hover:-translate-y-1.5 hover:shadow-xl hover:border-[#b48d56]"
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-[#dfd0b6] pb-2 mb-2">
                        <span className="font-serif font-black text-xs text-[#2c1d0f] tracking-wide">
                          جريدة الأفق
                        </span>
                        <span className="text-[10.5px] font-sans font-bold text-[#70522a] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#947743]" />
                          {arabicDate}
                        </span>
                      </div>

                      {/* Headline */}
                      <h4 className="font-serif font-bold text-xs sm:text-[13px] line-clamp-2 leading-snug mb-2 text-[#1a120a] group-hover:text-[#825419] transition">
                        {ed.lead?.title || "عدد أرشيفي شامل"}
                      </h4>

                      {/* Thumbnail preview */}
                      {ed.lead?.imageUrl && (
                        <div className="w-full h-24 mb-2 rounded-lg overflow-hidden border border-[#dfd0b6] bg-[#ede1c7]">
                          <img
                            src={ed.lead.imageUrl}
                            alt=""
                            className="w-full h-full object-cover filter contrast-[1.04] group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Summary */}
                      {ed.lead?.summary && (
                        <p className="text-[11px] text-[#52412d] line-clamp-2 leading-relaxed">
                          {ed.lead.summary}
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-3 pt-2 border-t border-[#e2d5bd] flex items-center justify-between text-[10.5px] font-sans">
                      <span className="text-[#85663b] font-semibold">
                        {ed.count} مقال ومادة
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-[#2d1e12] text-[#f4ebdc] group-hover:bg-[#1a120b] transition flex items-center gap-1 font-bold">
                        <BookOpen className="w-3 h-3 text-[#d4af37]" />
                        <span>تصفح العدد</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
