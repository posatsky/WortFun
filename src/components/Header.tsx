import React from 'react';
import { Volume2, VolumeX, Sparkles, BookOpen, PlusCircle, Trophy, Play, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface HeaderProps {
  currentTab: 'game' | 'dictionary' | 'ai' | 'custom' | 'stats';
  setCurrentTab: (tab: 'game' | 'dictionary' | 'ai' | 'custom' | 'stats') => void;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  speechEnabled: boolean;
  setSpeechEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  currentLevelNumber: number;
  totalLevels: number;
  score: number;
  streak: number;
  onResetGame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  soundEnabled,
  setSoundEnabled,
  speechEnabled,
  setSpeechEnabled,
  currentLevelNumber,
  totalLevels,
  score,
  streak,
  onResetGame,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioManager.soundEnabled = next;
  };

  const toggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    audioManager.speechEnabled = next;
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-slate-300 text-slate-900 shadow-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-2">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentTab('game')} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="bg-orange-500 p-1.5 sm:p-2 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform flex items-center justify-center font-black text-base sm:text-lg">
              DE
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900">
                  WortFun
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                  DE &rarr; UA
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 hidden sm:block">
                Німецько-українські пари слів
              </p>
            </div>
          </div>

          {/* Quick Score & Level Bar in Game Mode (Desktop) */}
          {currentTab === 'game' && (
            <div className="hidden md:flex items-center gap-4 bg-slate-100 px-4 py-1.5 rounded-2xl border-2 border-slate-300 text-sm font-bold">
              <div className="flex items-center gap-1.5 text-slate-800">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-extrabold">Рівень:</span>
                <span className="font-black text-slate-900">{currentLevelNumber} / {totalLevels}</span>
              </div>
              <div className="h-4 w-0.5 bg-slate-300" />
              <div className="flex items-center gap-1.5 text-indigo-800">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-extrabold">Бали:</span>
                <span className="font-black text-indigo-700">{score}</span>
              </div>
              {streak > 1 && (
                <>
                  <div className="h-4 w-0.5 bg-slate-300" />
                  <div className="flex items-center gap-1 text-orange-600 font-black animate-pulse">
                    🔥 x{streak}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Buttons & Audio Toggles */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Audio Toggles */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Звукові ефекти увімкнені" : "Звукові ефекти вимкнені"}
              className={`p-2 rounded-xl text-xs font-bold transition-all border-2 ${
                soundEnabled 
                  ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm' 
                  : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleSpeech}
              title={speechEnabled ? "Озвучка німецьких слів увімкнена" : "Озвучка вимкнена"}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center gap-1 sm:gap-1.5 transition-all border-2 ${
                speechEnabled 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm' 
                  : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
            >
              <span className="text-sm">🗣️</span>
              <span className="hidden sm:inline">DE Озвучка</span>
            </button>

            {/* Reload/Reset current level if in game */}
            {currentTab === 'game' && onResetGame && (
              <button
                onClick={onResetGame}
                title="Перезапустити поточний рівень"
                className="p-2 sm:p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors border-2 border-slate-300"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* AI Generator Shortcut */}
            <button
              onClick={() => setCurrentTab('ai')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm active:translate-y-0.5 ${
                currentTab === 'ai'
                  ? 'bg-indigo-600 text-white border-2 border-indigo-400'
                  : 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200 border-2 border-indigo-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Gemini AI</span>
              <span className="sm:hidden">AI</span>
            </button>

          </div>
        </div>

        {/* Secondary Navigation Row (Desktop & Tablet) */}
        <div className="hidden sm:flex items-center gap-2 py-2 overflow-x-auto no-scrollbar border-t-2 border-slate-200 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setCurrentTab('game')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 shrink-0 ${
              currentTab === 'game'
                ? 'bg-orange-500 text-white border-orange-400 shadow-md font-black'
                : 'bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300 font-black'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Грати</span>
          </button>

          <button
            onClick={() => setCurrentTab('dictionary')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 shrink-0 ${
              currentTab === 'dictionary'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-black'
                : 'bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300 font-black'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Словник та Флешкартки</span>
          </button>

          <button
            onClick={() => setCurrentTab('ai')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 shrink-0 ${
              currentTab === 'ai'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md font-black'
                : 'bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300 font-black'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Згенерувати список (AI)</span>
          </button>

          <button
            onClick={() => setCurrentTab('custom')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 shrink-0 ${
              currentTab === 'custom'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-black'
                : 'bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300 font-black'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Додати свій список</span>
          </button>

          <button
            onClick={() => setCurrentTab('stats')}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all border-2 ml-auto shrink-0 ${
              currentTab === 'stats'
                ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-md font-black'
                : 'bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300 font-black'
            }`}
          >
            <Trophy className="w-4 h-4 text-orange-600" />
            <span>Прогрес</span>
          </button>
        </div>

        {/* Mobile Navigation Bar at top of header for quick access */}
        <div className="flex sm:hidden items-center justify-between gap-1 py-1.5 border-t-2 border-slate-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentTab('game')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border-2 whitespace-nowrap ${
              currentTab === 'game'
                ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>Грати</span>
          </button>

          <button
            onClick={() => setCurrentTab('dictionary')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border-2 whitespace-nowrap ${
              currentTab === 'dictionary'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Словник</span>
          </button>

          <button
            onClick={() => setCurrentTab('ai')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border-2 whitespace-nowrap ${
              currentTab === 'ai'
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>AI Набір</span>
          </button>

          <button
            onClick={() => setCurrentTab('custom')}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border-2 whitespace-nowrap ${
              currentTab === 'custom'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Свій</span>
          </button>

          <button
            onClick={() => setCurrentTab('stats')}
            className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border-2 whitespace-nowrap ${
              currentTab === 'stats'
                ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Прогрес</span>
          </button>
        </div>

      </div>

      {/* Sticky Bottom Navigation Bar for Mobile Phones */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-300 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] sm:hidden px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            onClick={() => setCurrentTab('game')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'game'
                ? 'bg-orange-500 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Play className={`w-5 h-5 ${currentTab === 'game' ? 'fill-current' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Грати</span>
          </button>

          <button
            onClick={() => setCurrentTab('dictionary')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'dictionary'
                ? 'bg-indigo-600 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Словник</span>
          </button>

          <button
            onClick={() => setCurrentTab('ai')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'ai'
                ? 'bg-purple-600 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-[10px] mt-0.5 tracking-tight">AI Набір</span>
          </button>

          <button
            onClick={() => setCurrentTab('custom')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'custom'
                ? 'bg-emerald-600 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Свій список</span>
          </button>

          <button
            onClick={() => setCurrentTab('stats')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'stats'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Trophy className={`w-5 h-5 ${currentTab === 'stats' ? 'text-orange-600' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Прогрес</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
