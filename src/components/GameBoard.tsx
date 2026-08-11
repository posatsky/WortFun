import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WordLevel, GameCard, GameStats, LevelProgress } from '../types';
import { audioManager } from '../utils/audio';
import { Volume2, Trophy, ArrowRight, RotateCcw, CheckCircle2, Flame, Sparkles, HelpCircle, Layers, Star, XCircle } from 'lucide-react';

interface GameBoardProps {
  levels: WordLevel[];
  currentLevelIndex: number;
  setCurrentLevelIndex: (index: number) => void;
  levelProgress: Record<string, LevelProgress>;
  onLevelCompleted: (levelId: string, score: number, timeSeconds: number, stars: number) => void;
  onOpenAiGenerator: () => void;
  onOpenCustomList: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  levels,
  currentLevelIndex,
  setCurrentLevelIndex,
  levelProgress,
  onLevelCompleted,
  onOpenAiGenerator,
  onOpenCustomList,
}) => {
  const currentLevel = levels[currentLevelIndex] || levels[0];

  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastMatchedPair, setLastMatchedPair] = useState<{ german: string; ukrainian: string; exampleGerman?: string; exampleUkrainian?: string } | null>(null);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    streak: 1,
    maxStreak: 1,
    totalMatched: 0,
    totalAttempts: 0,
    startTime: null,
    elapsedTime: 0,
  });

  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Initialize level cards
  const initLevel = useCallback(() => {
    if (!currentLevel || !currentLevel.pairs || currentLevel.pairs.length === 0) return;

    const newCards: GameCard[] = [];

    currentLevel.pairs.forEach((pair) => {
      // German Card
      newCards.push({
        id: `${pair.id}-de`,
        pairId: pair.id,
        text: pair.german,
        language: 'de',
        exampleGerman: pair.exampleGerman,
        exampleUkrainian: pair.exampleUkrainian,
        isSelected: false,
        isMatched: false,
        isError: false,
      });

      // Ukrainian Card
      newCards.push({
        id: `${pair.id}-uk`,
        pairId: pair.id,
        text: pair.ukrainian,
        language: 'uk',
        exampleGerman: pair.exampleGerman,
        exampleUkrainian: pair.exampleUkrainian,
        isSelected: false,
        isMatched: false,
        isError: false,
      });
    });

    // Shuffle cards randomly
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }

    setCards(newCards);
    setSelectedCards([]);
    setIsProcessing(false);
    setLastMatchedPair(null);
    setIsLevelComplete(false);

    setStats({
      score: 0,
      streak: 1,
      maxStreak: 1,
      totalMatched: 0,
      totalAttempts: 0,
      startTime: Date.now(),
      elapsedTime: 0,
    });
  }, [currentLevel]);

  // Load level on index change or currentLevel change
  useEffect(() => {
    initLevel();
  }, [currentLevelIndex, initLevel]);

  // Timer interval
  useEffect(() => {
    if (isLevelComplete || !stats.startTime) return;

    timerRef.current = window.setInterval(() => {
      setStats((prev) => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000),
      }));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stats.startTime, isLevelComplete]);

  // Card click handler
  const handleCardClick = (card: GameCard) => {
    if (isProcessing || card.isMatched || card.isSelected || card.isError || card.isCorrect) return;

    audioManager.playSelect();

    // If German word, pronounce it
    if (card.language === 'de') {
      audioManager.speakGerman(card.text);
    }

    const updatedCards = cards.map((c) =>
      c.id === card.id ? { ...c, isSelected: true } : c
    );
    setCards(updatedCards);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    // If 2 cards are selected
    if (newSelected.length === 2) {
      setIsProcessing(true);
      const [firstCard, secondCard] = newSelected;

      // Check if match
      if (firstCard.pairId === secondCard.pairId) {
        // MATCH FOUND!
        audioManager.playSuccess();

        // Speak German word again if second card clicked was Ukrainian
        if (firstCard.language === 'de') {
          audioManager.speakGerman(firstCard.text);
        } else if (secondCard.language === 'de') {
          audioManager.speakGerman(secondCard.text);
        }

        // Find pair details for example banner
        const matchedPair = currentLevel.pairs.find((p) => p.id === firstCard.pairId);
        if (matchedPair) {
          setLastMatchedPair({
            german: matchedPair.german,
            ukrainian: matchedPair.ukrainian,
            exampleGerman: matchedPair.exampleGerman,
            exampleUkrainian: matchedPair.exampleUkrainian,
          });
        }

        // Immediately set both cards to CORRECT (emerald green)
        setCards((prevCards) =>
          prevCards.map((c) =>
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, isCorrect: true, isSelected: false }
              : c
          )
        );

        setTimeout(() => {
          // After 650ms showing green success feedback, mark cards as matched to disappear
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.pairId === firstCard.pairId
                ? { ...c, isMatched: true, isCorrect: false, isSelected: false }
                : c
            )
          );

          setStats((prev) => {
            const nextMatched = prev.totalMatched + 1;
            const nextStreak = prev.streak + 1;
            const streakBonus = nextStreak * 25;
            const matchPoints = 100 + streakBonus;

            const isAllDone = nextMatched === currentLevel.pairs.length;

            if (isAllDone) {
              audioManager.playLevelComplete();
              setIsLevelComplete(true);

              // Calculate stars (1-3)
              const timeSec = Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000);
              const totalAttempts = prev.totalAttempts + 1;
              const accuracy = Math.round((nextMatched / totalAttempts) * 100);

              let stars = 1;
              if (accuracy >= 80 && timeSec <= currentLevel.pairs.length * 8) {
                stars = 3;
              } else if (accuracy >= 60 || timeSec <= currentLevel.pairs.length * 12) {
                stars = 2;
              }

              onLevelCompleted(currentLevel.id, prev.score + matchPoints, timeSec, stars);
            }

            return {
              ...prev,
              score: prev.score + matchPoints,
              streak: nextStreak,
              maxStreak: Math.max(prev.maxStreak, nextStreak),
              totalMatched: nextMatched,
              totalAttempts: prev.totalAttempts + 1,
            };
          });

          setSelectedCards([]);
          setIsProcessing(false);
        }, 650);
      } else {
        // WRONG PAIR!
        audioManager.playError();

        // Immediately set both cards to ERROR (rose red)
        setCards((prevCards) =>
          prevCards.map((c) =>
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, isError: true, isSelected: false }
              : c
          )
        );

        setStats((prev) => ({
          ...prev,
          streak: 1, // Reset streak on error
          totalAttempts: prev.totalAttempts + 1,
        }));

        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === firstCard.id || c.id === secondCard.id
                ? { ...c, isSelected: false, isError: false }
                : c
            )
          );
          setSelectedCards([]);
          setIsProcessing(false);
        }, 750);
      }
    }
  };

  const totalPairsCount = currentLevel.pairs.length;
  const remainingPairs = totalPairsCount - stats.totalMatched;
  const progressPercent = Math.round((stats.totalMatched / totalPairsCount) * 100);

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
      
      {/* Top Bar: Level Selection & Stats */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl sm:rounded-3xl p-3 sm:p-5 mb-4 sm:mb-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Level Switcher & Info */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative shrink-0">
              <select
                value={currentLevelIndex}
                onChange={(e) => setCurrentLevelIndex(Number(e.target.value))}
                className="appearance-none bg-orange-500 text-white font-black px-3 sm:px-4 py-2 pr-8 sm:pr-9 rounded-xl sm:rounded-2xl border-2 border-orange-400 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer text-xs sm:text-sm shadow-md"
              >
                {levels.map((lvl, idx) => {
                  const prog = levelProgress[lvl.id];
                  const starText = prog?.completed ? ' ⭐'.repeat(prog.stars || 1) : '';
                  return (
                    <option key={lvl.id} value={idx}>
                      Рівень {lvl.levelNumber}: {lvl.title} {starText}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white text-[10px] sm:text-xs font-bold">
                ▼
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                  {currentLevel.difficulty}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-700">
                  {currentLevel.category}
                </span>
                {currentLevel.isCustom && (
                  <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Ваш список
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-700 mt-0.5 line-clamp-1">
                {currentLevel.description}
              </p>
            </div>
          </div>

          {/* Live Progress Metrics */}
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 bg-slate-100 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-slate-300 shrink-0 text-xs sm:text-sm font-bold">
            <div>
              <div className="text-slate-600 text-[9px] sm:text-[10px] uppercase font-black tracking-wider">Залишилось</div>
              <div className="font-black text-slate-900 text-sm sm:text-base">
                {remainingPairs} / {totalPairsCount}
              </div>
            </div>

            <div className="h-7 sm:h-8 w-0.5 bg-slate-300" />

            <div>
              <div className="text-slate-600 text-[9px] sm:text-[10px] uppercase font-black tracking-wider">Час</div>
              <div className="font-mono font-black text-orange-600 text-sm sm:text-base">
                {Math.floor(stats.elapsedTime / 60)}:
                {String(stats.elapsedTime % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="h-7 sm:h-8 w-0.5 bg-slate-300" />

            <div>
              <div className="text-slate-600 text-[9px] sm:text-[10px] uppercase font-black tracking-wider">Серія</div>
              <div className={`font-black text-sm sm:text-base flex items-center gap-1 ${stats.streak > 1 ? 'text-orange-600 animate-pulse' : 'text-slate-800'}`}>
                {stats.streak > 1 && <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-orange-500 text-orange-500" />}
                x{stats.streak}
              </div>
            </div>
          </div>

        </div>

        {/* Level Progress Bar */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t-2 border-slate-200 flex items-center gap-3">
          <div className="flex-1 bg-slate-200 h-3.5 sm:h-4 rounded-full overflow-hidden border-2 border-slate-300 shadow-inner">
            <motion.div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs font-black text-orange-600 w-10 text-right">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Example Sentence Context Banner (Shows when a pair is matched) */}
      <AnimatePresence>
        {lastMatchedPair && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => audioManager.speakGerman(lastMatchedPair.german)}
                className="w-10 h-10 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm transition-colors"
                title="Слухати німецьке слово"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800 text-base sm:text-lg">
                    {lastMatchedPair.german}
                  </span>
                  <span className="text-slate-400 text-xs font-bold">=</span>
                  <span className="text-emerald-700 font-bold text-base">
                    {lastMatchedPair.ukrainian}
                  </span>
                </div>
                {lastMatchedPair.exampleGerman && (
                  <p className="text-xs text-slate-600 font-medium mt-0.5 italic">
                    «{lastMatchedPair.exampleGerman}»{' '}
                    <span className="text-slate-500 not-italic font-normal">
                      ({lastMatchedPair.exampleUkrainian})
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="text-xs font-black text-emerald-800 bg-emerald-200/80 px-3.5 py-1.5 rounded-full border border-emerald-300 shrink-0 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Правильна пара!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 min-h-[320px] sm:min-h-[380px]">
        <AnimatePresence mode="popLayout">
          {cards
            .filter((card) => !card.isMatched)
            .map((card) => {
              let cardStyle = "bg-white rounded-2xl sm:rounded-3xl shadow-[0_4px_0_0_#94a3b8] sm:shadow-[0_6px_0_0_#94a3b8] border-2 border-slate-300 hover:border-orange-500 text-slate-900 hover:shadow-[0_4px_0_0_#ea580c]";
              let stateBadge = null;

              if (card.isCorrect) {
                cardStyle = "bg-emerald-600 rounded-2xl sm:rounded-3xl shadow-[0_4px_0_0_#047857] sm:shadow-[0_6px_0_0_#047857] text-white border-2 sm:border-4 border-emerald-300 scale-[1.02] transition-all z-10";
                stateBadge = (
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black bg-white text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm animate-bounce border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                    <span>Вірно!</span>
                  </span>
                );
              } else if (card.isError) {
                cardStyle = "bg-rose-600 rounded-2xl sm:rounded-3xl shadow-[0_4px_0_0_#9f1239] sm:shadow-[0_6px_0_0_#9f1239] text-white border-2 sm:border-4 border-rose-300 animate-pulse transition-all z-10";
                stateBadge = (
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black bg-white text-rose-900 px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm border border-rose-300">
                    <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
                    <span>Помилка!</span>
                  </span>
                );
              } else if (card.isSelected) {
                cardStyle = card.language === 'de'
                  ? "bg-indigo-600 rounded-2xl sm:rounded-3xl shadow-[0_4px_0_0_#3730a3] sm:shadow-[0_6px_0_0_#3730a3] text-white border-2 sm:border-4 border-indigo-300 scale-[1.02]"
                  : "bg-orange-500 rounded-2xl sm:rounded-3xl shadow-[0_4px_0_0_#9a3412] sm:shadow-[0_6px_0_0_#9a3412] text-white border-2 sm:border-4 border-orange-300 scale-[1.02]";
              }

              return (
                <motion.button
                  key={card.id}
                  layout
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.25 } }}
                  onClick={() => handleCardClick(card)}
                  whileHover={{ scale: card.isSelected || card.isCorrect || card.isError ? 1.02 : 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 flex flex-col justify-between text-left transition-all duration-150 min-h-[95px] sm:min-h-[110px] group cursor-pointer active:translate-y-0.5 active:shadow-none ${cardStyle}`}
                >
                  {/* Language Tag Indicator or State Badge */}
                  <div className="flex items-center justify-between w-full mb-1">
                    {stateBadge ? (
                      stateBadge
                    ) : (
                      <span
                        className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                          card.isSelected
                            ? 'bg-white/30 text-white border border-white/40'
                            : card.language === 'de'
                            ? 'bg-amber-200 text-amber-950 font-black border border-amber-400'
                            : 'bg-indigo-200 text-indigo-950 font-black border border-indigo-400'
                        }`}
                      >
                        {card.language === 'de' ? '🇩🇪 DE' : '🇺🇦 UA'}
                      </span>
                    )}

                    {card.language === 'de' && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          audioManager.speakGerman(card.text);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          card.isSelected || card.isCorrect || card.isError
                            ? 'text-white hover:bg-white/20'
                            : 'text-slate-600 hover:text-orange-600 hover:bg-slate-200'
                        }`}
                        title="Прослухати вимову"
                      >
                        <Volume2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {/* Main Word Text */}
                  <div className="font-black text-sm sm:text-base md:text-xl leading-snug mt-auto text-slate-900 break-words">
                    {card.text}
                  </div>

                </motion.button>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Additional Quick Controls & Help Bar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border-2 border-slate-300 text-xs font-bold text-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-orange-500 shrink-0" />
          <span>Порада: Натисніть спочатку на слово, а потім на його відповідний переклад!</span>
        </div>

        <div className="flex items-center gap-3 font-bold">
          <button
            onClick={onOpenAiGenerator}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Згенерувати список AI
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={onOpenCustomList}
            className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            + Додати свій список
          </button>
        </div>
      </div>

      {/* LEVEL COMPLETE MODAL */}
      <AnimatePresence>
        {isLevelComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="bg-white border-4 border-amber-300 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-900 shadow-lg flex items-center justify-center mx-auto mb-4 border-2 border-amber-500">
                <Trophy className="w-9 h-9" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                Рівень Пройдено! 🎉
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-1">
                {currentLevel.title}
              </p>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 my-4">
                {[1, 2, 3].map((s) => {
                  const starsEarned = levelProgress[currentLevel.id]?.stars || 3;
                  return (
                    <Star
                      key={s}
                      className={`w-8 h-8 ${
                        s <= starsEarned
                          ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                          : 'text-slate-200'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Stats Breakdown */}
              <div className="grid grid-cols-2 gap-3 my-6 bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 text-left">
                <div>
                  <div className="text-xs text-slate-500 font-bold">Набрано балів</div>
                  <div className="text-lg font-black text-indigo-600">
                    +{stats.score}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">Час проходження</div>
                  <div className="text-lg font-black text-orange-600 font-mono">
                    {Math.floor(stats.elapsedTime / 60)}хв {stats.elapsedTime % 60}с
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">Макс. серія</div>
                  <div className="text-lg font-black text-emerald-600">
                    🔥 x{stats.maxStreak}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold">Точність</div>
                  <div className="text-lg font-black text-slate-800">
                    {Math.round((totalPairsCount / (stats.totalAttempts || 1)) * 100)}%
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                {currentLevelIndex < levels.length - 1 ? (
                  <button
                    onClick={() => setCurrentLevelIndex(currentLevelIndex + 1)}
                    className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
                  >
                    <span>Наступний рівень</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={onOpenAiGenerator}
                    className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-base shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Згенерувати новий рівень з AI</span>
                  </button>
                )}

                <button
                  onClick={initLevel}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors border-2 border-slate-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Зіграти цей рівень ще раз</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
