import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { createPortal } from "react-dom";
import { formatArabicEditionDate } from "@shared/date";
import { Volume2, VolumeX, RefreshCw, Share2, MessageSquare, Send, Check, FileText, BookOpen, Library, X, Headphones, Smartphone, Scale, Search, Archive } from "lucide-react";
import { isInstalledAppOrApk } from "@/lib/apiBase";
import VoiceReader from "../components/VoiceReader";
import ArchiveChest from "../components/ArchiveChest";
import ApkDownloadModal from "../components/ApkDownloadModal";
import LegalModal from "../components/LegalModal";
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
const ARTICLES_PER_NEWSPAPER_PAGE = 5;

const ARCHIVE_DAILY_ARTICLES = [
  {
    id: "archive-1",
    title: "تطورات الشأن الوطني: تعزيز الشراكات الاستراتيجية وإجراءات أمنية مشددة بالفنيدق",
    summary: "ملفات ساخنة تتصدر واجهة الأحداث الوطنية والدولية مع تعزيز الحضور الدبلوماسي للمملكة ومشاريع الربط القاري الكبرى.",
    content: "تشهد الدبلوماسية المغربية زخماً ملحوظاً بفضل الانتصارات المتتالية في ملف الصحراء المغربية وتوسيع الشراكات الاقتصادية الاستراتيجية.",
    source: "جريدة الأفق",
    category: "الواجهة الرئيسية",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    publishedAt: new Date("2026-11-24T09:00:00Z"),
  },
  {
    id: "archive-2",
    title: "كولومبيا تعترف بسيادة المغرب وتدعم مبادرة الحكم الذاتي",
    summary: "في خطوة دبلوماسية هامة، أعلنت جمهورية كولومبيا تغييراً في موقفها الرسمي معترفة بسيادة المغرب على صحرائه ودعمها لمبادرة الحكم الذاتي.",
    content: "اعتراف كولومبيا الأخير يضاف إلى سلسلة من المواقف الدولية الداعمة للوحدة الترابية للمملكة، مما يكرس وجاهة الطروحات المغربية ويعزز الاستقرار الإقليمي.",
    source: "وكالة الأفق",
    category: "دبلوماسية",
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-23T15:30:00Z"),
  },
  {
    id: "archive-3",
    title: "تقارير صندوق التقاعد: دعوات لإصلاحات هيكلية عاجلة قبل أفق 2030",
    summary: "بنك المغرب يصدر تقريراً يدق ناقوس الخطر حول وضعية صناديق التقاعد، داعياً إلى بلورة توافق وطني وإصلاحات عاجلة لتفادي أزمة مرتقبة.",
    content: "تتواصل النقاشات الحادة حول مآل أنظمة التقاعد في المغرب، حيث طالبت فعاليات اقتصادية بضرورة بلورة توافق وطني عاجل يضمن استدامة الصناديق.",
    source: "هسبريس",
    category: "اقتصاد",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-22T12:00:00Z"),
  },
  {
    id: "archive-4",
    title: "التعاون الإماراتي المغربي وتفعيل مشروع أنبوب الغاز نيجيريا-المغرب",
    summary: "تعزيز الشراكة الاقتصادية الاستراتيجية بين البلدين، مع التركيز على مشاريع البنية التحتية الطاقية الكبرى ومشروع غازودور نيجيريا-المغرب.",
    content: "عودة مجموعات استثمارية كبرى لتفعيل مشاريع مهيكلة بالسوق المغربية، تعزيزاً لمكانة القطب المالي الإقليمي والأمن الطاقي.",
    source: "مغرب 24",
    category: "اقتصاد وطاقة",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-21T10:15:00Z"),
  },
  {
    id: "archive-5",
    title: "أحداث المعابر الحدودية ويقظة أمنية عالية بالشمال",
    summary: "السلطات الأمنية المغربية تتعامل بحزم مع محاولات التسلل الجماعي نحو سبتة، وسط إجراءات مشددة ويقظة عالية على الحدود الشمالية.",
    content: "تعبئة ميدانية متواصلة لتأمين المعابر الحدودية والتصدي لشبكات الهجرة غير النظامية مع احترام الضوابط القانونية.",
    source: "الجزيرة نت",
    category: "شؤون وطنية",
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-20T18:00:00Z"),
  },
  {
    id: "archive-6",
    title: "انطلاق الموسم الكروي الجديد واستعدادات المنتخبات الوطنية للاستحقاقات القارية",
    summary: "تستعد الأندية الوطنية لانطلاق الموسم الكروي الجديد بصفقات وازنة ومعسكرات إعدادية مكثفة، وسط ترقب لمشاركة المنتخبات الوطنية.",
    content: "برنامج إعدادي متكامل للأندية والمنتخبات المغربية استعداداً للبطولات الأفريقية والعالمية المقبلة.",
    source: "جريدة الأفق",
    category: "رياضة",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-19T16:40:00Z"),
  },
  {
    id: "archive-7",
    title: "رهانات التنمية المستدامة ومشاريع الطاقة المتجددة بالمملكة",
    summary: "تقارير دولية تشيد بنجاح المشاريع الكبرى للطاقة الشمسية والريحية وتحلية مياه البحر لمواكبة الطلب المتزايد.",
    content: "توسيع محطات الطاقة النظيفة وتطوير شبكات النقل الكهربائي لدعم السيادة الطاقية والمائية.",
    source: "وكالة الأفق",
    category: "بيئة وتنمية",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-18T11:20:00Z"),
  },
  {
    id: "archive-8",
    title: "رأي الأفق: تضافر الجهود لمواجهة التحديات الاقتصادية والاجتماعية",
    summary: "إن المرحلة الحالية تستدعي تضافر جهود الجميع، مؤسسات ومواطنين، لمواجهة التحديات الاقتصادية والاجتماعية بروح المسؤولية والتبصر.",
    content: "صوناً للمكتسبات الوطنية ودعماً لمسار التنمية الشاملة، تبقى اليقظة الجماعية والابتكار ركيزتين أساسيتين للمرحلة المقبلة.",
    source: "هيئة التحرير",
    category: "رأي وتحليل",
    imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-17T09:00:00Z"),
  },
  {
    id: "archive-9",
    title: "ملف خاص: الثورة الرقمية وتحديث الإدارة العمومية بالمملكة",
    summary: "استراتيجية المغرب الرقمي 2030 تدخل مراحلها التنفيذية لتسهيل المساطر الإدارية وربط الخدمات بالمواطنين والفاعلين الاقتصاديين.",
    content: "تسريع ورش التحول الرقمي بالمرافق العمومية وملاءمة الإطار القانوني لتطوير منظومة الخدمات المرقمنة والأمن السيبراني.",
    source: "جريدة الأفق",
    category: "تكنولوجيا وإدارة",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-15T11:00:00Z"),
  },
  {
    id: "archive-10",
    title: "المغرب الفاسي والوداد: قمة كروية ساخنة بحضور جماهيري غفير",
    summary: "مواجهة كروية بطابع خاص في الدوري المغربي للمحترفين تنتهي بتعادل مثير وأجواء احتفالية رائعة في المدرجات.",
    content: "ندية عالية وتكتيك محكم بين الفريقين مع إشادة واسعة بالروح الرياضية والتنظيم المحكم للمباراة.",
    source: "الأفق الرياضي",
    category: "رياضة",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-13T18:30:00Z"),
  },
  {
    id: "archive-11",
    title: "القمة المناخية: إشادة دولية بالمبادرات المغربية في الاقتصاد الأخضر",
    summary: "ممثلو الوفود الدولية يؤكدون ريادة المغرب الإقليمية في إنتاج الهيدروجين الأخضر والتكيف مع التغيرات المناخية.",
    content: "عرض المشاريع النموذجية للمملكة في تدوير المياه وتحلية البحر واستعمال الطاقات النظيفة في القطاع الصناعي.",
    source: "وكالة الأفق",
    category: "بيئة واقتصاد",
    imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-11T14:15:00Z"),
  },
  {
    id: "archive-12",
    title: "المعرض الدولي للكتاب والتراث: إقبال قياسي واحتفاء بالأدب المغربي",
    summary: "اختتام فعاليات المعرض الثقافي بمشاركة أكثر من 50 دولة وندوات فكرية تسلط الضوء على عمق الهوية والتراث الوطني.",
    content: "تتويج مؤلفين مغاربة بجوائز الاستحقاق وندوات حوارية مفتوحة حول الكتاب والإبداع في العصر الرقمي.",
    source: "هيئة التحرير",
    category: "ثقافة وفنون",
    imageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=700&q=80",
    publishedAt: new Date("2026-11-09T10:00:00Z"),
  },
];

