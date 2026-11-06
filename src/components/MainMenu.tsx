import React from 'react';
import { Swords, Globe, Gamepad2, BookOpen, Settings, Info, Music, PlayCircle } from 'lucide-react';
import { Logo3D } from './Logo3D';
import { GameSettings, TRANSLATIONS } from '../data/settings';

export type GameMode = 'ai' | 'local' | 'country' | 'tournament';

interface MainMenuProps {
  settings: GameSettings;
  hasSavedGame: boolean;
  onStartGame: () => void;
  onContinueSavedGame: () => void;
  onOpenCountrySelect: () => void;
  onOpenGameModes: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onToggleMusic: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  settings,
  hasSavedGame,
  onStartGame,
  onContinueSavedGame,
  onOpenCountrySelect,
  onOpenGameModes,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenAbout,
  onToggleMusic,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-between p-3 sm:p-6 pointer-events-none">
      {/* Top Bar: Logo + Quick Music Toggle */}
      <div className="w-full max-w-5xl flex items-start justify-between pointer-events-auto">
        <div className="w-10 sm:w-24" />
        <Logo3D />
        <button
          onClick={onToggleMusic}
          className={`px-3 py-2 rounded-xl border text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            settings.musicEnabled
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-[#120f1d]/90 border-white/15 text-slate-400'
          }`}
          title="Toggle Background Music"
        >
          <Music className="w-4 h-4" />
          <span className="hidden sm:inline">
            {settings.musicEnabled ? 'MUSIC ON' : 'MUSIC OFF'}
          </span>
        </button>
      </div>

      {/* Bottom Main Action Dock (Clean & Unobstructed — Board Theme is in Settings) */}
      <div className="w-full max-w-md pointer-events-auto mb-6 sm:mb-4 flex flex-col gap-2.5">
        <div className="w-full bg-[#0d0b16]/94 border border-amber-500/35 rounded-2xl p-3 sm:p-4 shadow-[0_16px_48px_rgba(0,0,0,0.9)] flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onStartGame}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 text-[#09080d] font-display font-extrabold text-sm sm:text-base tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.45)] transition-transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords className="w-5 h-5" />
              <span>{t.playGame}</span>
            </button>

            {hasSavedGame && (
              <button
                onClick={onContinueSavedGame}
                className="py-3 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-200 font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-emerald-300" />
                <span>LOAD SAVED</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            <button
              onClick={onOpenCountrySelect}
              className="py-2 px-2.5 rounded-xl bg-[#171426] hover:bg-[#221d38] border border-amber-500/25 text-amber-100 font-display font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t.countrySelect}</span>
            </button>

            <button
              onClick={onOpenGameModes}
              className="py-2 px-2.5 rounded-xl bg-[#171426] hover:bg-[#221d38] border border-amber-500/25 text-amber-100 font-display font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t.gameModes}</span>
            </button>

            <button
              onClick={onOpenHowToPlay}
              className="py-2 px-2.5 rounded-xl bg-[#171426] hover:bg-[#221d38] border border-amber-500/25 text-amber-100 font-display font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t.howToPlay}</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="py-2 px-2.5 rounded-xl bg-[#171426] hover:bg-[#221d38] border border-amber-500/25 text-amber-100 font-display font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t.settings}</span>
            </button>

            <button
              onClick={onOpenAbout}
              className="col-span-2 sm:col-span-1 py-2 px-2.5 rounded-xl bg-[#171426] hover:bg-[#221d38] border border-amber-500/25 text-amber-100 font-display font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t.about}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
