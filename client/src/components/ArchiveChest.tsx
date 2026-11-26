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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filteredEditions = useMemo(() => {
    if (!searchQuery.trim()) return editions;
    const q = searchQuery.toLowerCase();
    return editions.filter((ed) => {
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
  }, [editions, searchQuery]);

  const editionsByMonth = useMemo(() => {
    const months = new Map<string, ArchivedEditionItem[]>();
    [...filteredEditions]
      .sort((a, b) => b.key.localeCompare(a.key))
      .forEach((edition) => {
        const monthKey = edition.key.slice(0, 7);
        const monthEditions = months.get(monthKey);
        if (monthEditions) monthEditions.push(edition);
        else months.set(monthKey, [edition]);
      });
    return Array.from(months.entries());
  }, [filteredEditions]);

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

        {/* Toolbar: Search & Count */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-5 px-1">
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
              إجمالي الأعداد المؤرشفة: <strong>{filteredEditions.length}</strong>
            </span>
          </div>
        </div>

        {/* Editions Grid */}
        <div className="w-full max-h-[58vh] overflow-y-auto pl-1 pr-1 custom-chest-scrollbar">
          {filteredEditions.length === 0 ? (
            <div className="text-center py-16 text-[#9e8564]">
              <p className="text-sm">لم يتم العثور على أعداد تطابق عبارة البحث.</p>
            </div>
          ) : (
            editionsByMonth.map(([monthKey, monthEditions]) => {
              const monthDate = new Date(`${monthKey}-01T12:00:00.000Z`);
              const monthLabel = monthDate.toLocaleDateString("ar-MA", {
                month: "long",
                year: "numeric",
                timeZone: "Africa/Casablanca",
              });

              return (
                <section key={monthKey} className="mb-5 last:mb-0" aria-label={`أعداد شهر ${monthLabel}`}>
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#80603b] bg-[#2d1e12] px-3 py-2.5">
                    <h3 className="font-serif text-sm font-black text-[#f5ebd7]">{monthLabel}</h3>
                    <span className="text-[11px] text-[#d8c2a3]">{monthEditions.length} عدد يومي</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                    {monthEditions.map((ed) => {
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
                          className={`jarida-archive-card group relative flex flex-col justify-between overflow-hidden rounded-xl border p-3.5 text-right transition-all duration-300 ${
                            isPicked
                              ? "z-30 -translate-y-2 scale-102 bg-[#faf0d9] text-black shadow-2xl ring-4 ring-[#d4af37]"
                              : "cursor-pointer border-[#d8c7a8] bg-[#f8f5ed] text-[#241a10] hover:-translate-y-1.5 hover:border-[#b48d56] hover:shadow-xl"
                          }`}
                        >
                          <div>
                            <div className="mb-2 flex items-center justify-between border-b border-[#dfd0b6] pb-2">
                              <span className="font-serif text-xs font-black tracking-wide text-[#2c1d0f]">
                                جريدة الأفق
                              </span>
                              <span className="flex items-center gap-1 font-sans text-[10.5px] font-bold text-[#70522a]">
                                <Calendar className="h-3 w-3 text-[#947743]" />
                                {arabicDate}
                              </span>
                            </div>

                            <h4 className="mb-2 line-clamp-2 font-serif text-xs font-bold leading-snug text-[#1a120a] transition group-hover:text-[#825419] sm:text-[13px]">
                              {ed.lead?.title || "عدد أرشيفي شامل"}
                            </h4>

                            {ed.lead?.imageUrl && (
                              <div className="mb-2 h-24 w-full overflow-hidden rounded-lg border border-[#dfd0b6] bg-[#ede1c7]">
                                <img
                                  src={ed.lead.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover contrast-[1.04] transition duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {ed.lead?.summary && (
                              <p className="line-clamp-2 text-[11px] leading-relaxed text-[#52412d]">
                                {ed.lead.summary}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-[#e2d5bd] pt-2 font-sans text-[10.5px]">
                            <span className="font-semibold text-[#85663b]">{ed.count} مقال ومادة</span>
                            <span className="flex items-center gap-1 rounded-md bg-[#2d1e12] px-2.5 py-1 font-bold text-[#f4ebdc] transition group-hover:bg-[#1a120b]">
                              <BookOpen className="h-3 w-3 text-[#d4af37]" />
                              <span>تصفح العدد</span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