interface NewspaperPageSheet {
  id: string;
  pageNumber: number;
  leadArticle: any;
  columnArticles: any[];
  allArticles: any[];
  sectionTitle: string;
  pageDate: Date;
  dayKey?: string;
  isBlank?: boolean;
}

// كل يوم عندو صفحاته الخاصة: الصفحة الأولى ديال النهار كتبدا دائماً بالمانشيت ديالو، وما كتخلطش مع نهار آخر
function buildNewspaperPages(allArticles: any[], padToEven = false): NewspaperPageSheet[] {
  if (!allArticles || allArticles.length === 0) return [];
  const groups = new Map<string, any[]>();
  [...allArticles]
    .filter((a) => !Number.isNaN(new Date(a?.publishedAt).getTime()))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .forEach((a) => {
      const key = new Date(a.publishedAt).toISOString().slice(0, 10);
      const list = groups.get(key);
      if (list) list.push(a);
      else groups.set(key, [a]);
    });

  const pages: NewspaperPageSheet[] = [];
  groups.forEach((list, key) => {
    pages.push(...buildNewspaperPagesFlat(list).map((p) => ({ ...p, dayKey: key })));
    if (padToEven && pages.length % 2 === 1) {
      pages.push({
        id: `blank-${key}`,
        pageNumber: 0,
        leadArticle: null,
        columnArticles: [],
        allArticles: [],
        sectionTitle: "",
        pageDate: new Date(key),
        dayKey: key,
        isBlank: true,
      });
    }
  });
  return pages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
}

