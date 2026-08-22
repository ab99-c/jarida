import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Volume2, VolumeX, RefreshCw, ChevronLeft, ChevronRight, Share2, MessageSquare, Send, Check } from "lucide-react";

function ArticleComments({ article }: { article: any }) {
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const articleId = article.id || 1;
  const utils = trpc.useUtils();
  const { data: comments = [], isLoading: isLoadingComments, isError: isErrorComments, refetch } = trpc.jarida.getComments.useQuery({ articleId });
  
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
          onClick={() => handleShare("whatsapp")}
          className="px-2 py-1 bg-[#25D366] text-white rounded hover:opacity-90 transition font-medium cursor-pointer"
        >
          واتساب
        </button>
        <button
          onClick={() => handleShare("facebook")}
          className="px-2 py-1 bg-[#1877F2] text-white rounded hover:opacity-90 transition font-medium cursor-pointer"
        >
          فيسبوك
        </button>
        <button
          onClick={() => handleShare("twitter")}
          className="px-2 py-1 bg-black text-white rounded hover:opacity-90 transition font-medium cursor-pointer"
        >
          X (تويتر)
        </button>
        <button
          onClick={() => handleShare("copy")}
          className="px-2 py-1 bg-[#e0ceb1] text-black rounded hover:bg-[#d3c49b] transition font-medium flex items-center gap-1 cursor-pointer"
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
          />
          <textarea
            placeholder="اكتب تعليقك هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
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

export default function Home() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTurning, setIsTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");

  const { data: dailyData, refetch } = trpc.jarida.getDailyEdition.useQuery();
  const refreshMutation = trpc.jarida.refreshFeed.useMutation({
    onSuccess: () => refetch(),
  });
  const articles = dailyData?.articles;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const playFlipSound = () => {
    if (isMuted) return;
    try {
      const audio = new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const processedArticles = articles && articles.length > 0 ? articles : [
    {
      id: 1,
      title: "تعزيز الحضور الدبلوماسي للمملكة على الساحة الدولية",
      summary: "تشهد الدبلوماسية المغربية زخماً ملحوظاً بفضل الانتصارات المتتالية في ملف الصحراء المغربية، حيث يضاف اعتراف كولومبيا الأخير إلى سلسلة من المواقف الدولية الداعمة للوحدة الترابية للمملكة، مما يكرس وجاهة الطروحات المغربية ويعزز الاستقرار الإقليمي.",
      content: "في خطوة تعكس عمق ومتانة العلاقات الثنائية، أعلنت بوغوتا رسمياً دعمها الكامل لمبادرة الحكم الذاتي تحت السيادة المغربية. وأكد المحللون أن هذا الموقف يمثل تحولاً استراتيجياً في أمريكا اللاتينية...",
      source: "هسبريس",
      publishedAt: new Date(),
      imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "انطلاقة قوية لموسم الفلاحة والري الحديث بالمغرب",
      summary: "تطلق وزارة الفلاحة برامج جديدة لدعم السقي الموضعي واستعمال الطاقات المتجددة في الآبار الفلاحية لضمان الأمن المائي والغذائي لمواجهة تحديات الجفاف.",
      content: "تعرف المناطق الفلاحية في سوس وسايس تعبئة شاملة لتنزيل الجيل الجديد من المشاريع المرتبطة الاقتصاد في الماء والتحول الرقمي الفلاحي...",
      source: "الجزيرة نت",
      publishedAt: new Date(),
      imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "معرض الكتاب الدولي بالرباط يستقطب آلاف الزوار",
      summary: "سجل المعرض الدولي للنشر والكتاب رقماً قياسياً جديداً في عدد الزوار خلال الأيام الأولى، مع مشاركة واسعة لدور نشر عربية وعالمية وندوات فكرية كبرى.",
      content: "يشكل المعرض هذه السنة ملتقى فريداً للمثقفين والمفكرين لمناقشة قضايا الراهن الثقافي العربي والعالمي...",
      source: "مغرب 24",
      publishedAt: new Date(),
      imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      title: "آفاق واعدة للاقتصاد الرقمي والذكاء الاصطناعي",
      summary: "الحكومة تعلن عن حزمة حوافز جديدة للشركات الناشئة المتخصصة في التكنولوجيا والذكاء الاصطناعي لجذب الاستثمارات الأجنبية وخلق فرص شغل للشباب.",
      content: "تسعى المدن الذكية في الدار البيضاء ومراكش لتكون منصات إقليمية كبرى للابتكار الرقمي...",
      source: "هسبريس",
      publishedAt: new Date(),
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const itemsPerPage = isMobile ? 1 : 2;
  const totalPages = Math.ceil(processedArticles.length / itemsPerPage);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      requestPageChange(currentPage < totalPages - 1 ? 1 : -currentPage);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalPages, isMuted, currentPage, isTurning]);

  const requestPageChange = (step: number) => {
    if (isTurning || totalPages <= 1) return;
    const nextPageIndex = Math.max(0, Math.min(totalPages - 1, currentPage + step));
    if (nextPageIndex === currentPage) return;

    setTurnDirection(step > 0 ? "next" : "prev");
    setIsTurning(true);
    playFlipSound();
    window.setTimeout(() => {
      setCurrentPage(nextPageIndex);
      setIsTurning(false);
    }, 760);
  };

  const nextPage = () => requestPageChange(1);
  const prevPage = () => requestPageChange(-1);

  const currentItems = processedArticles.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[#2c2416] text-[#2b2b2b] flex flex-col items-center justify-center p-2 md:p-6 select-none font-serif relative overflow-x-hidden">
      {/* Top minimal header controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3 bg-[#f5e6cc]/90 backdrop-blur px-3 py-1.5 rounded-full shadow-md border border-[#d3c49b]">
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="flex items-center gap-1.5 text-xs text-[#554a32] hover:text-black transition cursor-pointer"
          title="تحديث الأخبار الآن"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          <span>تحديث</span>
        </button>
        <span className="text-xs text-[#a39371]">|</span>
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition cursor-pointer ${isAutoPlaying ? "bg-[#d3c49b]/60 text-black font-bold" : "text-[#554a32] hover:text-black"}`}
          title={isAutoPlaying ? "إيقاف التقليب التلقائي" : "تشغيل التقليب التلقائي"}
        >
          <span>{isAutoPlaying ? "تقليب تلقائي: مفعل" : "تقليب تلقائي: متوقف"}</span>
        </button>
        <span className="text-xs text-[#a39371]">|</span>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="flex items-center gap-1 text-xs text-[#554a32] hover:text-black transition cursor-pointer"
          title={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Newspaper Spread Container (Vintage Book Layout) */}
      <div className="relative w-full max-w-6xl bg-[#f7eedc] text-[#1a1a1a] shadow-2xl rounded-sm border border-[#d6c39a] p-4 md:p-10 my-auto flex flex-col justify-between min-h-[85vh]">
        
        {/* Masthead */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-center text-xs text-[#555] mb-1 px-2 font-sans font-semibold">
            <span>الثلاثاء، 18 غشت 2026</span>
            <span>الإصدار اليومي الشامل</span>
            <span>العدد {currentPage + 1}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black font-serif">
            جريدة الأفق
          </h1>
          <p className="text-xs tracking-widest text-[#555] uppercase mt-1 font-sans">
            صوت الحقيقة والخبر اليقين • يومية مستقلة
          </p>
        </div>

        {/* Content Spread (Double Page on Desktop/Laptop, Single Page on Mobile & Tablet) */}
        <div
          className="jarida-spread relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 flex-grow items-start lg:divide-x lg:divide-x-reverse lg:divide-[#d3c49b]"
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest("button, a, input, textarea")) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            requestPageChange(event.clientX - bounds.left > bounds.width / 2 ? 1 : -1);
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            const bounds = event.currentTarget.getBoundingClientRect();
            requestPageChange(touch.clientX - bounds.left > bounds.width / 2 ? 1 : -1);
          }}
        >
          <div className={`jarida-turning-page ${isTurning ? `is-turning turn-${turnDirection}` : ""}`}>
            <div className="jarida-turning-face jarida-turning-front relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:divide-x lg:divide-x-reverse lg:divide-[#d3c49b]">
          
          {/* Center Book Spine Shadow (Desktop only) */}
          <div className="hidden lg:block absolute top-0 bottom-0 right-1/2 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none -mr-4 z-10" />

          {currentItems.map((article: any, idx: number) => (
            <div key={article.id || idx} id={`article-${article.id || idx}`} className="flex flex-col justify-between h-full px-2 md:px-6">
              <div>
                <div className="flex justify-between items-center text-[11px] text-[#775f3a] mb-2 font-sans font-bold">
                  <span className="bg-[#ebd9bc] px-2.5 py-0.5 rounded text-black border border-[#d3c49b]">
                    {article.source || "وكالة الأنباء"}
                  </span>
                  <span>{new Date(article.publishedAt).toLocaleDateString("ar-MA")}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-black mb-3 leading-snug">
                  {article.title}
                </h2>
                {article.imageUrl && (
                  <div className="my-3 overflow-hidden rounded border border-[#d3c49b] bg-[#f0e3cc] shadow-sm">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title} 
                      className="w-full h-44 md:h-52 object-cover filter grayscale contrast-125 hover:grayscale-0 transition duration-500"
                    />
                  </div>
                )}
                <p className="text-sm md:text-base text-[#2c2c2c] leading-relaxed text-justify mb-3 font-serif">
                  {article.summary}
                </p>
                {article.content && (
                  <p className="text-xs md:text-sm text-[#4a4a4a] leading-relaxed text-justify font-serif border-t border-[#e2d5b3] pt-2 mb-4">
                    {article.content}
                  </p>
                )}

                {/* Social Share & Comments component */}
                <ArticleComments article={article} />
              </div>
              <div className="mt-6 pt-2 border-t border-[#e2d5b3] flex justify-between items-center text-xs text-[#776644] font-sans">
                <span>جريدة الأفق الإلكترونية</span>
                <span>صفحة {currentPage * itemsPerPage + idx + 1} من {processedArticles.length}</span>
              </div>
            </div>
          ))}

          {/* Fallback if single item on last spread */}
          {!isMobile && currentItems.length === 1 && (
            <div className="flex flex-col justify-center items-center h-full text-center p-8 text-[#998866] italic">
              <p className="text-base">تابعوا المزيد من المستجدات والتقارير في الإصدارات القادمة.</p>
            </div>
          )}
            </div>
            <div className="jarida-turning-face jarida-turning-back" aria-hidden="true">
              <span className="text-sm md:text-base tracking-[0.25em]">جريدة الأفق</span>
              <span className="text-xs mt-2 opacity-70">إصدار يومي مستقل</span>
            </div>
          </div>
        </div>

        {/* Navigation Arrows & Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black flex justify-between items-center text-xs text-[#444] font-sans">
          <button 
            onClick={prevPage} 
            disabled={currentPage === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded border border-[#c5b48b] bg-[#ebd9bc] hover:bg-[#ded0b1] transition ${currentPage === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          <span className="text-center italic font-serif">
            {isMobile ? 'اسحب أو انقر لقلب الصفحات' : 'انقر على يمين أو يسار الصفحة للقلب'}
          </span>

          <button 
            onClick={nextPage} 
            disabled={currentPage >= totalPages - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded border border-[#c5b48b] bg-[#ebd9bc] hover:bg-[#ded0b1] transition ${currentPage >= totalPages - 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
