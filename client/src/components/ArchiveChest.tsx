import { useState, useMemo } from "react";
import { X, Calendar, BookOpen, Layers, Search, Sparkles } from "lucide-react";

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
  const [isLidOpen, setIsLidOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filteredEditions = useMemo(() => {
    if (!searchQuery.trim()) return editions;
    const q = searchQuery.toLowerCase();
    return editions.filter((ed) => {
      const title = ed.lead?.title?.toLowerCase() || "";
      const summary = ed.lead?.summary?.toLowerCase() || "";
      const dateStr = new Date(ed.key).toLocaleDateString("ar-MA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).toLowerCase();
      return title.includes(q) || summary.includes(q) || dateStr.includes(q);
    });
  }, [editions, searchQuery]);

  if (!isOpen) return null;

  const handlePick = (pageIndex: number, key: string) => {
    setSelectedKey(key);
    setTimeout(() => {
      onSelectEdition(pageIndex, key);
      setSelectedKey(null);
    }, 450);
  };

  return (
    <div
      className="jarida-chest-overlay fixed inset-0 z-[250] flex flex-col items-center justify-start overflow-y-auto px-3 py-4 sm:py-6"
      style={{
        background: "radial-gradient(circle at 50% 30%, rgba(38, 26, 14, 0.94), rgba(15, 10, 5, 0.98))",
        backdropFilter: "blur(6px)",
      }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="صندوق الأرشيف الخشبي"
      onClick={onClose}
    >
      <div
        className="jarida-chest-container relative w-full max-w-4xl my-auto flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 left-2 sm:left-0 z-30 w-9 h-9 rounded-full bg-[#3d2716] border border-[#a8824f] text-[#eddcc4] hover:text-white hover:bg-[#52341d] transition flex items-center justify-center cursor-pointer shadow-lg"
          aria-label="إغلاق صندوق الأرشيف"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Vintage Plaque Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#2d1e12]/90 border border-[#b48d56]/60 shadow-md mb-1.5">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span className="font-serif text-[#d4af37] text-sm font-bold tracking-wide">
              خزانة الأرشيف والتاريخ
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-serif text-[#f2e6cf] drop-shadow-sm">
            صندوق خشب المانجو للأعداد القديمة
          </h2>
          <p className="text-xs text-[#c5ad88] max-w-md mx-auto mt-0.5">
            مستودع الأعداد السابقة والتقارير الأرشيفية المحفوظة بعناية في صندوق خشبي أصيل
          </p>
        </div>

        {/* Search & Lid Controls */}
        <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2.5 mb-4 px-2">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="ابحث في أعداد الأرشيف والتاريخ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pr-8 pl-3 py-1.5 rounded-lg bg-[#24170d] border border-[#7a5932] text-[#f7efe1] placeholder-[#9c8263] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a88657]" />
          </div>

          <button
            type="button"
            onClick={() => setIsLidOpen(!isLidOpen)}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#422c19] hover:bg-[#573920] text-[#f2e6cf] border border-[#8a6538] transition font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span className="text-sm">🪵</span>
            <span>{isLidOpen ? "إغلاق غطاء الصندوق" : "فتح غطاء الصندوق"}</span>
          </button>
        </div>

        {/* 3D Mango Wood Chest Stage */}
        <div className="jarida-chest-stage w-full relative perspective-[1200px]">
          {/* Wooden Chest Outer Box */}
          <div className="jarida-chest-bench relative w-full rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden transition-all duration-300">
            {/* Mango Wood Texture Background */}
            <div className="jarida-wood-grain absolute inset-0 pointer-events-none" />

            {/* Iron Corner Metal Straps & Rivets */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#1f1610] rounded-tr-xl z-20 pointer-events-none" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#1f1610] rounded-tl-xl z-20 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#1f1610] rounded-br-xl z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#1f1610] rounded-bl-xl z-20 pointer-events-none" />

            {/* 3D Hinged Lid */}
            <div
              className={`jarida-chest-lid relative w-full rounded-xl p-3 sm:p-4 mb-4 border-2 border-[#543b24] shadow-md transition-all duration-700 origin-top transform-gpu ${
                isLidOpen
                  ? "rotate-x-[-65deg] -translate-y-4 shadow-xl opacity-90 scale-[0.98]"
                  : "rotate-x-0 translate-y-0 opacity-100"
              }`}
              style={{
                transformStyle: "preserve-3d",
              }}
              onClick={() => !isLidOpen && setIsLidOpen(true)}
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#73512f]/40">
                <div className="flex items-center gap-3">
                  {/* Heavy Iron Hinges */}
                  <div className="w-5 h-7 bg-[#1c140e] border border-[#4a3625] rounded-sm shadow-inner flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#523d2b]" />
                  </div>
                  <div className="w-5 h-7 bg-[#1c140e] border border-[#4a3625] rounded-sm shadow-inner flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#523d2b]" />
                  </div>
                  <div className="w-5 h-7 bg-[#1c140e] border border-[#4a3625] rounded-sm shadow-inner flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#523d2b]" />
                  </div>
                </div>

                <div className="text-center">
                  <span className="font-serif font-black text-sm sm:text-base text-[#edd6b1] tracking-wider">
                    جريدة الأفق • خزانة الأعداد المؤرشفة
                  </span>
                </div>

                {/* Brass Clasp / Lock */}
                <div className="w-6 h-8 bg-gradient-to-b from-[#d4af37] to-[#8c6d1f] rounded border border-[#594412] shadow flex items-center justify-center">
                  <span className="w-1.5 h-2.5 bg-[#2b1f0c] rounded-xs" />
                </div>
              </div>

              {!isLidOpen && (
                <div className="py-8 text-center cursor-pointer">
                  <p className="text-sm font-bold text-[#f0e3cc] flex items-center justify-center gap-2">
                    <span>الصندوق مغلق</span>
                    <span className="underline text-[#d4af37]">انقر هنا لرفع الغطاء وتصفح الأرشيف</span>
                  </p>
                </div>
              )}
            </div>

            {/* Interior Chest Storage Compartment */}
            {isLidOpen && (
              <div className="jarida-chest-interior relative z-10 rounded-xl p-3 sm:p-5 border-2 border-[#3d2716] shadow-inner bg-[#21160e]/95">
                {/* Vintage newspaper stacks inside */}
                <div className="flex items-center justify-between mb-3 px-1 text-xs text-[#c9b491] border-b border-[#4d3622] pb-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Layers className="w-4 h-4 text-[#d4af37]" />
                    <span>الأعداد المحفوظة في الصندوق ({filteredEditions.length})</span>
                  </span>
                  <span className="text-[11px] text-[#9e8564]">
                    انقر على أي عدد لسحبه وقراءته فوراً
                  </span>
                </div>

                {filteredEditions.length === 0 ? (
                  <div className="text-center py-12 text-[#9e8564]">
                    <p className="text-sm">لم يتم العثور على أعداد تطابق بحثك داخل الصندوق.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-h-[55vh] overflow-y-auto pl-1 pr-1 custom-chest-scrollbar">
                    {filteredEditions.map((ed, idx) => {
                      const isPicked = selectedKey === ed.key;
                      const dateObj = new Date(ed.key);
                      const arabicDate = dateObj.toLocaleDateString("ar-MA", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                      });

                      return (
                        <button
                          key={ed.key}
                          type="button"
                          onClick={() => handlePick(ed.pageIndex, ed.key)}
                          className={`jarida-archive-card group relative text-right p-3 rounded-lg border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${
                            isPicked
                              ? "bg-[#faf0d9] text-black ring-4 ring-[#d4af37] -translate-y-3 scale-105 shadow-2xl z-30"
                              : "bg-[#f8f4e8] text-[#241a10] border-[#c2aa7f] hover:-translate-y-2 hover:shadow-xl hover:border-[#8c6d32]"
                          }`}
                          style={{
                            transformStyle: "preserve-3d",
                            boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
                          }}
                        >
                          {/* Vintage Aged Paper Texture & Header */}
                          <div>
                            <div className="flex items-center justify-between border-b border-[#d8c49e] pb-1.5 mb-2">
                              <span className="font-serif font-black text-xs text-[#2c1d0f] tracking-wide">
                                الأفق
                              </span>
                              <span className="text-[10px] font-sans font-bold text-[#70522a] flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {arabicDate}
                              </span>
                            </div>

                            {/* Headline */}
                            <h4 className="font-serif font-bold text-xs sm:text-[13px] line-clamp-2 leading-snug mb-1.5 text-[#1a120a] group-hover:text-[#6e4614] transition">
                              {ed.lead?.title || "عدد أرشيفي شامل"}
                            </h4>

                            {/* Optional thumbnail image preview */}
                            {ed.lead?.imageUrl && (
                              <div className="w-full h-20 mb-2 rounded overflow-hidden border border-[#d8c49e] bg-[#ede1c7]">
                                <img
                                  src={ed.lead.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover filter contrast-[1.05] grayscale-[30%] group-hover:scale-105 transition duration-300"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {/* Summary snippet */}
                            {ed.lead?.summary && (
                              <p className="text-[11px] text-[#52412d] line-clamp-2 leading-relaxed">
                                {ed.lead.summary}
                              </p>
                            )}
                          </div>

                          {/* Footer Tag & Open Action */}
                          <div className="mt-3 pt-2 border-t border-[#e2d2b1] flex items-center justify-between text-[10px] font-sans">
                            <span className="text-[#85663b] font-medium">
                              {ed.count} مقال
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#4a341e] text-[#f4ebdc] group-hover:bg-[#281b0e] transition flex items-center gap-1 font-bold">
                              <BookOpen className="w-2.5 h-2.5" />
                              <span>تصفح</span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