function buildNewspaperPagesFlat(allArticles: any[]): NewspaperPageSheet[] {
  if (!allArticles || allArticles.length === 0) return [];
  const pages: NewspaperPageSheet[] = [];
  for (let i = 0; i < allArticles.length; i += ARTICLES_PER_NEWSPAPER_PAGE) {
    const chunk = allArticles.slice(i, i + ARTICLES_PER_NEWSPAPER_PAGE);
    const lead = chunk[0];
    const cols = chunk.slice(1);
    const pageNumber = Math.floor(i / ARTICLES_PER_NEWSPAPER_PAGE) + 1;
    const rawDate = lead?.publishedAt ? new Date(lead.publishedAt) : new Date();
    const categories = Array.from(
      new Set(chunk.map((a: any) => a?.category).filter(Boolean)),
    );
    const sectionTitle =
      pageNumber === 1
        ? "الصفحة الأولى • واجهة الأحداث اليومية"
        : categories.length > 0
          ? `ملفات ${categories.slice(0, 2).join(" و")} • أرشيف ومتابعات`
          : `متابعات إخبارية شاملة • صفحة ${pageNumber}`;

    pages.push({
      id: String(lead?.id || `page-${pageNumber}`),
      pageNumber,
      leadArticle: lead,
      columnArticles: cols,
      allArticles: chunk,
      sectionTitle,
      pageDate: Number.isNaN(rawDate.getTime()) ? new Date() : rawDate,
    });
  }
  return pages;
}

