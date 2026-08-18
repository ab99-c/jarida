import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Volume2, VolumeX, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { data: dailyData, refetch } = trpc.jarida.getDailyEdition.useQuery();
  const refreshMutation = trpc.jarida.refreshFeed.useMutation({
    onSuccess: () => refetch(),
  });
  const articles = dailyData?.articles;

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
    <div className="min-h-screen bg-[#2c2416] text-[#2b2b2b] flex flex-col items-center justify-center p-2 md:p-6 select-none font-serif relative overflow-x-hidden">
      {/* Top minimal header controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3 bg-[#f5e6cc]/90 backdrop-blur px-3 py-1.5 rounded-full shadow-md border border-[#d3c49b]">
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

        {/* Content Spread (Double Page on Desktop/Laptop, Single Page on Mobile) */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 flex-grow items-start md:divide-x md:divide-x-reverse md:divide-[#d3c49b]">
          
          {/* Center Book Spine Shadow (Desktop only) */}
          <div className="hidden md:block absolute top-0 bottom-0 right-1/2 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none -mr-4 z-10" />

          {currentItems.map((article: any, idx: number) => (
            <div key={article.id || idx} className="flex flex-col justify-between h-full px-2 md:px-6">
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
                <p className="text-sm md:text-base text-[#2c2c2c] leading-relaxed text-justify mb-4 font-serif">
                  {article.summary}
                </p>
                {article.content && (
                  <p className="text-xs md:text-sm text-[#4a4a4a] leading-relaxed text-justify font-serif border-t border-[#e2d5b3] pt-2">
                    {article.content}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-2 border-t border-[#e2d5b3] flex justify-between items-center text-xs text-[#776644] font-sans">
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
