import { useState, useEffect, useMemo } from "react";
import { CloudSun, Clock, TrendingUp, ChevronDown, ChevronUp, Bell, MapPin, Sparkles } from "lucide-react";

interface CityInfo {
  name: string;
  temp: number;
  condition: string;
  prayers: {
    fajr: string;
    shuruq: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
}

const MOROCCAN_CITIES: Record<string, CityInfo> = {
  "الرباط": {
    name: "الرباط",
    temp: 21,
    condition: "مشمس مع بعض السحب",
    prayers: { fajr: "05:32", shuruq: "07:05", dhuhr: "12:18", asr: "15:10", maghrib: "17:22", isha: "18:44" },
  },
  "الدار البيضاء": {
    name: "الدار البيضاء",
    temp: 22,
    condition: "أجواء معتدلة",
    prayers: { fajr: "05:35", shuruq: "07:08", dhuhr: "12:21", asr: "15:14", maghrib: "17:25", isha: "18:47" },
  },
  "مراكش": {
    name: "مراكش",
    temp: 25,
    condition: "صحو ودافئ",
    prayers: { fajr: "05:33", shuruq: "07:04", dhuhr: "12:20", asr: "15:18", maghrib: "17:29", isha: "18:49" },
  },
  "طنجة": {
    name: "طنجة",
    temp: 20,
    condition: "نسيم بحري عليل",
    prayers: { fajr: "05:30", shuruq: "07:04", dhuhr: "12:14", asr: "15:04", maghrib: "17:16", isha: "18:40" },
  },
  "فاس": {
    name: "فاس",
    temp: 21,
    condition: "صافٍ وجميل",
    prayers: { fajr: "05:25", shuruq: "06:57", dhuhr: "12:11", asr: "15:05", maghrib: "17:16", isha: "18:38" },
  },
  "أكادير": {
    name: "أكادير",
    temp: 24,
    condition: "مشمس ومثالي",
    prayers: { fajr: "05:38", shuruq: "07:07", dhuhr: "12:26", asr: "15:26", maghrib: "17:36", isha: "18:55" },
  },
  "العيون": {
    name: "العيون",
    temp: 26,
    condition: "صحو ودافئ",
    prayers: { fajr: "05:52", shuruq: "07:18", dhuhr: "12:41", asr: "15:46", maghrib: "17:55", isha: "19:12" },
  },
  "وجدة": {
    name: "وجدة",
    temp: 19,
    condition: "معتدل مع سحب خفيفة",
    prayers: { fajr: "05:15", shuruq: "06:46", dhuhr: "12:01", asr: "14:55", maghrib: "17:07", isha: "18:28" },
  },
};

const FINANCIAL_RATES = [
  { pair: "EUR/MAD", rate: "10.82", change: "+0.03%" },
  { pair: "USD/MAD", rate: "9.95", change: "-0.11%" },
  { pair: "GBP/MAD", rate: "12.74", change: "+0.15%" },
  { pair: "بورصة الدار البيضاء MASI", rate: "14,850", change: "+0.42%" },
];

interface DailyUtilityBarProps {
  breakingNews?: Array<{ id: string | number; title: string; category?: string }>;
  onSelectArticle?: (id: string | number) => void;
}

export default function DailyUtilityBar({
  breakingNews = [],
  onSelectArticle,
}: DailyUtilityBarProps) {
  const [selectedCity, setSelectedCity] = useState("الرباط");
  const [isExpanded, setIsExpanded] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Default breaking items if none passed
  const activeBreaking = useMemo(() => {
    if (breakingNews.length > 0) return breakingNews;
    return [
      { id: "b1", title: "جلالة الملك يدعو لتسريع الأوراش الاستراتيجية الكبرى للمملكة استعداداً لاستحقاقات 2030", category: "شأن وطني" },
      { id: "b2", title: "بنك المغرب يثبت سعر الفائدة الرئيسي في 2.75% وسط مؤشرات تضخم متحكم فيها", category: "اقتصاد" },
      { id: "b3", title: "مشاريع الربط القاري وتحلية مياه البحر تسجل تقدماً قياسياً في الأقاليم الشمالية والجنوبية", category: "تنمية" },
      { id: "b4", title: "المنتخب الوطني المغربي يواصل التحضيرات المكثفة لنهائيات كأس أمم إفريقيا", category: "رياضة" },
    ];
  }, [breakingNews]);

  // Cycle breaking ticker every 5 seconds
  useEffect(() => {
    if (activeBreaking.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % activeBreaking.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [activeBreaking.length]);

  const currentCityData = MOROCCAN_CITIES[selectedCity] || MOROCCAN_CITIES["الرباط"];
  const currentBreaking = activeBreaking[tickerIndex] || activeBreaking[0];

  return (
    <div className="w-full max-w-5xl mx-auto my-1 z-10 font-sans select-none" dir="rtl">
      {/* Top Strip: Breaking News Marquee & Quick Utility Triggers */}
      <div className="bg-[#f2e7d3]/95 border border-[#d6c49e] rounded-lg shadow-2xs px-2.5 py-1.5 flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Breaking News Segment */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px] overflow-hidden">
          <span className="flex items-center gap-1 bg-[#8c2a1e] text-white px-2 py-0.5 rounded font-bold text-[11px] flex-shrink-0 animate-pulse">
            <Bell className="w-3 h-3" />
            عاجل
          </span>
          <button
            type="button"
            onClick={() => onSelectArticle && onSelectArticle(currentBreaking.id)}
            className="text-[#2b2013] hover:text-[#8c2a1e] transition truncate text-right font-medium text-[11.5px] cursor-pointer flex-1"
            title={currentBreaking.title}
          >
            {currentBreaking.title}
          </button>
        </div>

        {/* Quick Weather & City Widget */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-[#e8dac1]/80 px-2 py-0.5 rounded border border-[#cfbd97] text-[11px] text-[#42341d]">
            <CloudSun className="w-3.5 h-3.5 text-[#b08732]" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-[#332615] font-bold cursor-pointer focus:outline-none"
              title="اختر المدينة المغربية"
            >
              {Object.keys(MOROCCAN_CITIES).map((c) => (
                <option key={c} value={c} className="bg-[#fcf7ee] text-black">
                  {c}
                </option>
              ))}
            </select>
            <span className="font-bold text-[#8c2a1e]">{currentCityData.temp}°C</span>
          </div>

          {/* Toggle details drawer */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10.5px] text-[#6b5336] hover:text-black px-2 py-0.5 rounded bg-[#e8dac1]/50 hover:bg-[#dfcca9] transition border border-[#cfbd97] font-bold cursor-pointer"
            title={isExpanded ? "طي الخدمات اليومية" : "عرض مواقيت الصلاة وأسعار الصرف"}
          >
            <span>{isExpanded ? "طي" : "الخدمات اليومية"}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Utility Drawer: Prayer Times & Currency Rates */}
      {isExpanded && (
        <div className="mt-1 p-3 bg-[#faf4e8] border border-[#cfbd97] rounded-xl shadow-md text-xs animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
          {/* Row 1: Prayer Times for Selected City */}
          <div>
            <div className="flex items-center justify-between mb-1.5 border-b border-[#dfcca9] pb-1">
              <span className="font-bold text-[#42341d] flex items-center gap-1 text-[11.5px] font-serif">
                <Clock className="w-3.5 h-3.5 text-[#a8824f]" /> مواقيت الصلاة في مدينة {selectedCity}:
              </span>
              <span className="text-[10px] text-[#7a6446]">حسب توقيت وزارة الأوقاف والشؤون الإسلامية</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
              <div className="bg-[#f0e3cc] p-1.5 rounded-lg border border-[#d6c49e]">
                <div className="text-[10px] text-[#6e583d]">الفجر</div>
                <div className="font-bold text-[#2b2013] text-xs">{currentCityData.prayers.fajr}</div>
              </div>
              <div className="bg-[#f0e3cc] p-1.5 rounded-lg border border-[#d6c49e]">
                <div className="text-[10px] text-[#6e583d]">الشروق</div>
                <div className="font-bold text-[#2b2013] text-xs">{currentCityData.prayers.shuruq}</div>
              </div>
              <div className="bg-[#f0e3cc] p-1.5 rounded-lg border border-[#d6c49e]">
                <div className="text-[10px] text-[#6e583d]">الظهر</div>
                <div className="font-bold text-[#2b2013] text-xs">{currentCityData.prayers.dhuhr}</div>
              </div>
              <div className="bg-[#f0e3cc] p-1.5 rounded-lg border border-[#d6c49e]">
                <div className="text-[10px] text-[#6e583d]">العصر</div>
                <div className="font-bold text-[#2b2013] text-xs">{currentCityData.prayers.asr}</div>
              </div>
              <div className="bg-[#e4d3b4] p-1.5 rounded-lg border border-[#c4ae85] ring-1 ring-[#a88657]/50">
                <div className="text-[10px] font-bold text-[#5c3e1e]">المغرب</div>
                <div className="font-bold text-[#8c2a1e] text-xs">{currentCityData.prayers.maghrib}</div>
              </div>
              <div className="bg-[#f0e3cc] p-1.5 rounded-lg border border-[#d6c49e]">
                <div className="text-[10px] text-[#6e583d]">العشاء</div>
                <div className="font-bold text-[#2b2013] text-xs">{currentCityData.prayers.isha}</div>
              </div>
            </div>
          </div>

          {/* Row 2: Moroccan Financial & Exchange Indicators */}
          <div>
            <div className="flex items-center justify-between mb-1.5 border-b border-[#dfcca9] pb-1">
              <span className="font-bold text-[#42341d] flex items-center gap-1 text-[11.5px] font-serif">
                <TrendingUp className="w-3.5 h-3.5 text-[#3e6b42]" /> مؤشرات بنك المغرب والبورصة:
              </span>
              <span className="text-[10px] text-[#7a6446]">السعر المرجعي الرسمي (الدرهم المغربي)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
              {FINANCIAL_RATES.map((f) => (
                <div key={f.pair} className="bg-[#f0e3cc] p-1.5 rounded-lg border border-[#d6c49e] flex items-center justify-between px-2.5">
                  <span className="text-[10.5px] text-[#4f3e27] font-medium">{f.pair}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[#2b2013] text-xs">{f.rate}</span>
                    <span className={`text-[9.5px] font-bold ${f.change.startsWith("+") ? "text-emerald-700" : "text-red-700"}`}>
                      {f.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