function ArticleActionIcon() {
  return (
    <span className="relative block h-4 w-4" aria-hidden="true">
      <MessageSquare className="absolute inset-0 h-4 w-4" />
      <Share2 className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full bg-[#f8f1e3] p-[1px]" />
    </span>
  );
}

function ArticleActions({ article }: { article: any }) {
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);
  
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
    <>
      <div className="flex justify-start mt-3" dir="rtl">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(true);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#bda77d] bg-[#f8f1e3] text-[#59482b] shadow-sm transition hover:bg-[#ead9b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7348]"
          aria-label={`التعليقات والمشاركة (${comments.length})`}
          title="التعليقات والمشاركة"
        >
          <ArticleActionIcon />
        </button>
      </div>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
          dir="rtl"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`article-actions-title-${articleId}`}
            className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#cbb78f] bg-[#fbf6ec] text-right font-sans shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#d3c49b]/70 px-4 py-3">
              <h3 id={`article-actions-title-${articleId}`} className="flex items-center gap-2 text-sm font-bold text-[#3f321f]">
                <ArticleActionIcon /> التعليقات والمشاركة
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#59482b] transition hover:bg-[#eadfc9]"
                aria-label="إغلاق"
                autoFocus
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
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
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function NewspaperSheetContent({
  sheet,
  totalSheets,
  totalArticlesCount,
  showArticleActions = false,
}: {
  sheet: NewspaperPageSheet;
  totalSheets: number;
  totalArticlesCount: number;
  showArticleActions?: boolean;
}) {
  if (sheet.isBlank) {
    return (
      <div className="fb-content flex items-center justify-center h-full text-center text-[#666] italic p-8">
        <p className="text-base">نهاية عدد هذا اليوم • اقلب الورقة للعدد الموالي</p>
      </div>
    );
  }
  const lead = sheet.leadArticle || sheet;
  const cols = Array.isArray(sheet.columnArticles) ? sheet.columnArticles : [];
  const leftColArticles = cols.filter((_: any, i: number) => i % 2 === 0);
  const rightColArticles = cols.filter((_: any, i: number) => i % 2 === 1);
  const pageNum = sheet.pageNumber || 1;
  const pageDate = sheet.pageDate ? new Date(sheet.pageDate) : new Date(lead?.publishedAt || Date.now());

  return (
    <div className="fb-content flex flex-col justify-between h-full">
      <div>
        {/* ترويسة الجريدة اليومية بحال الجرائد الورقية الكلاسيكية (الثورة / الأفق) */}
        <div className="np-header">
          <div className="np-logo-area">
            <span className="np-logo-main">الأفق</span>
            <span className="np-logo-sub">جريدة يومية شاملة</span>
          </div>
          <div className="np-info-bar">
            <span>السنة الأولى - العدد {String(pageNum).padStart(2, "0")}</span>
            <span>{formatArabicEditionDate(pageDate)}</span>
            <span>صفحة {pageNum} / {Math.max(1, totalSheets)} ({totalArticlesCount} خبر)</span>
          </div>
        </div>

        {pageNum > 1 && sheet.sectionTitle && (
          <div className="np-section-banner">
            <span>{sheet.sectionTitle}</span>
          </div>
        )}

        {/* الخبر الرئيسي في الصفحة (المانشيت) */}
        <div className="np-lead-block">
          <div className="flex justify-between items-center text-[10px] text-[#444] mb-1 font-sans font-bold gap-2 flex-wrap">
            <span className="np-source-badge">
              {lead?.source || "وكالة الأفق للأخبار"} {lead?.category ? `• ${lead.category}` : ""}
            </span>
            <span>{new Date(lead?.publishedAt || Date.now()).toLocaleDateString("ar-MA")}</span>
          </div>
          <h2 className="np-headline-main jarida-article-headline">
            {lead?.title}
          </h2>
          <p className="np-sub-headline jarida-article-summary">
            {lead?.summary}
          </p>
          {lead?.imageUrl && (
            <div className="np-media">
              <img
                src={lead.imageUrl}
                alt={lead.title || "صورة الخبر"}
                className="jarida-article-image"
              />
            </div>
          )}
          {lead?.content && lead.content.trim() !== lead.summary?.trim() && (
            <p className="np-lead-body jarida-article-body">
              {lead.content}
            </p>
          )}
        </div>

        {/* شبكة الأخبار اليومية الفايتة والحالية (عمودان على طراز الجرائد اليومية) */}
        {cols.length > 0 && (
          <div className="np-grid">
            <div className="np-col np-col-left">
              {leftColArticles.map((art: any, aIdx: number) => (
                <div key={art.id || aIdx} className="np-article-box">
                  <div className="np-article-meta">
                    <span>{art.source || "الأفق"}</span>
                    <span>{new Date(art.publishedAt || Date.now()).toLocaleDateString("ar-MA")}</span>
                  </div>
                  <h3 className="np-article-title">{art.title}</h3>
                  <p className="np-article-text">{art.summary}</p>
                </div>
              ))}
            </div>
            <div className="np-col">
              {rightColArticles.map((art: any, aIdx: number) => (
                <div key={art.id || aIdx} className="np-article-box">
                  <div className="np-article-meta">
                    <span>{art.source || "الأفق"}</span>
                    <span>{new Date(art.publishedAt || Date.now()).toLocaleDateString("ar-MA")}</span>
                  </div>
                  <h3 className="np-article-title">{art.title}</h3>
                  <p className="np-article-text">{art.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showArticleActions && lead && <ArticleActions article={lead} />}
      </div>

      {/* الشريط السفلي الأزرق الخاص بالجريدة اليومية */}
      <div className="np-footer-bar">
        <span>وكالة الأفق للأخبار • الأرشيف اليومي الشامل</span>
        <span className="np-footer-tag">
          صفحة {pageNum} من {Math.max(1, totalSheets)}
        </span>
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
          : "grid grid-cols-2 gap-0 lg:gap-8 divide-x divide-x-reverse divide-[#ccc]"
      } items-start`}
      dir="rtl"
    >
      {items.length === 0 ? (
        <div className="col-span-full flex items-center justify-center text-center text-[#333] p-8">
          <span className="text-sm opacity-70">العدد اليومي</span>
        </div>
      ) : (
        items.map((sheet: any, index: number) => (
          <div
            key={sheet.id || index}
            className="jarida-paper-page flex flex-col justify-between h-full px-2 md:px-5"
          >
            <NewspaperSheetContent
              sheet={sheet}
              totalSheets={Math.max(1, Math.ceil(totalArticles / Math.max(1, articlesPerView)))}
              totalArticlesCount={totalArticles * ARTICLES_PER_NEWSPAPER_PAGE}
              showArticleActions={false}
            />
          </div>
        ))
      )}
      {!isSinglePage && items.length === 1 && (
        <div
          aria-hidden="true"
          className="jarida-empty-page flex flex-col justify-center items-center h-full min-h-[18rem] text-center p-8 text-[#666] italic"
        >
          <p className="text-base">تابعوا المزيد من المستجدات والتقارير في الإصدارات القادمة.</p>
        </div>
      )}
    </div>
  );
}

function readInitialDeviceState(): { deviceKind: JaridaDeviceKind; viewMode: JaridaViewMode } {
  if (typeof window === "undefined") {
    return { deviceKind: "desktop", viewMode: "single" };
  }
  const env = {
    userAgent: navigator.userAgent || "",
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    search: window.location.search,
  };
  return {
    deviceKind: detectDeviceKind(env),
    viewMode: "single",
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
  const [viewMode, setViewMode] = useState<JaridaViewMode>("single");
  const [hasManualViewChoice, setHasManualViewChoice] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
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
      setViewMode("single");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const playFlipSound = useCallback(() => {
    if (isMuted) return;
    try {
      const audio = new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch (e) {}
  }, [isMuted]);

  const [activeCategory, setActiveCategory] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);

  // دمج كل الداتا اليومية الحية مع الداتا اليومية الفايتة (الأرشيف اليومي)
  const allDailyArticles = useMemo(() => {
    const liveList = Array.isArray(articles) ? articles : [];
    const seenTitles = new Set(liveList.map((a: any) => a?.title?.trim()));
    return [
      ...liveList,
      ...ARCHIVE_DAILY_ARTICLES.filter((a) => !seenTitles.has(a.title.trim())),
    ];
  }, [articles]);

  const categories = useMemo(() => {
    return ["الكل", "مغرب", "اقتصاد", "دولي", "رياضة", "رأي"];
  }, []);

  const filteredArticles = useMemo(() => {
    return allDailyArticles.filter((art: any) => {
      const matchesCategory =
        activeCategory === "الكل" ||
        (art.category && art.category.toLowerCase().includes(activeCategory.toLowerCase()));
      const matchesSearch =
        !searchQuery.trim() ||
        (art.title && art.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (art.summary && art.summary.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [allDailyArticles, activeCategory, searchQuery]);

  const displayArticles = searchQuery.trim() || activeCategory !== "الكل" ? filteredArticles : allDailyArticles;
  const processedArticles = useMemo(() => buildNewspaperPages(displayArticles, false), [displayArticles]);

  useEffect(() => {
    setCurrentPage(0);
  }, [activeCategory, searchQuery]);

  const toggleAudioBriefing = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeakingAudio) {
      window.speechSynthesis.cancel();
      setIsSpeakingAudio(false);
      return;
    }

    const topArticles = displayArticles.slice(0, 3);
    if (topArticles.length === 0) return;

    const textToRead = "الموجز الصوتي لجريدة الأفق اليومية. " + topArticles.map((a: any, idx: number) => `الخبر ${idx + 1}: ${a.title}. ${a.summary || ""}`).join(" ");

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "ar-SA";
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith("ar"));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onend = () => setIsSpeakingAudio(false);
    utterance.onerror = () => setIsSpeakingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeakingAudio(true);
  }, [isSpeakingAudio, displayArticles]);

  // رف الجرائد: كل يوم = عدد (جورنال يومي) كيتحط فـ جيب من جيوب الرف
  const [isRackOpen, setIsRackOpen] = useState(true);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [enteringKey, setEnteringKey] = useState<string | null>(null);
  const dailyEditions = (() => {
    const seen = new Map<string, { key: string; pageIndex: number; count: number; lead: any }>();
    processedArticles.forEach((page, pageIndex) => {
      if (page.isBlank || !page.dayKey) return;
      const existing = seen.get(page.dayKey);
      const n = page.allArticles.length;
      if (existing) existing.count += n;
      else seen.set(page.dayKey, { key: page.dayKey, pageIndex, count: n, lead: page.leadArticle });
    });
    return Array.from(seen.values()).slice(0, 16);
  })();

  const openEditionFromRack = (pageIndex: number, key: string) => {
    if (enteringKey) return;
    // الجريدة المختارة كتقرب للكاميرا (دخول) وبعدها كتتفتح الجريدة وتقدر تقلب فيها
    setEnteringKey(key);
    window.setTimeout(() => {
      setCurrentPage(pageIndex);
      setIsAutoPlaying(false);
      setIsRackOpen(false);
      setEnteringKey(null);
    }, 650);
  };

  const isSinglePage = true;
  const isAndroidTV = deviceKind === "android-tv";
  const isAndroid = deviceKind === "android-phone" || deviceKind === "android-tv";
  const isNativeApk = useMemo(() => isInstalledAppOrApk(), []);

  const ARTICLES_PER_SPREAD = 2;
  const articlesPerView = 1;
  const totalPages = processedArticles.length;

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

  // ===== محرك تقليب الورقة =====
  // progress من 0 حتى 1 كيتحرك بـ requestAnimationFrame، باش الورقة تكمل من البلاصة اللي طلقتيها فيها بلا قفزة،
  // وقفل (turnLockRef) كيمنع جوج تقليبات فنفس الوقت (لمس + ماوس، ولا نقر مزدوج).
  const turnLockRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{
    direction: "next" | "prev";
    startX: number;
    startY: number;
    progress: number;
    toPage: number;
    source: "touch" | "pointer";
    moved: boolean;
  } | null>(null);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const prepareTurn = useCallback((step: number) => {
    if (turnLockRef.current || totalPages <= 1) return null;
    const turn = getBoundedPageChange(currentPage, totalPages, step);
    if (!turn) return null;
    turnLockRef.current = true;
    setTurningFromItems(processedArticles.slice(currentPage * articlesPerView, (currentPage + 1) * articlesPerView));
    setTurningToItems(processedArticles.slice(turn.toPage * articlesPerView, (turn.toPage + 1) * articlesPerView));
    setTurningFromPage(currentPage);
    setTurningToPage(turn.toPage);
    setTurnDirection(turn.direction);
    return { direction: turn.direction, toPage: turn.toPage };
  }, [totalPages, currentPage, processedArticles, articlesPerView]);

  const animateSheet = useCallback((direction: "next" | "prev", toPage: number, from: number, to: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 1 : Math.max(240, Math.abs(to - from) * PAGE_TURN_DURATION_MS * 0.7);
    const startedAt = performance.now();
    setIsTurning(true);
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const progress = from + (to - from) * eased;
      setPeelDrag({ direction, progress, startX: 0, startY: 0, moved: true });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      rafRef.current = null;
      if (to >= 1) setCurrentPage(toPage);
      setPeelDrag(null);
      setIsTurning(false);
      dragRef.current = null;
      turnLockRef.current = false;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const requestPageChange = useCallback((step: number) => {
    const turn = prepareTurn(step);
    if (!turn) return;
    playFlipSound();
    setPeelDrag({ direction: turn.direction, progress: 0, startX: 0, startY: 0, moved: true });
    animateSheet(turn.direction, turn.toPage, 0, 1);
  }, [prepareTurn, animateSheet, playFlipSound]);

  const beginDrag = (direction: "next" | "prev", x: number, y: number, source: "touch" | "pointer") => {
    const turn = prepareTurn(direction === "next" ? 1 : -1);
    if (!turn) return false;
    dragRef.current = { direction, startX: x, startY: y, progress: 0.04, toPage: turn.toPage, source, moved: false };
    setPeelDrag({ direction, progress: 0.04, startX: x, startY: y, moved: false });
    return true;
  };

  const updateDrag = (x: number, y: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const bounds = spreadRef.current?.getBoundingClientRect();
    const progress = Math.max(
      0.04,
      getBottomLeftPeelProgress(drag.startX, drag.startY, x, y, bounds?.width ?? 640, bounds?.height ?? 520, drag.direction),
    );
    drag.progress = progress;
    if (Math.hypot(x - drag.startX, y - drag.startY) > 10) drag.moved = true;
    setPeelDrag({ direction: drag.direction, progress, startX: drag.startX, startY: drag.startY, moved: drag.moved });
  };

  // ملي كتطلق: إلا سحبتي بزاف (ولا نقرتي على الزاوية) الورقة كتكمل، وإلا كترجع لبلاصتها بالشوية
  const endDrag = (tapCompletesTurn: boolean) => {
    const drag = dragRef.current;
    if (!drag) return;
    const complete = drag.progress >= 0.2 || (tapCompletesTurn && !drag.moved);
    if (complete) playFlipSound();
    animateSheet(drag.direction, drag.toPage, drag.progress, complete ? 1 : 0);
  };

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
    // الأزرار (بما فيهم زوايا الورقة) عندها المعالجة ديالها، باش ما يوقعش تقليب مزدوج
    touchStartedInteractive.current = Boolean(
      target?.closest("button, a, input, textarea, select, label"),
    );
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    if (touchStartedInteractive.current || startX === null || startY === null) return;
    const x = event.touches[0]?.clientX ?? startX;
    const y = event.touches[0]?.clientY ?? startY;

    if (dragRef.current) {
      if (dragRef.current.source === "touch") updateDrag(x, y);
      return;
    }
    if (turnLockRef.current) return;

    const dx = x - startX;
    const dy = y - startY;
    // ما كيبدا التقليب حتى تكون الحركة أفقية واضحة، باش القراءة والتمرير العمودي يبقاو عاديين
    if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    // الصبع لليمين = رفع الورقة من تحت اليسار لليمين (التالي) • الصبع لليسار = إرجاع الورقة (السابق)
    if (beginDrag(dx > 0 ? "next" : "prev", startX, startY, "touch")) updateDrag(x, y);
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    touchStartedInteractive.current = false;
    if (dragRef.current?.source === "touch") endDrag(false);
  };

  const startCornerPeelDrag = (
    direction: "next" | "prev",
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (!beginDrag(direction, event.clientX, event.clientY, "pointer")) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore pointer capture issues
    }
  };

  const moveCornerPeelDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.source !== "pointer") return;
    event.stopPropagation();
    updateDrag(event.clientX, event.clientY);
  };

  const endCornerPeelDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.source !== "pointer") return;
    event.stopPropagation();
    endDrag(true);
  };

  const cancelCornerPeelDrag = () => {
    if (dragRef.current?.source === "pointer") endDrag(false);
  };

  const currentItems = processedArticles.slice(
    currentPage * articlesPerView,
    (currentPage + 1) * articlesPerView
  );
  const isSheetActive = Boolean(peelDrag);
  const activeDirection = peelDrag ? peelDrag.direction : turnDirection;

  // التالي: الورقة الجاية كتبان مباشرة تحت الورقة اللي كترفع • السابق: الورقة الحالية كتبقى تحت حتى تنزل عليها الورقة السابقة
  const frontItems = isSheetActive
    ? activeDirection === "next"
      ? turningToItems
      : turningFromItems
    : currentItems;

  const displayPageIndex = isSheetActive
    ? activeDirection === "next"
      ? turningToPage
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

  const currentActiveArticle =
    frontItems[0]?.leadArticle ||
    frontItems[0]?.allArticles?.[0] ||
    allDailyArticles[0];
  const currentArticleTitle = currentActiveArticle?.title || "";
  const currentArticleContent =
    currentActiveArticle?.content || currentActiveArticle?.summary || "";

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
      {/* Unified Compact Navigation & Category Bar */}
      <header className="jarida-unified-navbar z-20 w-full max-w-5xl mx-auto px-2.5 py-1.5 bg-[#fbf6ec]/95 backdrop-blur-md rounded-xl shadow-xs border border-[#d8c8a5] flex flex-col gap-1.5 mb-1 flex-shrink-0">
        {/* Row 1: Brand & Key Interactive Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Logo / Brand Title */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="font-serif font-black text-sm text-[#241a0d] flex items-center gap-1">
              🗞️ جريدة الأفق
            </span>
            <span className="hidden sm:inline-block text-[10px] bg-[#ebdcc4] text-[#6d553b] px-1.5 py-0.5 rounded font-sans">
              العدد اليومي
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
            {/* Audio Briefing */}
            <button
              type="button"
              onClick={toggleAudioBriefing}
              className={`jarida-focusable flex items-center gap-1 text-[11px] sm:text-xs px-2 py-1 rounded transition cursor-pointer ${
                isSpeakingAudio
                  ? "bg-[#d3c49b] text-black font-bold ring-1 ring-[#947743]"
                  : "bg-[#ebdcc4]/70 text-[#4c3924] hover:bg-[#decab0]"
              }`}
              title={isSpeakingAudio ? "إيقاف الموجز الصوتي" : "الموجز الصوتي لأهم العناوين"}
            >
              <Headphones className={`w-3.5 h-3.5 ${isSpeakingAudio ? "animate-pulse text-[#7a5b1e]" : ""}`} />
              <span className="hidden xs:inline">{isSpeakingAudio ? "إيقاف" : "الموجز 🎙️"}</span>
            </button>

            {/* Voice Assistant (Gemini Live) */}
            <VoiceReader
              articleTitle={currentArticleTitle}
              articleContent={currentArticleContent}
            />

            {/* Archive Gallery */}
            <button
              type="button"
              onClick={() => setIsChestOpen(true)}
              className="jarida-focusable flex items-center gap-1.5 text-[11px] sm:text-xs text-[#2b2013] hover:text-black transition cursor-pointer px-2.5 py-1 rounded bg-[#efe5ce] hover:bg-[#e4d6b6] border border-[#cfbd97] font-bold shadow-2xs"
              title="أرشيف الأعداد السابقة"
            >
              <Archive className="w-3.5 h-3.5 text-[#8f6d33]" />
              <span className="hidden sm:inline">الأرشيف</span>
            </button>

            {/* Rack */}
            <button
              type="button"
              onClick={() => setIsRackOpen(true)}
              className="jarida-focusable flex items-center gap-1 text-[11px] sm:text-xs text-[#554a32] hover:text-black transition cursor-pointer px-1.5 py-1 rounded hover:bg-[#ebdcc4]"
              title="رف الجرائد اليومية"
            >
              <Library className="w-3.5 h-3.5" />
              <span className="hidden md:inline">الرف</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="jarida-focusable flex items-center text-[#554a32] hover:text-black transition cursor-pointer p-1 rounded hover:bg-[#ebdcc4]"
              title="تحديث الأخبار الآن"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            </button>

            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="jarida-focusable flex items-center text-[#554a32] hover:text-black transition cursor-pointer p-1 rounded hover:bg-[#ebdcc4]"
              title={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
              aria-label={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Download APK (ONLY shown when NOT running in installed APK or PWA) */}
            {!isNativeApk && (
              <button
                type="button"
                onClick={() => setIsApkModalOpen(true)}
                className="jarida-focusable flex items-center gap-1 text-[11px] sm:text-xs text-[#1e4620] hover:text-black transition cursor-pointer px-2 py-1 rounded bg-[#e1eee2] hover:bg-[#cfdfd0] border border-[#a4c9a7] font-bold shadow-2xs"
                title="تحميل تطبيق أندرويد (APK)"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#2d6630]" />
                <span>تحميل APK 📱</span>
              </button>
            )}

            {/* Legal Disclaimer */}
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="jarida-focusable flex items-center text-[#705536] hover:text-[#2a1d11] transition cursor-pointer p-1 rounded hover:bg-[#ebdcc4]"
              title="إخلاء المسؤولية وحقوق النشر ⚖️"
            >
              <Scale className="w-3.5 h-3.5 text-[#8f6d33]" />
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter & Search integrated seamlessly */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#dfd2b5]/70">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-bold transition flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[#233c30] text-[#dcb45b] shadow-2xs ring-1 ring-[#dcb45b]/50"
                      : "bg-[#efe5ce]/80 text-[#4c3f2b] hover:bg-[#e4d6b6] border border-[#d8c8a5]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-32 sm:w-48 flex-shrink-0">
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#7d6948]">
              <Search className="w-3 h-3" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الأخبار..."
              className="w-full pr-6 pl-5 py-0.5 text-[11px] bg-[#f7efdc]/90 text-[#241a0d] placeholder-[#8a7657] border border-[#cfbd97] rounded-full focus:outline-none focus:ring-1 focus:ring-[#233c30]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-[#7d6948] hover:text-black cursor-pointer"
                aria-label="مسح البحث"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {isRackOpen && (
        <div
          className="jarida-rack-overlay"
          role="dialog"
          aria-label="رف الجرائد اليومية"
          onClick={() => setIsRackOpen(false)}
        >
          <div className="jarida-rack-stage" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="jarida-rack-close jarida-focusable"
              onClick={() => setIsRackOpen(false)}
              aria-label="إغلاق الرف"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="jarida-rack">
              <div className="jarida-rack-pole" aria-hidden="true" />
              <div className="jarida-rack-tiers">
                {dailyEditions.map((ed, edIndex) => (
                  <button
                    key={ed.key}
                    type="button"
                    className={`jarida-rack-pocket jarida-focusable ${enteringKey === ed.key ? "is-entering" : enteringKey ? "is-dimmed" : ""}`}
                    style={{ "--row": Math.floor(edIndex / 2), "--col": edIndex % 2 } as React.CSSProperties}
                    onClick={() => openEditionFromRack(ed.pageIndex, ed.key)}
                    title={ed.lead?.title}
                  >
                    <span className="jarida-rack-cover">
                      <span className="jarida-rack-mast">جريدة الأفق</span>
                      <span className="jarida-rack-date">
                        {new Date(ed.key).toLocaleDateString("ar-MA", { weekday: "short", day: "numeric", month: "long" })}
                      </span>
                      {ed.lead?.imageUrl && (
                        <img src={ed.lead.imageUrl} alt="" aria-hidden="true" />
                      )}
                      <span className="jarida-rack-title">{ed.lead?.title}</span>
                      <span className="jarida-rack-count">{ed.count} خبر</span>
                    </span>
                    <span className="jarida-rack-wire" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="jarida-rack-base" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {/* 3D Mango Wood Archive Chest (خزانة الأرشيف والأعداد السابقة) */}
      <ArchiveChest
        isOpen={isChestOpen}
        onClose={() => setIsChestOpen(false)}
        editions={dailyEditions}
        onSelectEdition={(pageIndex, key) => {
          openEditionFromRack(pageIndex, key);
          setIsChestOpen(false);
        }}
      />

      {/* Download APK Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Legal & Disclaimer Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Newspaper Spread Container (Authentic Daily Newspaper Layout / مثل الجرائد اليومية) */}
      <div className="fb-book relative text-[#111] my-auto flex flex-col justify-between">
        {!isSinglePage && <div className="fb-spine" aria-hidden="true" />}

        {/* Content Spread: single clean newspaper page on Android / TV / mobile, double-page newspaper on desktop */}
        <div
          ref={spreadRef}
          className={`jarida-spread relative ${isSinglePage ? "grid grid-cols-1 gap-0" : "grid grid-cols-2 gap-0 lg:gap-8 divide-x divide-x-reverse divide-[#ccc]"} flex-grow items-start`}
          dir="rtl"
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest("button, a, input, textarea")) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            // النقر على جهة اليسار يرفع الورقة من تحت اليسار نحو اليمين (التالي)، والنقر على جهة اليمين يرجع الورقة السابقة
            requestPageChange(event.clientX - bounds.left < bounds.width / 2 ? 1 : -1);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="jarida-static-spread">
            <div className={`jarida-static-spread-content relative ${isSinglePage ? "grid grid-cols-1 gap-0" : "grid grid-cols-2 gap-0 lg:gap-12 divide-x divide-x-reverse divide-[#ccc]"} items-start`}>
          
          {/* Center Book Spine Shadow (Desktop spread only) */}
          {!isSinglePage && (
            <div className="hidden lg:block absolute top-0 bottom-0 right-1/2 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none -mr-4 z-10" />
          )}

          {frontItems.map((sheet: NewspaperPageSheet, idx: number) => (
            <div
              key={sheet.id || idx}
              ref={idx === 0 ? activePageScrollRef : undefined}
              id={`article-${sheet.id || idx}`}
              data-page-slot={idx === 0 ? "right" : "left"}
              data-article-id={sheet.id || idx}
              className="jarida-paper-page flex flex-col justify-between h-full px-2 md:px-5"
            >
              <NewspaperSheetContent
                sheet={sheet}
                totalSheets={processedArticles.length}
                totalArticlesCount={allDailyArticles.length}
                showArticleActions={true}
              />
            </div>
          ))}

          {/* الصفحة المقابلة تبقى ظاهرة حتى في آخر spread، بحال ورقة جريدة حقيقية. */}
          {!isSinglePage && frontItems.length === 1 && (
            <div data-page-slot="left" aria-label="صفحة فارغة" className="jarida-empty-page flex flex-col justify-center items-center h-full min-h-[18rem] text-center p-8 text-[#666] italic">
              <p className="text-base">تابعوا المزيد من المستجدات والتقارير في الإصدارات القادمة.</p>
            </div>
          )}
            </div>
          </div>

          {/* طية الورقة الطبيعية من تحت جهة اليسار (بدون كتابة أو تعليمات) للرفع بالإصبع نحو اليمين */}
          {currentPage < totalPages - 1 && (
            <button
              type="button"
              data-peel-corner="bottom-left"
              aria-label="طية الورقة التالية"
              className="jarida-corner-peel-next jarida-focusable"
              onPointerDown={(e) => startCornerPeelDrag("next", e)}
              onPointerMove={moveCornerPeelDrag}
              onPointerUp={endCornerPeelDrag}
              onPointerCancel={cancelCornerPeelDrag}
            />
          )}

          {/* طية إرجاع الورقة السابقة من جهة اليمين (بدون كتابة أو تعليمات) للسحب بالإصبع نحو تحت اليسار */}
          {currentPage > 0 && (
            <button
              type="button"
              data-peel-corner="top-right"
              aria-label="طية الورقة السابقة"
              className="jarida-corner-peel-prev jarida-focusable"
              onPointerDown={(e) => startCornerPeelDrag("prev", e)}
              onPointerMove={moveCornerPeelDrag}
              onPointerUp={endCornerPeelDrag}
              onPointerCancel={cancelCornerPeelDrag}
            />
          )}

          {isSheetActive && (
            <div
              className={`jarida-turning-page is-dragging turn-${activeDirection}`}
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

        {/* Subtle progress bar in single-page / TV mode (without any bottom instructions) */}
        {isSinglePage && totalPages > 0 && (
          <div className="jarida-page-progress" aria-hidden="true">
            <div className="jarida-page-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
        )}

      </div>
    </div>
  );
}
