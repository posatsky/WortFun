import React, { useState, useEffect } from 'react';
import { WordLevel, LevelProgress } from './types';
import { INITIAL_LEVELS } from './data/initialLevels';
import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { WordListManager } from './components/WordListManager';
import { DictionaryView } from './components/DictionaryView';
import { StatsDashboard } from './components/StatsDashboard';
import { audioManager } from './utils/audio';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'game' | 'dictionary' | 'ai' | 'custom' | 'stats'>('game');
  
  // Audio preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);

  // All word levels (default + custom)
  const [levels, setLevels] = useState<WordLevel[]>(() => {
    try {
      const savedCustom = localStorage.getItem('wortpaar_custom_levels');
      if (savedCustom) {
        const parsedCustom = JSON.parse(savedCustom);
        return [...INITIAL_LEVELS, ...parsedCustom];
      }
    } catch (e) {
      console.error('Failed to load custom levels:', e);
    }
    return INITIAL_LEVELS;
  });

  // Current level index
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);

  // Level completion progress tracking
  const [levelProgress, setLevelProgress] = useState<Record<string, LevelProgress>>(() => {
    try {
      const savedProg = localStorage.getItem('wortpaar_level_progress');
      if (savedProg) {
        return JSON.parse(savedProg);
      }
    } catch (e) {
      console.error('Failed to load level progress:', e);
    }
    return {};
  });

  // Save custom levels to LocalStorage
  const handleAddCustomLevel = (newLevel: WordLevel) => {
    setLevels((prevLevels) => {
      const updated = [...prevLevels, newLevel];
      const customOnly = updated.filter((l) => l.isCustom);
      try {
        localStorage.setItem('wortpaar_custom_levels', JSON.stringify(customOnly));
      } catch (e) {
        console.error('Failed to save custom level:', e);
      }
      return updated;
    });
  };

  // Delete custom level
  const handleDeleteCustomLevel = (levelId: string) => {
    setLevels((prevLevels) => {
      const updated = prevLevels.filter((l) => l.id !== levelId);
      const customOnly = updated.filter((l) => l.isCustom);
      try {
        localStorage.setItem('wortpaar_custom_levels', JSON.stringify(customOnly));
      } catch (e) {
        console.error('Failed to delete custom level:', e);
      }
      return updated;
    });
    if (currentLevelIndex >= levels.length - 1) {
      setCurrentLevelIndex(0);
    }
  };

  // Handle level completion
  const handleLevelCompleted = (
    levelId: string,
    score: number,
    timeSeconds: number,
    stars: number
  ) => {
    setLevelProgress((prev) => {
      const existing = prev[levelId];
      const updatedProg = {
        ...prev,
        [levelId]: {
          levelId,
          completed: true,
          stars: Math.max(existing?.stars || 0, stars),
          bestScore: Math.max(existing?.bestScore || 0, score),
          bestTimeSeconds: existing?.bestTimeSeconds
            ? Math.min(existing.bestTimeSeconds, timeSeconds)
            : timeSeconds,
        },
      };

      try {
        localStorage.setItem('wortpaar_level_progress', JSON.stringify(updatedProg));
      } catch (e) {
        console.error('Failed to save level progress:', e);
      }

      return updatedProg;
    });
  };

  // Reset progress
  const handleResetAllProgress = () => {
    if (confirm('Ви дійсно бажаєте скинути увесь збережений прогрес?')) {
      setLevelProgress({});
      try {
        localStorage.removeItem('wortpaar_level_progress');
      } catch (e) {
        console.error('Failed to clear progress:', e);
      }
    }
  };

  // Play generated/custom level immediately
  const handlePlayLevelImmediately = (levelId: string) => {
    const idx = levels.findIndex((l) => l.id === levelId);
    if (idx >= 0) {
      setCurrentLevelIndex(idx);
    } else {
      setCurrentLevelIndex(levels.length - 1);
    }
    setCurrentTab('game');
  };

  return (
    <div className="min-h-screen bg-amber-50 text-slate-800 font-sans antialiased selection:bg-orange-500 selection:text-white flex flex-col">
      
      {/* App Header & Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        speechEnabled={speechEnabled}
        setSpeechEnabled={setSpeechEnabled}
        currentLevelNumber={levels[currentLevelIndex]?.levelNumber || 1}
        totalLevels={levels.length}
        score={levelProgress[levels[currentLevelIndex]?.id]?.bestScore || 0}
        streak={1}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {currentTab === 'game' && (
          <GameBoard
            levels={levels}
            currentLevelIndex={currentLevelIndex}
            setCurrentLevelIndex={setCurrentLevelIndex}
            levelProgress={levelProgress}
            onLevelCompleted={handleLevelCompleted}
            onOpenAiGenerator={() => setCurrentTab('ai')}
            onOpenCustomList={() => setCurrentTab('custom')}
          />
        )}

        {currentTab === 'dictionary' && (
          <DictionaryView levels={levels} />
        )}

        {currentTab === 'ai' && (
          <AiGeneratorModal
            onAddCustomLevel={handleAddCustomLevel}
            onPlayLevelImmediately={handlePlayLevelImmediately}
          />
        )}

        {currentTab === 'custom' && (
          <WordListManager
            levels={levels}
            onAddCustomLevel={handleAddCustomLevel}
            onDeleteCustomLevel={handleDeleteCustomLevel}
            onSelectLevelToPlay={(index) => {
              setCurrentLevelIndex(index);
              setCurrentTab('game');
            }}
          />
        )}

        {currentTab === 'stats' && (
          <StatsDashboard
            levels={levels}
            levelProgress={levelProgress}
            onResetAllProgress={handleResetAllProgress}
            onPlayLevel={(index) => {
              setCurrentLevelIndex(index);
              setCurrentTab('game');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200/80 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        <p>WortFun • Інтерактивне вивчення німецько-українських слів з Gemini AI</p>
      </footer>

    </div>
  );
}
