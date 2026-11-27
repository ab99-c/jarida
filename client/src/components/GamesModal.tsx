import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Trophy,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Timer,
  Sparkles,
  Flame,
  Gamepad2,
  Grid3X3,
  Puzzle,
  PenTool,
  Check,
  AlertCircle
} from "lucide-react";

interface GamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "sudoku" | "puzzle" | "completion";
}

/* =========================================================
   1. SUDOKU DATA & LOGIC
   ========================================================= */
interface SudokuPreset {
  difficulty: "easy" | "medium" | "hard";
  label: string;
  initial: (number | null)[][];
  solution: number[][];
}

const SUDOKU_PRESETS: SudokuPreset[] = [
  {
    difficulty: "easy",
    label: "سهل 🟢",
    initial: [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
  {
    difficulty: "medium",
    label: "متوسط 🟡",
    initial: [
      [null, 2, null, 6, null, 8, null, null, null],
      [5, 8, null, null, null, 9, 7, null, null],
      [null, null, null, null, 4, null, null, null, null],
      [3, 7, null, null, null, null, 5, null, null],
      [6, null, null, null, null, null, null, null, 4],
      [null, null, 8, null, null, null, null, 1, 3],
      [null, null, null, null, 2, null, null, null, null],
      [null, null, 9, 8, null, null, null, 3, 6],
      [null, null, null, 3, null, 6, null, 9, null],
    ],
    solution: [
      [1, 2, 3, 6, 7, 8, 9, 4, 5],
      [5, 8, 4, 2, 3, 9, 7, 6, 1],
      [9, 6, 7, 1, 4, 5, 3, 2, 8],
      [3, 7, 2, 4, 6, 1, 5, 8, 9],
      [6, 9, 1, 5, 8, 3, 2, 7, 4],
      [4, 5, 8, 7, 9, 2, 6, 1, 3],
      [8, 3, 6, 9, 2, 4, 1, 5, 7],
      [2, 1, 9, 8, 5, 7, 4, 3, 6],
      [7, 4, 5, 3, 1, 6, 8, 9, 2],
    ],
  },
  {
    difficulty: "hard",
    label: "تحدي 🔴",
    initial: [
      [null, null, null, 6, null, null, 4, null, null],
      [7, null, null, null, null, 3, 6, null, null],
      [null, null, null, null, 9, 1, null, 8, null],
      [null, null, null, null, null, null, null, null, null],
      [null, 5, null, 1, 8, null, null, null, 3],
      [null, null, null, 3, null, 6, null, 4, 5],
      [null, 4, null, 2, null, null, null, 6, null],
      [9, null, 3, null, null, null, null, null, null],
      [null, 2, null, null, null, null, 1, null, null],
    ],
    solution: [
      [5, 8, 1, 6, 7, 2, 4, 3, 9],
      [7, 9, 2, 8, 4, 3, 6, 5, 1],
      [3, 6, 4, 5, 9, 1, 7, 8, 2],
      [4, 3, 8, 9, 5, 7, 2, 1, 6],
      [2, 5, 6, 1, 8, 4, 9, 7, 3],
      [1, 7, 9, 3, 2, 6, 8, 4, 5],
      [8, 4, 5, 2, 1, 9, 3, 6, 7],
      [9, 1, 3, 7, 6, 8, 5, 2, 4],
      [6, 2, 7, 4, 3, 5, 1, 9, 8],
    ],
  },
];

/* =========================================================
   2. SENTENCE & PROVERB COMPLETION DATA (إكمال الجمل والأمثال)
   ========================================================= */
interface SentenceItem {
  id: number;
  prompt: string;
  missing: string;
  options: string[];
  explanation: string;
  category: "أمثال مغربية" | "حكم وتراث" | "أقوال مأثورة";
}

const SENTENCE_ITEMS: SentenceItem[] = [
  {
    id: 1,
    prompt: "اللّي فات مات، واللّي جاي [...]",
    missing: "ترجاه",
    options: ["ترجاه", "تنساه", "تلقاه", "تخشاه"],
    explanation: "مثل شعبي مغربي يدعو للتفاؤل بالمستقبل وطي صفحة الماضي.",
    category: "أمثال مغربية",
  },
  {
    id: 2,
    prompt: "ما حك لك غير ظفرك، وما بكى عليك غير [...]",
    missing: "شفرك",
    options: ["شفرك", "خوك", "جارك", "صاحبك"],
    explanation: "تعبير مغربي أصيل يشدد على الاعتماد على النفس عند الشدائد.",
    category: "أمثال مغربية",
  },
  {
    id: 3,
    prompt: "دير الخير وانساه، ودير الشر [...]",
    missing: "وتفكرو",
    options: ["وتفكرو", "وخافو", "وطلبو", "وتجنبو"],
    explanation: "حكمة تدعو لفعل الخير دون انتظار جزاء، والحذر من عواقب الإساءة.",
    category: "حكم وتراث",
  },
  {
    id: 4,
    prompt: "قطرة بقطرة كيحمل [...]",
    missing: "الواد",
    options: ["الواد", "البحر", "الكاس", "السد"],
    explanation: "مثل مغربي شهير عن أهمية التراكم والصبر لتحقيق الإنجازات الكبرى.",
    category: "أمثال مغربية",
  },
  {
    id: 5,
    prompt: "الحر بالغمزة، والعبد [...]",
    missing: "بالدبزة",
    options: ["بالدبزة", "بالكلمة", "بالسوط", "بالصبر"],
    explanation: "حكمة شائعة في الموروث المغربي تدل على الفطنة وسرعة البديهة.",
    category: "أمثال مغربية",
  },
  {
    id: 6,
    prompt: "الصامت غلب [...]",
    missing: "الناطق",
    options: ["الناطق", "العالم", "الجاهل", "الظالم"],
    explanation: "قيمة الصمت والحكمة والتأني في مواجهة لغط الكلام.",
    category: "حكم وتراث",
  },
  {
    id: 7,
    prompt: "اللّي بغا العسل يصبر [...] النحل",
    missing: "لقريص",
    options: ["لقريص", "لصوت", "لشهد", "لطيران"],
    explanation: "لا نجاح ولا ثمار طيبة دون تحمل المصاعب والجهد المبذول.",
    category: "أمثال مغربية",
  },
  {
    id: 8,
    prompt: "الماء والشطابة حتى [...]",
    missing: "لقاع البحر",
    options: ["لقاع البحر", "لباب الدار", "لراس الحومة", "لوسط الغابة"],
    explanation: "مثل مغربي مرح يعبر عن الاستغناء التام عن من لا يقدر العشرة.",
    category: "أمثال مغربية",
  },
  {
    id: 9,
    prompt: "العجلة من الشيطان، والتأني من [...]",
    missing: "الرحمن",
    options: ["الرحمن", "الحكمة", "العقل", "الإنسان"],
    explanation: "حكمة تراثية إسلامية تؤكد على التروي وحسن التدبير.",
    category: "أقوال مأثورة",
  },
  {
    id: 10,
    prompt: "كول مع الديب وبكي مع [...]",
    missing: "السراح",
    options: ["السراح", "النعاج", "الكلاب", "الغنم"],
    explanation: "يضرب للشخص المنافق الذي يماشي كل طرف لصالحه الخاص.",
    category: "أمثال مغربية",
  },
];

/* =========================================================
   3. PUZZLE DATA (SLIDING TILE PUZZLE / بازل الأفق 3x3)
   ========================================================= */
const PUZZLE_IMAGES = [
  {
    id: "hassan",
    title: "صومعة حسان التاريخية - الرباط",
    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "riad",
    title: "الرياض والأصالة المعمارية المغربية",
    url: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "desert",
    title: "رمال الصحراء المغربية والواحات",
    url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80",
  },
];

export default function GamesModal({ isOpen, onClose, defaultTab = "sudoku" }: GamesModalProps) {
  const [activeTab, setActiveTab] = useState<"sudoku" | "puzzle" | "completion">(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  /* ----------------- SUDOKU STATE ----------------- */
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const currentPreset = useMemo(
    () => SUDOKU_PRESETS.find((p) => p.difficulty === selectedDifficulty) || SUDOKU_PRESETS[0],
    [selectedDifficulty]
  );

  const [board, setBoard] = useState<(number | null)[][]>(() =>
    currentPreset.initial.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [sudokuTime, setSudokuTime] = useState(0);
  const [isSudokuSolved, setIsSudokuSolved] = useState(false);
  const [sudokuMessage, setSudokuMessage] = useState<string | null>(null);

  // Reset Sudoku when difficulty changes
  useEffect(() => {
    setBoard(currentPreset.initial.map((row) => [...row]));
    setSelectedCell(null);
    setSudokuTime(0);
    setIsSudokuSolved(false);
    setSudokuMessage(null);
  }, [currentPreset]);

  // Sudoku Timer
  useEffect(() => {
    if (!isOpen || activeTab !== "sudoku" || isSudokuSolved) return;
    const interval = setInterval(() => setSudokuTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, isSudokuSolved]);

  const handleCellClick = (r: number, c: number) => {
    if (currentPreset.initial[r][c] !== null) return; // Initial cells are locked
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num: number | null) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (currentPreset.initial[r][c] !== null) return;

    setBoard((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = num;
      return next;
    });

    setSudokuMessage(null);
  };

  const handleCheckSudoku = () => {
    let allFilled = true;
    let hasMistake = false;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (val === null) {
          allFilled = false;
        } else if (val !== currentPreset.solution[r][c]) {
          hasMistake = true;
        }
      }
    }

    if (hasMistake) {
      setSudokuMessage("⚠️ هناك أرقام غير صحيحة، راجع الحل وحاول مجدداً.");
    } else if (!allFilled) {
      setSudokuMessage("✨ كل الأرقام الموضوعة صحيحة حتى الآن! واصل إكمال باقي الخانات.");
    } else {
      setIsSudokuSolved(true);
      setSudokuMessage("🎉 مبارك! حللت سودوكو اليوم بنجاح تام وبذكاء خارق!");
    }
  };

  const handleResetSudoku = () => {
    setBoard(currentPreset.initial.map((row) => [...row]));
    setSelectedCell(null);
    setSudokuTime(0);
    setIsSudokuSolved(false);
    setSudokuMessage(null);
  };

  /* ----------------- SENTENCE COMPLETION STATE ----------------- */
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [completionScore, setCompletionScore] = useState(0);
  const [completionStreak, setCompletionStreak] = useState(0);

  const currentSentence = SENTENCE_ITEMS[currentSentenceIndex];

  const handleSelectOption = (opt: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(opt);
    setIsAnswerChecked(true);

    if (opt === currentSentence.missing) {
      setCompletionScore((s) => s + 10);
      setCompletionStreak((st) => st + 1);
    } else {
      setCompletionStreak(0);
    }
  };

  const handleNextSentence = () => {
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setCurrentSentenceIndex((prev) => (prev + 1) % SENTENCE_ITEMS.length);
  };

  /* ----------------- SLIDING PUZZLE STATE ----------------- */
  const [puzzleImageIdx, setPuzzleImageIdx] = useState(0);
  // Grid 3x3: array of 9 elements (numbers 0..7 and 8 as empty space)
  const [tiles, setTiles] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  const [puzzleMoves, setPuzzleMoves] = useState(0);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [showPuzzleOriginal, setShowPuzzleOriginal] = useState(false);

  const activeImage = PUZZLE_IMAGES[puzzleImageIdx];

  const shuffleTiles = useCallback(() => {
    // Generate solvable 3x3 permutation
    let arr = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let emptyIdx = 8;
    // Perform 80 random valid moves to guarantee solvability
    for (let step = 0; step < 80; step++) {
      const neighbors: number[] = [];
      const row = Math.floor(emptyIdx / 3);
      const col = emptyIdx % 3;

      if (row > 0) neighbors.push(emptyIdx - 3); // Up
      if (row < 2) neighbors.push(emptyIdx + 3); // Down
      if (col > 0) neighbors.push(emptyIdx - 1); // Left
      if (col < 2) neighbors.push(emptyIdx + 1); // Right

      const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];
      arr[emptyIdx] = arr[swapWith];
      arr[swapWith] = 0;
      emptyIdx = swapWith;
    }

    setTiles(arr);
    setPuzzleMoves(0);
    setIsPuzzleSolved(false);
  }, []);

  useEffect(() => {
    shuffleTiles();
  }, [puzzleImageIdx, shuffleTiles]);

  const handleTileClick = (index: number) => {
    if (isPuzzleSolved) return;
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIdx / 3);
    const emptyCol = emptyIdx % 3;

    const isAdjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const nextTiles = [...tiles];
      nextTiles[emptyIdx] = tiles[index];
      nextTiles[index] = 0;
      setTiles(nextTiles);
      setPuzzleMoves((m) => m + 1);

      // Check win condition (1,2,3,4,5,6,7,8,0)
      const solved = nextTiles.slice(0, 8).every((val, idx) => val === idx + 1);
      if (solved && nextTiles[8] === 0) {
        setIsPuzzleSolved(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-[#faf6ee] text-[#2c2416] w-full max-w-2xl rounded-2xl shadow-2xl border-2 border-[#bfa87a] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#42341d] text-[#f4ebdc] px-4 py-3 flex items-center justify-between border-b border-[#bfa87a]">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#dfcca9]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base font-serif flex items-center gap-2">
                <span>ألعاب وتسلية الأفق</span>
                <span className="text-[10px] bg-[#ecdcc5]/20 text-[#eddcc4] px-2 py-0.5 rounded font-sans">
                  استراحة القارئ ☕
                </span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#ddcfb4] bg-[#efe5cf] text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("sudoku")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === "sudoku"
                ? "border-[#8c7348] bg-[#faf6ee] text-[#382b17] shadow-xs"
                : "border-transparent text-[#6d5b3d] hover:bg-[#e6d9bf]"
            }`}
          >
            <Grid3X3 className="w-4 h-4 text-[#8c7348]" />
            <span>سودوكو اليوم 🔢</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completion")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === "completion"
                ? "border-[#8c7348] bg-[#faf6ee] text-[#382b17] shadow-xs"
                : "border-transparent text-[#6d5b3d] hover:bg-[#e6d9bf]"
            }`}
          >
            <PenTool className="w-4 h-4 text-[#2e6b5e]" />
            <span>إكمال الأمثال والجمل ✍️</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("puzzle")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === "puzzle"
                ? "border-[#8c7348] bg-[#faf6ee] text-[#382b17] shadow-xs"
                : "border-transparent text-[#6d5b3d] hover:bg-[#e6d9bf]"
            }`}
          >
            <Puzzle className="w-4 h-4 text-[#b38f39]" />
            <span>بازل الصور 🧩</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-sans">
          {/* =========================================
              TAB 1: SUDOKU
             ========================================= */}
          {activeTab === "sudoku" && (
            <div className="space-y-4">
              {/* Difficulty & Stats bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-[#f2e7d3] p-2.5 rounded-xl border border-[#d8c8a5] text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#443521]">المستوى:</span>
                  {(["easy", "medium", "hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
                        selectedDifficulty === diff
                          ? "bg-[#42341d] text-[#faf6ee] shadow-2xs"
                          : "bg-white/80 text-[#54432a] hover:bg-white"
                      }`}
                    >
                      {diff === "easy" ? "سهل" : diff === "medium" ? "متوسط" : "تحدي"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 font-mono font-bold text-[#443521]">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-[#8c7348]" />
                    {formatTime(sudokuTime)}
                  </span>
                  <button
                    type="button"
                    onClick={handleResetSudoku}
                    className="p-1 text-[#66543b] hover:text-black rounded cursor-pointer"
                    title="إعادة تعيين اللعبة"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sudoku 9x9 Grid */}
              <div className="flex justify-center">
                <div className="grid grid-cols-9 border-2 border-[#42341d] bg-white rounded-lg shadow-md overflow-hidden max-w-[360px] w-full">
                  {board.map((row, r) =>
                    row.map((val, c) => {
                      const isInitial = currentPreset.initial[r][c] !== null;
                      const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                      const isInSameRowOrCol =
                        selectedCell && (selectedCell[0] === r || selectedCell[1] === c);

                      // 3x3 block borders
                      const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? "border-b-2 border-b-[#42341d]" : "border-b border-b-[#dfd2b5]";
                      const borderLeft = (c + 1) % 3 === 0 && c !== 8 ? "border-l-2 border-l-[#42341d]" : "border-l border-l-[#dfd2b5]";

                      return (
                        <button
                          key={`${r}-${c}`}
                          type="button"
                          onClick={() => handleCellClick(r, c)}
                          className={`aspect-square flex items-center justify-center font-bold text-sm sm:text-base font-serif transition select-none ${borderBottom} ${borderLeft} ${
                            isSelected
                              ? "bg-[#ecd9b5] text-[#2c1d09] ring-2 ring-[#8c7348] z-10"
                              : isInitial
                              ? "bg-[#faf6ee] text-[#2c1d09] font-black"
                              : val !== null
                              ? "bg-white text-[#1a5276]"
                              : isInSameRowOrCol
                              ? "bg-[#fdfaf5]"
                              : "bg-white hover:bg-[#fcf8f0]"
                          }`}
                        >
                          {val || ""}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Number Pad for Input */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumberInput(num)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#efe5cf] text-[#42341d] font-serif font-black text-sm sm:text-base hover:bg-[#dfcaa8] hover:text-black border border-[#cfbd97] shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleNumberInput(null)}
                    className="px-2.5 h-8 sm:h-9 rounded-lg bg-[#f9e2e2] text-[#8c2a1e] font-sans font-bold text-xs hover:bg-[#f2cccc] border border-[#d6a5a5] shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    مسح ⌫
                  </button>
                </div>

                {/* Validation and help actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCheckSudoku}
                    className="px-4 py-1.5 rounded-lg bg-[#2e6b5e] hover:bg-[#235349] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تحقق من الحل 🔍</span>
                  </button>
                </div>
              </div>

              {/* Sudoku feedback message */}
              {sudokuMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-sans text-center border animate-in fade-in duration-200 ${
                    isSudokuSolved
                      ? "bg-green-100 text-green-900 border-green-300 font-bold"
                      : sudokuMessage.includes("⚠️")
                      ? "bg-red-50 text-red-800 border-red-200"
                      : "bg-[#eaf4ed] text-[#1e5233] border-[#a5d1b3]"
                  }`}
                >
                  {sudokuMessage}
                </div>
              )}
            </div>
          )}

          {/* =========================================
              TAB 2: SENTENCE & PROVERB COMPLETION
             ========================================= */}
          {activeTab === "completion" && (
            <div className="space-y-4 max-w-lg mx-auto">
              {/* Header stats */}
              <div className="flex items-center justify-between bg-[#f2e7d3] p-2.5 rounded-xl border border-[#d8c8a5] text-xs font-sans">
                <div className="flex items-center gap-1.5 font-bold text-[#443521]">
                  <Trophy className="w-4 h-4 text-[#b38f39]" />
                  <span>النقاط: {completionScore}</span>
                </div>
                {completionStreak > 1 && (
                  <div className="flex items-center gap-1 text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded-full">
                    <Flame className="w-3.5 h-3.5" />
                    <span>سلسلة إجابات صحيحة: {completionStreak} 🔥</span>
                  </div>
                )}
                <span className="text-[#736043]">
                  سؤال {currentSentenceIndex + 1} من {SENTENCE_ITEMS.length}
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-white p-5 rounded-2xl border-2 border-[#dfcca9] shadow-sm space-y-4 text-center">
                <span className="inline-block px-2.5 py-0.5 bg-[#f5ecda] text-[#705634] rounded-full text-[11px] font-bold border border-[#e2d5b6]">
                  {currentSentence.category}
                </span>

                <h4 className="text-base sm:text-lg font-serif font-black text-[#2e2313] leading-relaxed">
                  {currentSentence.prompt}
                </h4>

                <p className="text-xs text-[#806f52]">
                  اختر الكلمة المناسبة لإكمال الجملة أو المثل الشعبي بدقة:
                </p>

                {/* Options Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {currentSentence.options.map((opt) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = opt === currentSentence.missing;

                    let btnClass = "bg-[#faf6ee] text-[#3d2f1c] border-[#cfbd97] hover:bg-[#f2e6ce]";
                    if (isAnswerChecked) {
                      if (isCorrect) {
                        btnClass = "bg-green-600 text-white border-green-700 font-black ring-2 ring-green-300";
                      } else if (isSelected) {
                        btnClass = "bg-red-500 text-white border-red-600 font-bold";
                      } else {
                        btnClass = "bg-gray-100 text-gray-400 border-gray-200 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => handleSelectOption(opt)}
                        className={`p-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98] ${btnClass}`}
                      >
                        {isAnswerChecked && isCorrect && <Check className="w-4 h-4 text-white" />}
                        {isAnswerChecked && isSelected && !isCorrect && <AlertCircle className="w-4 h-4 text-white" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Next button */}
                {isAnswerChecked && (
                  <div className="pt-3 border-t border-[#eee] text-right space-y-3 animate-in fade-in duration-200">
                    <div className="bg-[#fcf8f0] p-3 rounded-lg border border-[#e8dbc0] text-xs leading-relaxed text-[#4d3c24]">
                      <span className="font-bold text-[#8c7348] block mb-1">
                        💡 أصل المثل وشرحه:
                      </span>
                      {currentSentence.explanation}
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleNextSentence}
                        className="px-6 py-2 rounded-full bg-[#42341d] hover:bg-[#2b1f0d] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                      >
                        المثل الموالي ➔
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================
              TAB 3: SLIDING PICTURE PUZZLE
             ========================================= */}
          {activeTab === "puzzle" && (
            <div className="space-y-4 max-w-md mx-auto text-center">
              {/* Image selector & Moves */}
              <div className="flex items-center justify-between bg-[#f2e7d3] p-2.5 rounded-xl border border-[#d8c8a5] text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {PUZZLE_IMAGES.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setPuzzleImageIdx(idx)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        puzzleImageIdx === idx
                          ? "bg-[#42341d] text-[#faf6ee] shadow-2xs"
                          : "bg-white/80 text-[#54432a] hover:bg-white"
                      }`}
                    >
                      صورة {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 font-bold text-[#443521]">
                  <span>الحركات: {puzzleMoves}</span>
                  <button
                    type="button"
                    onClick={shuffleTiles}
                    className="p-1 text-[#66543b] hover:text-black rounded cursor-pointer"
                    title="خلط البازل من جديد"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#735e3d] font-bold">{activeImage.title}</p>

              {/* 3x3 Puzzle Board */}
              <div className="flex justify-center">
                <div className="w-[300px] h-[300px] grid grid-cols-3 grid-rows-3 gap-1 bg-[#42341d] p-1.5 rounded-xl shadow-lg border-2 border-[#bfa87a]">
                  {tiles.map((tile, idx) => {
                    if (tile === 0) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="bg-[#241a0e]/40 rounded-lg border border-dashed border-[#bfa87a]/40"
                        />
                      );
                    }

                    // Background position calculation for 3x3 (tile numbers 1 to 8)
                    const originalIndex = tile - 1;
                    const origRow = Math.floor(originalIndex / 3);
                    const origCol = originalIndex % 3;

                    return (
                      <button
                        key={tile}
                        type="button"
                        onClick={() => handleTileClick(idx)}
                        className="relative rounded-lg overflow-hidden shadow-inner border border-[#cfbd97] transition active:scale-95 cursor-pointer group"
                        style={{
                          backgroundImage: `url(${activeImage.url})`,
                          backgroundSize: "300px 300px",
                          backgroundPosition: `-${origCol * 96}px -${origRow * 96}px`,
                        }}
                      >
                        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center opacity-70 group-hover:opacity-100">
                          {tile}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Helper Actions */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPuzzleOriginal((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-[#efe5cf] text-[#42341d] text-xs font-bold hover:bg-[#dfcca8] border border-[#cfbd97] transition cursor-pointer"
                >
                  {showPuzzleOriginal ? "إخفاء الصورة الأصلية" : "معاينة الصورة الأصلية 👁️"}
                </button>
              </div>

              {/* Original Preview Modal / Box */}
              {showPuzzleOriginal && (
                <div className="bg-white p-2 rounded-xl border border-[#dfcca9] inline-block shadow-md animate-in fade-in duration-150">
                  <img
                    src={activeImage.url}
                    alt={activeImage.title}
                    className="w-48 h-48 object-cover rounded-lg"
                  />
                  <p className="text-[11px] text-[#6d593c] mt-1 font-bold">{activeImage.title}</p>
                </div>
              )}

              {/* Win celebration */}
              {isPuzzleSolved && (
                <div className="bg-green-100 p-3 rounded-xl border border-green-300 text-green-900 text-xs font-bold animate-in zoom-in-95 duration-200">
                  🎉 أحسنت صنعاً! ركبت البازل بنجاح في {puzzleMoves} حركة!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-[#f2e7d3] px-4 py-2 text-[11px] text-[#735e3d] flex items-center justify-between border-t border-[#dfcca9]">
          <span className="font-serif">جريدة الأفق • ركن الذكاء والتسلية الذهنية</span>
          <span className="font-sans">متجدد مع كل عدد يومي 🗞️</span>
        </div>
      </div>
    </div>
  );
}
