import { useState, useEffect } from "react";
import { BarChart3, CheckCircle2, X, Vote, Users, MessageSquare } from "lucide-react";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "jarida_daily_poll_vote_v1";

const DEFAULT_POLL = {
  id: "poll-2026-11",
  question: "كيف تقيّم وتيرة إنجاز المشاريع الاستراتيجية الكبرى بالمغرب (الربط القاري، الملاعب، وتحلية المياه) استعداداً لاستحقاقات 2030؟",
  category: "استطلاع وطني",
  totalVotes: 14820,
  options: [
    { id: "opt-1", text: "ممتازة وتسير بوتيرة أسرع من المتوقع 🚀", votes: 8940 },
    { id: "opt-2", text: "جيدة ولكن تحتاج تكثيف التنسيق الميداني ⚙️", votes: 4420 },
    { id: "opt-3", text: "متوسطة وأتطلع للمزيد من الشفافية والتسريع ⏳", votes: 1460 },
  ],
};

export default function PollModal({ isOpen, onClose }: PollModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [pollData, setPollData] = useState(DEFAULT_POLL);

  useEffect(() => {
    try {
      const savedVote = localStorage.getItem(STORAGE_KEY);
      if (savedVote) {
        setSelectedOption(savedVote);
        setHasVoted(true);
      }
    } catch {}
  }, []);

  if (!isOpen) return null;

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    setSelectedOption(optionId);
    setHasVoted(true);

    const updatedOptions = pollData.options.map((opt) =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    const updatedPoll = {
      ...pollData,
      totalVotes: pollData.totalVotes + 1,
      options: updatedOptions,
    };
    setPollData(updatedPoll);

    try {
      localStorage.setItem(STORAGE_KEY, optionId);
    } catch {}
  };

  const calculatePercentage = (votes: number) => {
    if (pollData.totalVotes === 0) return 0;
    return Math.round((votes / pollData.totalVotes) * 100);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-[#faf5eb] text-[#2c2416] w-full max-w-lg rounded-2xl shadow-2xl border-2 border-[#bfa87a] overflow-hidden flex flex-col p-5 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#1b120a] border border-[#a8824f]/40 text-[#eddcc4] hover:text-white hover:bg-[#3d2716] transition flex items-center justify-center cursor-pointer shadow-md"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#42341d] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37]">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base font-serif text-[#2c2416]">استطلاع رأي قراء الأفق</h3>
            <p className="text-[11px] text-[#7a6446]">صوتك يهمنا في قضايا الشأن العام</p>
          </div>
        </div>

        {/* Question Box */}
        <div className="bg-[#f0e4cf] border border-[#dfcca9] rounded-xl p-3.5 mb-4">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#42341d] text-[#f5ebd7] inline-block mb-1.5">
            سؤال العدد
          </span>
          <h4 className="font-bold text-xs sm:text-sm text-[#2b2013] leading-relaxed font-serif">
            {pollData.question}
          </h4>
        </div>

        {/* Options / Results */}
        <div className="space-y-2.5 mb-4">
          {pollData.options.map((option) => {
            const pct = calculatePercentage(option.votes);
            const isUserChoice = selectedOption === option.id;

            return (
              <div
                key={option.id}
                onClick={() => !hasVoted && handleVote(option.id)}
                className={`p-3 rounded-xl border transition relative overflow-hidden ${
                  !hasVoted
                    ? "bg-white hover:bg-[#fbf7f0] border-[#d8c8a5] hover:border-[#8c7348] cursor-pointer"
                    : isUserChoice
                      ? "bg-[#faf2e3] border-[#8c7348] ring-1 ring-[#8c7348]"
                      : "bg-white/80 border-[#e5d8be]"
                }`}
              >
                {/* Progress bar background on voted */}
                {hasVoted && (
                  <div
                    className={`absolute inset-y-0 right-0 transition-all duration-700 ease-out opacity-25 ${
                      isUserChoice ? "bg-[#8c2a1e]" : "bg-[#c9b78e]"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {hasVoted && isUserChoice && (
                      <CheckCircle2 className="w-4 h-4 text-[#8c2a1e] flex-shrink-0" />
                    )}
                    <span className={`font-medium ${isUserChoice ? "font-bold text-[#8c2a1e]" : "text-[#2c2416]"}`}>
                      {option.text}
                    </span>
                  </div>

                  {hasVoted && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="font-bold text-xs text-[#2b2013]">{pct}%</span>
                      <span className="text-[10px] text-[#7a6446]">({option.votes.toLocaleString()})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Votes info */}
        <div className="flex items-center justify-between text-xs text-[#7a6446] border-t border-[#dfcca9] pt-2.5 px-1">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>مجموع المصوتين: <strong>{pollData.totalVotes.toLocaleString()}</strong> مشارك</span>
          </div>
          {hasVoted ? (
            <span className="text-[11px] font-bold text-emerald-800">✓ تم تسجيل تصويتك</span>
          ) : (
            <span className="text-[11px] text-[#8c7348] font-bold">اضغط على الخيار للتصويت</span>
          )}
        </div>
      </div>
    </div>
  );
}
