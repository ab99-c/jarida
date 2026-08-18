import React, { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Volume2, VolumeX, Sparkles, RefreshCw } from "lucide-react";

export default function Home() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: articles, isLoading, refetch } = (trpc as any).jarida.list.useQuery();
  const refreshMutation = (trpc as any).jarida.refresh.useMutation({
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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
      summary: "تشهد الدبلوماسية المغربية زخماً ملحوظاً بفضل الانتصارات المتتالية في ملف الصحراء المغربية، اعتراف كولومبيا الأخير يضاف إلى سلسلة من المواقف الدولية الداعمة للوحدة الترابية للمملكة، مما يكرس وجاهة الطروحات المغربية ويعزز الاستقرار الإقليمي.",
      content: "في خطوة تعكس عمق ومتانة العلاقات الثنائية، أعلنت بوغوتا رسمياً دعمها الكامل لمبادرة الحكم الذاتي تحت السيادة المغربية. وأكد المحللون أن هذا الموقف يمثل تحولاً استراتيجياً في أمريكا اللاتينية...",
      source: "هسبريس",
      publishedAt: new Date(),
      imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "انطلاقة قوية لموسم الفلاحة والري الحديث بالمغرب",
      summary: "تطلق وزارة الفلاحة برامج جديدة لدعم السقي الموضعي واستعمال الطاقات المتجددة في الآبار الفلاحية لضمان الأمن المائي والغذائي لمواجهة تحديات الجفاف.",
      content: "تعرف المناطق الفلاحية في سوس وسايس تعبئة شاملة لتنزيل الجيل الجديد من المشاريع المرتبطة بالاقتصاد في الماء والتحول الرقمي الفلاحي...",
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

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      playFlipSound();
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      playFlipSound();
      setCurrentPage(prev => prev - 1);
    }
  };

  const currentItems = processedArticles.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[#f4ecd8] text-[#2b2b2b] flex flex-col items-center justify-center p-2 md:p-6 select-none font-serif relative overflow-hidden">
      {/* Top minimal header controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3 bg-[#e6dcbe]/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-[#d3c49b]">
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="flex items-center gap-1.5 text-xs text-[#554a32] hover:text-black transition"
          title="تحديث الأخبار الآن"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          <span>تحديث</span>
        </button>
        <span className="text-xs text-[#a39371]">|</span>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="flex items-center gap-1 text-xs text-[#554a32] hover:text-black transition"
          title={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Newspaper container */}
      <div 
        className="w-full max-w-5xl bg-[#fcf8ec] shadow-2xl border border-[#d8ccaa] rounded-sm p-4 md:p-10 relative flex flex-col justify-between min-h-[80vh] md:min-h-[85vh] cursor-pointer transition-all duration-300"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x > rect.width / 2) {
            nextPage();
          } else {
            prevPage();
          }
        }}
      >
        {/* Masthead */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-center text-xs text-[#666] mb-1 px-2">
            <span>الثلاثاء، 18 غشت 2026</span>
            <span>الإصدار اليومي الشامل</span>
            <span>العدد 1</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black font-serif">
            جريدة الأفق
          </h1>
          <p className="text-xs tracking-widest text-[#555] uppercase mt-1">
            صوت الحقيقة والخبر اليقين • يومية مستقلة
          </p>
        </div>

        {/* Content Spread */}
        <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-8 md:gap-12 flex-grow items-start divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#e2d5b3]`}>
          {currentItems.map((article: any, idx: number) => (
            <div key={article.id || idx} className="flex flex-col justify-between h-full pt-4 md:pt-0 md:px-4">
              <div>
                <div className="flex justify-between items-center text-[11px] text-[#887755] mb-2 font-sans font-semibold">
                  <span className="bg-[#e6dcbe] px-2 py-0.5 rounded text-black">{article.source || "وكالة الأنباء"}</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString("ar-MA")}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-black mb-3 leading-snug">
                  {article.title}
                </h2>
                {article.imageUrl && (
                  <div className="my-3 overflow-hidden rounded border border-[#d8ccaa] bg-[#f0e6cb]">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title} 
                      className="w-full h-48 md:h-56 object-cover filter grayscale contrast-125 hover:grayscale-0 transition duration-500"
                    />
                  </div>
                )}
                <p className="text-sm md:text-base text-[#333] leading-relaxed text-justify mb-4 font-serif">
                  {article.summary}
                </p>
                {article.content && (
                  <p className="text-xs md:text-sm text-[#555] leading-relaxed text-justify font-serif border-t border-[#eee2c0] pt-2">
                    {article.content}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-2 border-t border-[#e2d5b3] flex justify-between items-center text-xs text-[#776644]">
                <span>جريدة الأفق الإلكترونية</span>
                <span>صفحة {currentPage * itemsPerPage + idx + 1}</span>
              </div>
            </div>
          ))}

          {/* Fallback if odd items on desktop */}
          {!isMobile && currentItems.length === 1 && (
            <div className="flex flex-col justify-center items-center h-full text-center p-8 text-[#998866] italic border-r border-[#e2d5b3]">
              <p className="text-lg">تابعوا المزيد من التفاصيل في العدد القادم...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black flex justify-between items-center text-xs text-[#444]">
          <span>© 2026 جريدة الأفق - جميع الحقوق محفوظة</span>
          <span className="text-center hidden md:block italic">انقر يميناً أو يساراً لقلب الصفحات</span>
          <span>الطبعة الأولى</span>
        </div>
      </div>
    </div>
  );
}
