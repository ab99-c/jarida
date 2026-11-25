import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { formatArabicEditionDate } from "@shared/date";
import { Volume2, VolumeX, RefreshCw, ChevronLeft, ChevronRight, Share2, MessageSquare, Send, Check, FileText, BookOpen, CornerUpRight, CornerDownLeft } from "lucide-react";
import {
  getBottomLeftPeelProgress,
  getBoundedPageChange,
  getSwipeStep,
  PAGE_TURN_DURATION_MS,
  PAGE_TURN_MIDPOINT_MS,
} from "./pageTurnTiming";
import {
  convertPageIndexBetweenModes,
  detectDeviceKind,
  getDefaultViewMode,
  type JaridaDeviceKind,
  type JaridaViewMode,
} from "./deviceMode";

const VIEW_MODE_STORAGE_KEY = "jarida-view-mode";

function ArticleComments({ article }: { article: any }) {
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const articleId = article.id || 1;
  const isPersistedArticle = typeof articleId === "number";
  const { data: comments = [], isLoading: isLoadingComments, isError: isErrorComments, refetch } = trpc.jarida.getComments.useQuery(
    { articleId: isPersistedArticle ? articleId : 0 },
    { enabled: isPersistedArticle },
  );
  
  const addCommentMutation = trpc.jarida.addComment.useMutation({
    onSuccess: () => {
      setAuthorName("");
      setContent("");
      setErrorMsg("");
      refetch();
    },
    onError: (err) => {
      setErrorMsg(err.message || "فشل إرسال التعليق، يرجى المحاولة لاحقاً.");
    }
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;
    setErrorMsg("");
    if (!isPersistedArticle) {
      setErrorMsg("التعليقات غادي تتفعل منين يتسجل المقال في قاعدة البيانات.");
      return;
    }
    addCommentMutation.mutate({
      articleId,
      authorName: authorName.trim(),
      content: content.trim(),
    });
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/#article-${articleId}` : "";
  const shareTitle = article.title || "جريدة الأفق";

  const handleShare = (platform: string) => {
    const text = `اقرأ هذا المقال: "${shareTitle}" في جريدة الأفق`;
    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + shareUrl)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        setErrorMsg("تعذر نسخ الرابط تلقائياً.");
      });
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#d3c49b]/60 text-right font-sans">
      {/* Social Share Buttons */}
      <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
        <span className="text-[#665533] font-bold flex items-center gap-1">
          <Share2 className="w-3.5 h-3.5" /> مشاركة:
        </span>
        <button
          type="button"
          onClick={() => handleShare("whatsapp")}
          className="px-2.5 py-1.5 bg-[#25D366] text-white rounded hover:opacity-90 transition font-medium cursor-pointer"
        >
          واتساب
        </button>
        <button
          type="button"
          onClick={() => handleShare("facebook")}
          className="px-2.5 py-1.5 bg-[#1877F2] text-white rounded hover:opacity-90 transition font-medium cursor-pointer"
        >
          فيسبوك
        </button>
        <button
          type="button"
          onClick={() => handleShare("twitter")}
          className="px-2.5 py-1.5 bg-black text-white rounded hover:opacity-90 transition font-medium cursor-pointer"
        >
          X (تويتر)
        </button>
        <button
          type="button"
          onClick={() => handleShare("copy")}
          className="px-2.5 py-1.5 bg-[#e0ceb1] text-black rounded hover:bg-[#d3c49b] transition font-medium flex items-center gap-1 cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-green-700" /> : null}
          <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="bg-[#f0e3cc]/50 p-3 rounded-lg border border-[#d3c49b]">
        <h4 className="text-xs font-bold text-[#554a32] mb-2 flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" /> تعليقات القراء ({comments.length})
        </h4>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="space-y-2 mb-3">
          <input
            type="text"
            placeholder="اسمك الكريم..."
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded border border-[#c9b78e] bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#8c7348]"
            required
            disabled={!isPersistedArticle}
          />
          <textarea
            placeholder="اكتب تعليقك هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            disabled={!isPersistedArticle}
            className="w-full text-xs px-2.5 py-1.5 rounded border border-[#c9b78e] bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#8c7348] resize-none"
            required
          />
          {errorMsg && (
            <p className="text-[11px] text-red-600 bg-red-50 p-1 rounded border border-red-200">{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={addCommentMutation.isPending}
            className="w-full bg-[#59482b] hover:bg-[#42341d] text-white text-xs py-1.5 rounded transition font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>{addCommentMutation.isPending ? "جاري الإرسال..." : "نشر التعليق"}</span>
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {isLoadingComments ? (
            <p className="text-[11px] text-[#776644] text-center italic py-1">جاري تحميل التعليقات...</p>
          ) : isErrorComments ? (
            <p className="text-[11px] text-red-600 text-center py-1">تعذر تحميل التعليقات.</p>
          ) : comments.length === 0 ? (
            <p className="text-[11px] text-[#776644] text-center italic py-1">لا توجد تعليقات بعد. كن أول المعلقين!</p>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="bg-white/80 p-2 rounded border border-[#e2d5b3] text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-black">{comment.authorName}</span>
                  <span className="text-[10px] text-[#887755]">
                    {new Date(comment.createdAt).toLocaleDateString("ar-MA")}
                  </span>
                </div>
                <p className="text-[#333] leading-normal">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TurningPagePreview({
  items,
  pageIndex = 0,
  articlesPerView = 1,
  totalArticles = 1,
  isSinglePage = false,
}: {
  items: any[];
  pageIndex?: number;
  articlesPerView?: number;
  totalArticles?: number;
  isSinglePage?: boolean;
}) {
  return (
    <div
      className={`jarida-turning-preview w-full h-full ${
        isSinglePage
          ? "grid grid-cols-1 gap-0"
          : "grid grid-cols-2 gap-0 lg:gap-12 divide-x divide-x-reverse divide-[#d3c49b]"
      } items-start`}
      dir="rtl"
    >
      {items.length === 0 ? (
        <div className="col-span-full flex items-center justify-center text-center text-[#6f5a38] p-8">
          <span className="text-sm opacity-70">العدد اليومي</span>
        </div>
      ) : (
        items.map((article: any, index: number) => (
          <div
            key={article.id || index}
            className="jarida-paper-page flex flex-col justify-between h-full px-2 md:px-6"
          >
            <div>
              <div className="flex justify-between items-center text-[11px] text-[#775f3a] mb-2 font-sans font-bold gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="bg-[#ebd9bc] px-2.5 py-0.5 rounded text-black border border-[#d3c49b]">
                    {article.source || "وكالة الأنباء"}
                  </span>
                  {article.category && (
                    <span className="text-[11px] text-[#6c624a] font-semibold">
                      • {article.category}
                    </span>
                  )}
                </div>
                <span>{new Date(article.publishedAt || Date.now()).toLocaleDateString("ar-MA")}</span>
              </div>
              <h3 className="jarida-article-headline text-xl md:text-2xl font-bold text-black mb-3 leading-snug">
                {article.title}
              </h3>
              {article.imageUrl && (
                <div className="my-3 overflow-hidden rounded border border-[#d3c49b] bg-[#f0e3cc] shadow-sm">
                  <img
                    src={article.imageUrl}
                    alt=""
                    aria-hidden="true"
                    className="jarida-article-image w-full h-44 md:h-52 object-cover filter grayscale contrast-125"
                  />
                </div>
              )}
              <p className="jarida-article-summary text-sm md:text-base text-[#2c2c2c] leading-relaxed text-justify mb-3 font-serif">
                {article.summary}
              </p>
              {article.content && article.content.trim() !== article.summary?.trim() && (
                <p className="jarida-article-body text-xs md:text-sm text-[#4a4a4a] leading-relaxed text-justify font-serif border-t border-[#e2d5b3] pt-2 mb-4">
                  {article.content}
                </p>
              )}
            </div>
            <div className="mt-6 pt-2 border-t border-[#e2d5b3] flex justify-between items-center text-xs text-[#776644] font-sans">
              <span>جريدة الأفق الإلكترونية</span>
              <span>
                صفحة {pageIndex * articlesPerView + index + 1} من {Math.max(1, totalArticles)}
              </span>
            </div>
          </div>
        ))
      )}
      {!isSinglePage && items.length === 1 && (
        <div
          aria-hidden="true"
          className="jarida-empty-page flex flex-col justify-center items-center h-full min-h-[18rem] text-center p-8 text-[#998866] italic"
        >
          <p className="text-base">تابعوا المزيد من المستجدات والتقارير في الإصدارات القادمة.</p>
        </div>
      )}
    </div>
  );
}

function readInitialDeviceState(): { deviceKind: JaridaDeviceKind; viewMode: JaridaViewMode } {
  if (typeof window === "undefined") {
    return { deviceKind: "desktop", viewMode: "spread" };
  }
  const env = {
    userAgent: navigator.userAgent || "",
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    search: window.location.search,
  };
  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  } catch {
    saved = null;
  }
  return {
    deviceKind: detectDeviceKind(env),
    viewMode: getDefaultViewMode(env, saved),
  };
}

export default function Home() {
  const initialState = readInitialDeviceState();
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  const [deviceKind, setDeviceKind] = useState<JaridaDeviceKind>(initialState.deviceKind);
  const [viewMode, setViewMode] = useState<JaridaViewMode>(initialState.viewMode);
  const [hasManualViewChoice, setHasManualViewChoice] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return saved === "single" || saved === "spread";
    } catch {
      return false;
    }
  });
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTurning, setIsTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");
  const [turningFromItems, setTurningFromItems] = useState<any[]>([]);
  const [turningToItems, setTurningToItems] = useState<any[]>([]);
  const [turningFromPage, setTurningFromPage] = useState(0);
  const [turningToPage, setTurningToPage] = useState(0);
  const [peelDrag, setPeelDrag] = useState<{
    direction: "next" | "prev";
    progress: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const spreadRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartedInteractive = useRef(false);
  const activePageScrollRef = useRef<HTMLDivElement | null>(null);

  const {
    data: dailyData,
    refetch,
    isLoading: isDailyLoading,
    isError: isDailyError,
  } = trpc.jarida.getDailyEdition.useQuery();
  const refreshMutation = trpc.jarida.refreshFeed.useMutation({
    onSuccess: () => refetch(),
  });
  const articles = dailyData?.articles;
  const editionDate = dailyData?.date ?? new Date();

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobile(nextIsMobile);
      const env = {
        userAgent: navigator.userAgent || "",
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        search: window.location.search,
      };
      const detected = detectDeviceKind(env);
      setDeviceKind(detected);
      if (!hasManualViewChoice) {
        const nextMode = getDefaultViewMode(env, null);
        setViewMode((prev) => {
          if (prev !== nextMode) {
            setCurrentPage((page) =>
              convertPageIndexBetweenModes(page, prev, nextMode, Array.isArray(articles) ? articles.length : 0),
            );
          }
          return nextMode;
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasManualViewChoice, articles]);

  const playFlipSound = useCallback(() => {
    if (isMuted) return;
    try {
      const audio = new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch (e) {}
  }, [isMuted]);

  // لا نعرضش أخباراً تجريبية أو قديمة عندما تكون الـAPI فارغة؛ الجريدة خاصها تبين حالة التحديث بوضوح.
  const processedArticles = Array.isArray(articles) ? articles : [];

  const isSinglePage = viewMode === "single";
  const isAndroidTV = deviceKind === "android-tv";
  const isAndroid = deviceKind === "android-phone" || deviceKind === "android-tv";

  const ARTICLES_PER_SPREAD = 2;
  const articlesPerView = isSinglePage ? 1 : ARTICLES_PER_SPREAD;
  const totalPages = Math.ceil(processedArticles.length / articlesPerView);

  // Keep page index safely clamped whenever totalPages changes
  useEffect(() => {
    if (totalPages > 0 && currentPage >= totalPages) {
      setCurrentPage(totalPages - 1);
    }
  }, [totalPages, currentPage]);

  // Reset single-page scroll to the top whenever the active page changes
  useEffect(() => {
    if (activePageScrollRef.current) {
      activePageScrollRef.current.scrollTop = 0;
    }
  }, [currentPage, isSinglePage]);

  const requestPageChange = useCallback((step: number) => {
    if (isTurning || totalPages <= 1) return;
    const turn = getBoundedPageChange(currentPage, totalPages, step);
    if (!turn) return;
    const nextPageIndex = turn.toPage;

    const fromItems = processedArticles.slice(currentPage * articlesPerView, (currentPage + 1) * articlesPerView);
    const toItems = processedArticles.slice(nextPageIndex * articlesPerView, (nextPageIndex + 1) * articlesPerView);
    setTurningFromItems(fromItems);
    setTurningToItems(toItems);
    setTurningFromPage(currentPage);
    setTurningToPage(nextPageIndex);
    setTurnDirection(step > 0 ? "next" : "prev");
    setPeelDrag(null);
    setIsTurning(true);
    playFlipSound();
    // تبديل المقالات عند محور الوسط، ثم نترك الورقة تكمل حركتها من تحت اليسار لليمين (أو إرجاعها) قبل إزالة الطبقة.
    window.setTimeout(() => {
      setCurrentPage(nextPageIndex);
    }, PAGE_TURN_MIDPOINT_MS);
    window.setTimeout(() => {
      setIsTurning(false);
    }, PAGE_TURN_DURATION_MS);
  }, [isTurning, totalPages, currentPage, processedArticles, articlesPerView, playFlipSound]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      requestPageChange(currentPage < totalPages - 1 ? 1 : -currentPage);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalPages, isMuted, currentPage, isTurning, requestPageChange]);

  const nextPage = useCallback(() => requestPageChange(1), [requestPageChange]);
  const prevPage = useCallback(() => requestPageChange(-1), [requestPageChange]);

  const toggleViewMode = useCallback(() => {
    const nextMode: JaridaViewMode = isSinglePage ? "spread" : "single";
    setCurrentPage((prevPageIdx) =>
      convertPageIndexBetweenModes(prevPageIdx, viewMode, nextMode, processedArticles.length),
    );
    setViewMode(nextMode);
    setHasManualViewChoice(true);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextMode);
    } catch {
      // ignore storage errors
    }
  }, [isSinglePage, viewMode, processedArticles.length]);

  // Android TV remote (D-pad) & keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "PageDown" ||
        event.key === "ChannelUp" ||
        event.key === "MediaTrackNext"
      ) {
        event.preventDefault();
        nextPage();
      } else if (
        event.key === "ArrowRight" ||
        event.key === "PageUp" ||
        event.key === "ChannelDown" ||
        event.key === "MediaTrackPrevious"
      ) {
        event.preventDefault();
        prevPage();
      } else if (event.key === "ArrowDown" && activePageScrollRef.current) {
        event.preventDefault();
        activePageScrollRef.current.scrollBy({ top: 180, behavior: "smooth" });
      } else if (event.key === "ArrowUp" && activePageScrollRef.current) {
        event.preventDefault();
        activePageScrollRef.current.scrollBy({ top: -180, behavior: "smooth" });
      } else if (event.key === "MediaPlayPause") {
        event.preventDefault();
        setIsAutoPlaying((prev) => !prev);
      } else if (event.key === "m" || event.key === "M") {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    touchStartedInteractive.current = Boolean(
      target?.closest("button, a, input, textarea, select, label"),
    );
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    const wasInteractive = touchStartedInteractive.current;
    touchStartX.current = null;
    touchStartY.current = null;
    touchStartedInteractive.current = false;

    if (wasInteractive || startX === null || startY === null) return;

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const endY = event.changedTouches[0]?.clientY ?? startY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const bounds = event.currentTarget.getBoundingClientRect();
    const startedInBottomLeftZone =
      startX - bounds.left < bounds.width * 0.42 &&
      startY - bounds.top > bounds.height * 0.55;
    const startedInTopRightZone =
      startX - bounds.left > bounds.width * 0.58 &&
      startY - bounds.top < bounds.height * 0.45;

    // إذا بدأ السحب من تحت جهة اليسار وطلع الفوق/اليمين، نرفع الورقة للتالي باش تبان الورقة الأخرى
    if (startedInBottomLeftZone && (deltaX > 24 || deltaY < -28)) {
      requestPageChange(1);
      return;
    }

    // إذا بدأ السحب من الفوق جهة اليمين ونزل لتحت جهة اليسار، نرجع الورقة السابقة
    if (startedInTopRightZone && (deltaX < -24 || deltaY > 28)) {
      requestPageChange(-1);
      return;
    }

    // Respect vertical scrolling on Android phones & tablets without accidentally flipping pages
    if (Math.abs(deltaY) > 18 && Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    const swipeStep = getSwipeStep(deltaX);
    if (swipeStep !== 0) {
      requestPageChange(swipeStep);
      return;
    }

    // In single-page mode, avoid accidental taps while reading/selecting text
    if (isSinglePage) return;

    requestPageChange(endX - bounds.left > bounds.width / 2 ? 1 : -1);
  };

  const startCornerPeelDrag = (
    direction: "next" | "prev",
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (isTurning || totalPages <= 1) return;
    const step = direction === "next" ? 1 : -1;
    const turn = getBoundedPageChange(currentPage, totalPages, step);
    if (!turn) return;

    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore pointer capture issues
    }

    const fromItems = processedArticles.slice(
      currentPage * articlesPerView,
      (currentPage + 1) * articlesPerView,
    );
    const toItems = processedArticles.slice(
      turn.toPage * articlesPerView,
      (turn.toPage + 1) * articlesPerView,
    );
    setTurningFromItems(fromItems);
    setTurningToItems(toItems);
    setTurningFromPage(currentPage);
    setTurningToPage(turn.toPage);
    setTurnDirection(direction);
    setPeelDrag({
      direction,
      progress: 0.08,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    });
  };

  const moveCornerPeelDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!peelDrag) return;
    event.stopPropagation();
    const bounds = spreadRef.current?.getBoundingClientRect();
    const width = bounds?.width ?? 640;
    const height = bounds?.height ?? 520;
    const dist = Math.hypot(event.clientX - peelDrag.startX, event.clientY - peelDrag.startY);
    const nextProgress = getBottomLeftPeelProgress(
      peelDrag.startX,
      peelDrag.startY,
      event.clientX,
      event.clientY,
      width,
      height,
      peelDrag.direction,
    );
    setPeelDrag((prev) =>
      prev
        ? {
            ...prev,
            progress: Math.max(0.08, nextProgress),
            moved: prev.moved || dist > 10,
          }
        : null,
    );
  };

  const endCornerPeelDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!peelDrag) return;
    event.stopPropagation();
    const { direction, progress, moved } = peelDrag;
    setPeelDrag(null);
    // إذا نقر المستخدم على الزاوية أو سحب الورقة بما يكفي، نكمل رفع الورقة أو إرجاعها
    if (!moved || progress >= 0.14) {
      requestPageChange(direction === "next" ? 1 : -1);
    }
  };

  const currentItems = processedArticles.slice(
    currentPage * articlesPerView,
    (currentPage + 1) * articlesPerView
  );
  const isInteractivePeeling = Boolean(peelDrag);
  const isSheetActive = isTurning || isInteractivePeeling;
  const activeDirection = peelDrag ? peelDrag.direction : turnDirection;
  const hasReachedContentSwap = isTurning && currentPage !== turningFromPage;

  // عندما ترفع الورقة من تحت جهة اليسار إلى اليمين (next)، تظهر الورقة الأخرى (turningToItems) مباشرة تحتها!
  // وعندما يرجع المستخدم الورقة السابقة (prev)، تبقى الورقة الحالية تحتها ريثما تنزل الورقة السابقة من اليمين لتحت اليسار وتغطيها.
  const frontItems = isSheetActive
    ? activeDirection === "next"
      ? turningToItems
      : hasReachedContentSwap
        ? currentItems
        : turningFromItems
    : currentItems;

  const displayPageIndex = isSheetActive
    ? activeDirection === "next"
      ? turningToPage
      : hasReachedContentSwap
        ? currentPage
        : turningFromPage
    : currentPage;

  // كل spread فيه جوج صفحات حقيقيين: الورقة المرفوعة كتهز الصفحة كاملة من تحت اليسار لجهة اليمين، وفالـprev كترجع بالعكس.
  const turningSheetFromItems =
    activeDirection === "next" ? turningFromItems : turningToItems;
  const turningSheetToItems =
    activeDirection === "next" ? turningToItems : turningFromItems;
  const turningSheetPageIndex =
    activeDirection === "next" ? turningFromPage : turningToPage;

  const progressPercent = totalPages > 0 ? Math.round(((displayPageIndex + 1) / totalPages) * 100) : 0;

  return (
    <div
      data-jarida-release="jarida-immersive-83ae373f"
      data-jarida-skin="reference-book-20261007"
      data-jarida-spread-mode="paired-articles"
      data-jarida-view-mode={viewMode}
      data-jarida-device={deviceKind}
      className={`fb-wrapper min-h-screen text-[#2b2b2b] select-none relative overflow-x-hidden ${isSinglePage ? "jarida-single-page-mode" : ""} ${isAndroidTV ? "jarida-tv-mode" : ""}`}
      dir="rtl"
    >
      {/* Top minimal header controls */}
      <div className="jarida-topbar z-20 flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-[#f5e6cc]/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md border border-[#d3c49b]">
        <button
          type="button"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="jarida-focusable flex items-center gap-1.5 text-xs text-[#554a32] hover:text-black transition cursor-pointer px-1.5 py-0.5 rounded"
          title="تحديث الأخبار الآن"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          <span>تحديث</span>
        </button>
        <span className="text-xs text-[#a39371]">|</span>
        <button
          type="button"
          onClick={toggleViewMode}
          className={`jarida-focusable flex items-center gap-1.5 text-xs px-2 py-0.5 rounded transition cursor-pointer ${isSinglePage ? "bg-[#233c30] text-[#dcb45b] font-bold" : "text-[#554a32] hover:text-black"}`}
          title={isSinglePage ? "التبديل إلى عرض صفحتين" : "التبديل إلى عرض صفحة واحدة"}
        >
          {isSinglePage ? <FileText className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
          <span>{isSinglePage ? "صفحة واحدة" : "صفحتان"}</span>
        </button>
        <span className="text-xs text-[#a39371]">|</span>
        <button
          type="button"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`jarida-focusable flex items-center gap-1 text-xs px-2 py-0.5 rounded transition cursor-pointer ${isAutoPlaying ? "bg-[#d3c49b]/60 text-black font-bold" : "text-[#554a32] hover:text-black"}`}
          title={isAutoPlaying ? "إيقاف التقليب التلقائي" : "تشغيل التقليب التلقائي"}
        >
          <span>{isAutoPlaying ? "تقليب تلقائي: مفعل" : "تقليب تلقائي: متوقف"}</span>
        </button>
        <span className="text-xs text-[#a39371]">|</span>
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="jarida-focusable flex items-center gap-1 text-xs text-[#554a32] hover:text-black transition cursor-pointer p-1 rounded"
          title={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
          aria-label={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Newspaper Spread Container (Vintage Book Layout / Android Single-Page Mode) */}
      <div className="fb-book relative text-[#1a1a1a] my-auto flex flex-col justify-between">
        {!isSinglePage && <div className="fb-spine" aria-hidden="true" />}
        {!isSinglePage && <div className="fb-ribbon" aria-hidden="true" />}
        
        {/* Masthead */}
        <div className="np-mast text-center border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-center text-xs text-[#555] mb-1 px-2 font-sans font-semibold">
            <span>{formatArabicEditionDate(editionDate)}</span>
            <span>الإصدار اليومي الشامل</span>
            <span>{isSinglePage ? `صفحة ${displayPageIndex + 1} / ${Math.max(1, totalPages)}` : `العدد ${displayPageIndex + 1}`}</span>
          </div>
          <h1 className="np-title text-4xl md:text-6xl font-black tracking-tight text-black font-serif">
            جريدة الأفق
          </h1>
          <p className="np-subtitle text-xs tracking-widest text-[#555] uppercase mt-1 font-sans">
            صوت الحقيقة والخبر اليقين • يومية مستقلة
          </p>
        </div>

        {/* Content Spread: single clean page on Android / TV / mobile, double-page newspaper on desktop */}
        <div
          ref={spreadRef}
          className={`jarida-spread relative ${isSinglePage ? "grid grid-cols-1 gap-0" : "grid grid-cols-2 gap-0 lg:gap-12 divide-x divide-x-reverse divide-[#d3c49b]"} flex-grow items-start`}
          dir="rtl"
          onClick={(event) => {
            if (isSinglePage) return;
            const target = event.target as HTMLElement;
            if (target.closest("button, a, input, textarea")) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            // النقر على جهة اليسار يرفع الورقة من تحت اليسار نحو اليمين (التالي)، والنقر على جهة اليمين يرجع الورقة السابقة
            requestPageChange(event.clientX - bounds.left < bounds.width / 2 ? 1 : -1);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="jarida-static-spread">
            <div className={`jarida-static-spread-content relative ${isSinglePage ? "grid grid-cols-1 gap-0" : "grid grid-cols-2 gap-0 lg:gap-12 divide-x divide-x-reverse divide-[#d3c49b]"} items-start`}>
          
          {/* Center Book Spine Shadow (Desktop spread only) */}
          {!isSinglePage && (
            <div className="hidden lg:block absolute top-0 bottom-0 right-1/2 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none -mr-4 z-10" />
          )}

          {frontItems.length === 0 && (
            <div className="col-span-full min-h-[46vh] flex flex-col items-center justify-center text-center px-8 py-12 text-[#665533]">
              <div className="border-y-2 border-[#b9a77a] py-7 max-w-xl">
                <p className="text-xs tracking-[0.28em] font-sans font-bold text-[#8b7650] mb-3">الطبعة اليومية</p>
                <h2 className="text-3xl md:text-5xl font-black text-[#211b12] mb-4">{isDailyLoading ? "جاري إعداد العدد..." : "العدد في طور التحديث"}</h2>
                <p className="text-sm md:text-base leading-relaxed font-serif">
                  {isDailyError
                    ? "تعذر الوصول إلى خدمة الأخبار حالياً. عاود المحاولة بعد لحظات؛ لن نعرض محتوى قديماً على أنه عدد جديد."
                    : "سيظهر هنا محتوى الأخبار فور اكتمال المزامنة اليومية."}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="jarida-focusable mt-5 border border-[#77613b] px-5 py-2 text-xs font-sans font-bold hover:bg-[#e6d4ae] transition cursor-pointer"
                >
                  إعادة تحميل العدد
                </button>
              </div>
            </div>
          )}

          {frontItems.map((article: any, idx: number) => (
            <div
              key={article.id || idx}
              ref={idx === 0 ? activePageScrollRef : undefined}
              id={`article-${article.id || idx}`}
              data-page-slot={idx === 0 ? "right" : "left"}
              data-article-id={article.id || idx}
              className="jarida-paper-page flex flex-col justify-between h-full px-2 md:px-6"
            >
              <div>
                <div className="flex justify-between items-center text-[11px] text-[#775f3a] mb-2 font-sans font-bold gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#ebd9bc] px-2.5 py-0.5 rounded text-black border border-[#d3c49b]">
                      {article.source || "وكالة الأنباء"}
                    </span>
                    {article.category && (
                      <span className="text-[11px] text-[#6c624a] font-semibold">
                        • {article.category}
                      </span>
                    )}
                  </div>
                  <span>{new Date(article.publishedAt).toLocaleDateString("ar-MA")}</span>
                </div>
                <h2 className="jarida-article-headline text-xl md:text-2xl font-bold text-black mb-3 leading-snug">
                  {article.title}
                </h2>
                {article.imageUrl && (
                  <div className="my-3 overflow-hidden rounded border border-[#d3c49b] bg-[#f0e3cc] shadow-sm">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title} 
                      className="jarida-article-image w-full h-44 md:h-52 object-cover filter grayscale contrast-125 hover:grayscale-0 transition duration-500"
                    />
                  </div>
                )}
                <p className="jarida-article-summary text-sm md:text-base text-[#2c2c2c] leading-relaxed text-justify mb-3 font-serif">
                  {article.summary}
                </p>
                {article.content && article.content.trim() !== article.summary?.trim() && (
                  <p className="jarida-article-body text-xs md:text-sm text-[#4a4a4a] leading-relaxed text-justify font-serif border-t border-[#e2d5b3] pt-2 mb-4">
                    {article.content}
                  </p>
                )}

                {/* Social Share & Comments component */}
                <ArticleComments article={article} />
              </div>
              <div className="mt-6 pt-2 border-t border-[#e2d5b3] flex justify-between items-center text-xs text-[#776644] font-sans">
                <span>جريدة الأفق الإلكترونية</span>
                <span>صفحة {displayPageIndex * articlesPerView + idx + 1} من {processedArticles.length}</span>
              </div>
            </div>
          ))}

          {/* الصفحة المقابلة تبقى ظاهرة حتى في آخر spread، بحال ورقة جريدة حقيقية. */}
          {!isSinglePage && frontItems.length === 1 && (
            <div data-page-slot="left" aria-label="صفحة فارغة" className="jarida-empty-page flex flex-col justify-center items-center h-full min-h-[18rem] text-center p-8 text-[#998866] italic">
              <p className="text-base">تابعوا المزيد من المستجدات والتقارير في الإصدارات القادمة.</p>
            </div>
          )}
            </div>
          </div>

          {/* زاوية رفع الورقة من تحت جهة اليسار نحو اليمين لإظهار الورقة الأخرى */}
          {!isSheetActive && currentPage < totalPages - 1 && (
            <button
              type="button"
              data-peel-corner="bottom-left"
              aria-label="ارفع الورقة من تحت جهة اليسار لإظهار الورقة التالية"
              title="ارفع الورقة أو اسحبها من تحت جهة اليسار لجهة اليمين"
              className="jarida-corner-peel-next jarida-focusable"
              onPointerDown={(e) => startCornerPeelDrag("next", e)}
              onPointerMove={moveCornerPeelDrag}
              onPointerUp={endCornerPeelDrag}
              onPointerCancel={() => setPeelDrag(null)}
            >
              <span className="jarida-corner-peel-label">
                <CornerUpRight className="w-3 h-3" />
                <span>ارفع الورقة</span>
              </span>
            </button>
          )}

          {/* زاوية إرجاع الورقة السابقة من جهة اليمين إلى تحت جهة اليسار */}
          {!isSheetActive && currentPage > 0 && (
            <button
              type="button"
              data-peel-corner="top-right"
              aria-label="إرجاع الورقة السابقة من جهة اليمين"
              title="اسحب أو انقر لإرجاع الورقة السابقة"
              className="jarida-corner-peel-prev jarida-focusable"
              onPointerDown={(e) => startCornerPeelDrag("prev", e)}
              onPointerMove={moveCornerPeelDrag}
              onPointerUp={endCornerPeelDrag}
              onPointerCancel={() => setPeelDrag(null)}
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>إرجاع الورقة</span>
            </button>
          )}

          {isSheetActive && (
            <div
              className={`jarida-turning-page ${isTurning ? "is-turning" : ""} ${isInteractivePeeling ? "is-dragging" : ""} turn-${activeDirection}`}
              style={
                peelDrag
                  ? ({ "--jarida-peel-progress": peelDrag.progress } as React.CSSProperties)
                  : undefined
              }
              aria-busy="true"
              aria-label="تقليب الصفحة"
            >
              <div className="jarida-turning-face jarida-turning-front">
                <TurningPagePreview
                  items={turningSheetFromItems}
                  pageIndex={turningSheetPageIndex}
                  articlesPerView={articlesPerView}
                  totalArticles={processedArticles.length}
                  isSinglePage={isSinglePage}
                />
                <div className="jarida-peel-curl-flap" aria-hidden="true" />
              </div>
              <div className="jarida-turning-face jarida-turning-back" aria-hidden="true">
                <TurningPagePreview
                  items={turningSheetToItems}
                  pageIndex={displayPageIndex}
                  articlesPerView={articlesPerView}
                  totalArticles={processedArticles.length}
                  isSinglePage={isSinglePage}
                />
              </div>
            </div>
          )}
        </div>

        {/* Subtle progress bar in single-page / TV mode */}
        {isSinglePage && totalPages > 0 && (
          <div className="jarida-page-progress" aria-hidden="true">
            <div className="jarida-page-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        {/* Navigation Arrows & Footer */}
        <div className="fb-controls mt-8 pt-4 border-t-2 border-black flex justify-between items-center text-xs text-[#444] font-sans">
          <button 
            type="button"
            onClick={prevPage} 
            disabled={isTurning || currentPage === 0}
            className={`jarida-focusable flex items-center gap-1 px-3 py-1.5 rounded border border-[#c5b48b] bg-[#ebd9bc] hover:bg-[#ded0b1] transition ${currentPage === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>إرجاع الورقة</span>
          </button>

            <span className="text-center italic font-serif">
            {isAndroidTV
              ? `صفحة ${displayPageIndex + 1} من ${Math.max(1, totalPages)} • استعمل أزرار الريموت ◀ ▶ لرفع أو إرجاع الورقة`
              : isSinglePage
                ? `صفحة ${displayPageIndex + 1} من ${Math.max(1, totalPages)} • ارفع الورقة من تحت اليسار لليمين أو أرجعها`
                : 'ارفع الورقة من تحت جهة اليسار لجهة اليمين باش تبان الورقة الأخرى'}
            </span>

          <button 
            type="button"
            onClick={nextPage} 
            disabled={isTurning || currentPage >= totalPages - 1}
            className={`jarida-focusable flex items-center gap-1 px-3 py-1.5 rounded border border-[#c5b48b] bg-[#ebd9bc] hover:bg-[#ded0b1] transition ${currentPage >= totalPages - 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>ارفع الورقة (التالي)</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
