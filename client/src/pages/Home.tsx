import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: articles = [], isLoading } = trpc.jarida.getArticles.useQuery();
  const [currentSheet, setCurrentSheet] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  const sheetsData = useMemo(() => {
    if (!articles || articles.length === 0) {
      return [
        {
          front: {
            title: "جريدة الأفق",
            subtitle: "الإصدار اليومي الشامل",
            date: "الثلاثاء 18 غشت 2026",
            edition: "العدد 01 - السنة الأولى",
            leadTitle: "انطلاقة الصحيفة الرقمية بتجربة قراءة عصرية على شكل ورقي تقليدي",
            leadSummary: "تطلق مؤسسة الأفق نسختها الرقمية المتفردة المعززة بخلاصات يومية حية من أهم المنابر الإعلامية المغربية والعربية، مع تقنيات قلب الورق الواقعية.",
            image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80",
            sectionTitle: undefined,
            articles: [
              { title: "تعزيز الشراكات الإستراتيجية", summary: "آفاق واعدة للتعاون الاقتصادي والدبلوماسي بين المملكة ومحيطها الإقليمي." },
              { title: "رهانات التنمية المستدامة", summary: "تقارير حول نجاح المشاريع الكبرى للطاقة المتجددة والبنيات التحتية." }
            ]
          },
          back: {
            sectionTitle: "ملف الشأن المغربي والعربي",
            articles: [
              { title: "تطورات الساحة الوطنية", summary: "متابعة دقيقة لآخر مستجدات الأوراش المفتوحة والإصلاحات الهيكلية." },
              { title: "ديناميكية الدبلوماسية الاقتصادية", summary: "استعراض لأبرز الاتفاقيات والشراكات التي تجمع المغرب بشركائه الدوليين." }
            ],
            image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"
          }
        }
      ];
    }

    const sheets = [];
    for (let i = 0; i < articles.length; i += 4) {
      const chunk = articles.slice(i, i + 4);
      sheets.push({
        front: {
          title: i === 0 ? "جريدة الأفق" : undefined,
          subtitle: i === 0 ? "الإصدار اليومي الشامل" : undefined,
          date: new Date().toLocaleDateString('ar-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          edition: `العدد ${Math.floor(i/4) + 1}`,
          leadTitle: chunk[0]?.title || "مستجدات الساعة",
          leadSummary: chunk[0]?.summary || "",
          image: chunk[0]?.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80",
          sectionTitle: i > 0 ? "متابعات إخبارية" : undefined,
          articles: chunk.slice(1, 3).map(a => ({ title: a.title, summary: a.summary }))
        },
        back: {
          sectionTitle: "ملف الأخبار العربية والدولية",
          articles: chunk.slice(3, 5).map(a => ({ title: a.title, summary: a.summary })),
          image: chunk[1]?.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"
        }
      });
    }
    return sheets;
  }, [articles]);

  const totalSheets = sheetsData.length;

  const playFlipSound = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/foley/paper_page_turn.ogg");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleNext = () => {
    if (currentSheet < totalSheets) {
      playFlipSound();
      setCurrentSheet(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSheet > 0) {
      playFlipSound();
      setCurrentSheet(prev => prev - 1);
    }
  };

  const handleBookClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext(); // Swipe left -> Next page
      } else {
        handlePrev(); // Swipe right -> Prev page
      }
    }
  };

  return (
    <div
      className="fb-wrapper"
      onClick={handleBookClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8b4513]" />
          <p className="text-sm font-medium">جاري تحضير طبعة الأفق اليومية...</p>
        </div>
      ) : (
        <div className="fb-book">
          <div className="fb-spine"></div>
          {sheetsData.map((sheet, idx) => {
            const isFlipped = idx < currentSheet;
            return (
              <div
                key={idx}
                className={`fb-sheet ${isFlipped ? "flipped" : ""}`}
                style={{ zIndex: totalSheets - idx }}
              >
                {/* Front Face */}
                <div className="fb-face">
                  <div className="fb-shadow"></div>
                  <div className="h-full flex flex-col justify-between pb-8">
                    {sheet.front.title && (
                      <div className="np-logo">
                        <h1 className="np-title">{sheet.front.title}</h1>
                        <div className="np-subtitle">{sheet.front.subtitle}</div>
                      </div>
                    )}
                    {sheet.front.date && (
                      <div className="np-meta">
                        <span>{sheet.front.edition}</span>
                        <span>{sheet.front.date}</span>
                      </div>
                    )}

                    {sheet.front.sectionTitle && (
                      <h2 className="text-xl font-bold font-serif mb-3 border-b-2 border-stone-800 pb-1">
                        {sheet.front.sectionTitle}
                      </h2>
                    )}

                    <div className="space-y-3 flex-1 overflow-hidden">
                      <h3 className="np-headline">{sheet.front.leadTitle}</h3>
                      {sheet.front.image && (
                        <img src={sheet.front.image} alt="خبر رئيسي" className="np-image" />
                      )}
                      <p className="np-summary">{sheet.front.leadSummary}</p>

                      <div className="np-grid">
                        {sheet.front.articles?.map((art, aIdx) => (
                          <div key={aIdx} className="np-article-card">
                            <h4>{art.title}</h4>
                            <p>{art.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="np-footer-blue">
                      <span>جريدة الأفق اليومية</span>
                      <span>صفحة {idx * 2 + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Back Face */}
                <div className="fb-face fb-back">
                  <div className="fb-shadow"></div>
                  <div className="h-full flex flex-col justify-between pb-8">
                    <h2 className="text-xl font-bold font-serif mb-3 border-b-2 border-stone-800 pb-1">
                      {sheet.back.sectionTitle}
                    </h2>

                    {sheet.back.image && (
                      <img src={sheet.back.image} alt="صورة توضيحية" className="np-image" />
                    )}

                    <div className="space-y-4 flex-1 overflow-hidden">
                      {sheet.back.articles?.map((art, aIdx) => (
                        <div key={aIdx} className="np-article-card">
                          <h4 className="text-lg font-bold">{art.title}</h4>
                          <p className="text-sm leading-relaxed">{art.summary}</p>
                        </div>
                      ))}
                    </div>

                    <div className="np-footer-blue">
                      <span>جريدة الأفق اليومية</span>
                      <span>صفحة {idx * 2 + 2}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
