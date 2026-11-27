import { useState, useEffect } from "react";
import { Bookmark, X, Trash2, ExternalLink, BookOpen, Search, Share2, Check } from "lucide-react";

export interface BookmarkedArticle {
  id: string | number;
  title: string;
  summary: string;
  source?: string;
  category?: string;
  imageUrl?: string;
  savedAt: string;
}

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (id: string | number) => void;
}

const STORAGE_KEY = "jarida_saved_bookmarks_v1";

export function getSavedBookmarks(): BookmarkedArticle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBookmarkItem(article: any): boolean {
  if (typeof window === "undefined" || !article) return false;
  try {
    const list = getSavedBookmarks();
    const id = String(article.id || article.title);
    const existingIndex = list.findIndex((a) => String(a.id) === id);
    if (existingIndex !== -1) {
      // Remove if already bookmarked
      list.splice(existingIndex, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return false; // not saved now
    } else {
      const newItem: BookmarkedArticle = {
        id: article.id || `saved-${Date.now()}`,
        title: article.title || "مقال بدون عنوان",
        summary: article.summary || article.content?.slice(0, 160) || "",
        source: article.source || "جريدة الأفق",
        category: article.category || "أخبار",
        imageUrl: article.imageUrl,
        savedAt: new Date().toISOString(),
      };
      list.unshift(newItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
      return true; // saved
    }
  } catch {
    return false;
  }
}

export function isArticleBookmarked(articleId: string | number): boolean {
  if (typeof window === "undefined") return false;
  const list = getSavedBookmarks();
  return list.some((a) => String(a.id) === String(articleId));
}

export default function BookmarksModal({
  isOpen,
  onClose,
  onSelectArticle,
}: BookmarksModalProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBookmarks(getSavedBookmarks());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemove = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarks.filter((b) => String(b.id) !== String(id));
    setBookmarks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleClearAll = () => {
    if (window.confirm("هل ترغب حقاً في مسح جميع المقالات المحفوظة؟")) {
      setBookmarks([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  };

  const filtered = bookmarks.filter((b) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.summary.toLowerCase().includes(q) ||
      (b.category && b.category.toLowerCase().includes(q))
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-[#faf5eb] text-[#2c2416] w-full max-w-2xl rounded-2xl shadow-2xl border-2 border-[#bfa87a] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#42341d] text-[#f4ebdc] px-4 py-3 flex items-center justify-between border-b border-[#bfa87a]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#dfcca9] fill-[#dfcca9]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base font-serif">مكتبتي للقراءة بدون إنترنت</h3>
              <p className="text-[11px] text-[#cfbd97]">المقالات المحفوظة في ذاكرة هاتفك للقراءة في أي وقت</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Clear */}
        <div className="p-3 bg-[#f0e4cf] border-b border-[#dfcca9] flex items-center justify-between gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="ابحث في مقالاتك المحفوظة..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-xs pr-8 pl-3 py-1.5 rounded-lg border border-[#c9b78e] bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#8c7348]"
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c7457]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6e583d] font-bold">
              {bookmarks.length} مقال محفوظ
            </span>
            {bookmarks.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-red-700 hover:text-red-900 flex items-center gap-1 font-bold px-2 py-1 rounded hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                مسح الكل
              </button>
            )}
          </div>
        </div>

        {/* List of Saved Articles */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 font-sans">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#8a795d]">
              <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#8c7348]" />
              <h4 className="font-bold text-sm mb-1">لا توجد مقالات محفوظة بعد</h4>
              <p className="text-xs max-w-sm mx-auto text-[#9e8c6e] leading-relaxed">
                اضغط على أيقونة الإشارة المرجعية (🔖) في أسفل أي خبر أو مقال لقراءته لاحقاً بدون إنترنت.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectArticle(item.id);
                  onClose();
                }}
                className="bg-white p-3 rounded-xl border border-[#dfcca9] hover:border-[#8c7348] hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-[#e2d5b3]"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f2e5cc] text-[#6b5233]">
                        {item.category || "أخبار"}
                      </span>
                      <span className="text-[10px] text-[#8c7857]">
                        {new Date(item.savedAt).toLocaleDateString("ar-MA")}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#2b2013] group-hover:text-[#8c2a1e] transition line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#66553d] line-clamp-1 mt-0.5">
                      {item.summary}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArticle(item.id);
                      onClose();
                    }}
                    className="p-1.5 rounded-lg bg-[#efe2c8] text-[#42341d] hover:bg-[#8c7348] hover:text-white transition cursor-pointer"
                    title="قراءة في الجريدة"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(item.id, e)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white transition cursor-pointer"
                    title="حذف من المحفوظات"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Note */}
        <div className="p-2.5 bg-[#e8dac1] border-t border-[#dfcca9] text-center text-[10.5px] text-[#6b5437]">
          ✨ جميع المقالات تحفظ مباشرة في ذاكرة المتصفح والتطبيق للوصول إليها بدون إنترنت
        </div>
      </div>
    </div>
  );
}
