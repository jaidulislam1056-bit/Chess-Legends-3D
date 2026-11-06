import React from 'react';
import { Trophy, RotateCcw, Globe, Home, ArrowRight } from 'lucide-react';
import { CountryConfig } from '../data/countries';
import { GameSettings, TRANSLATIONS } from '../data/settings';
import { GameMode } from './MainMenu';

export interface GameOverState {
  outcome: 'white_win' | 'black_win' | 'draw';
  reason: string;
}

interface VictoryScreenProps {
  gameOver: GameOverState;
  whiteCountry: CountryConfig;
  blackCountry: CountryConfig;
  gameMode: GameMode;
  moveCount: number;
  settings: GameSettings;
  hasNextTournamentMatch: boolean;
  onPlayAgain: () => void;
  onNextTournamentMatch: () => void;
  onChangeCountry: () => void;
  onMainMenu: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  gameOver,
  whiteCountry,
  blackCountry,
  gameMode,
  moveCount,
  settings,
  hasNextTournamentMatch,
  onPlayAgain,
  onNextTournamentMatch,
  onChangeCountry,
  onMainMenu,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const isDraw = gameOver.outcome === 'draw';
  const isPlayerDefeat = gameMode === 'ai' && gameOver.outcome === 'black_win';
  const winningCountry =
    gameOver.outcome === 'white_win'
      ? whiteCountry
      : gameOver.outcome === 'black_win'
      ? blackCountry
      : null;
  const losingCountry =
    gameOver.outcome === 'white_win'
      ? blackCountry
      : gameOver.outcome === 'black_win'
      ? whiteCountry
      : null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/80">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 sm:p-8 text-center border-2 shadow-[0_24px_80px_rgba(0,0,0,0.95)] ${
          isDraw
            ? 'bg-[#131122] border-sky-400/60'
            : isPlayerDefeat
            ? 'bg-[#170d16] border-red-500/60'
            : 'bg-[#141022] border-amber-400'
        }`}
      >
        {/* Top Crown / Emblem */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
              isDraw
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : isPlayerDefeat
                ? 'bg-red-500/20 border-red-400/50 text-red-400'
                : 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
            }`}
          >
            <Trophy className="w-9 h-9" />
          </div>
        </div>

        {/* Main Result Headline */}
        <h2
          className={`font-display font-black text-3xl sm:text-5xl tracking-wider mb-2 ${
            isDraw
              ? 'text-sky-300'
              : isPlayerDefeat
              ? 'text-red-400'
              : 'bg-gradient-to-b from-amber-100 via-amber-400 to-amber-600 bg-clip-text text-transparent'
          }`}
        >
          {isDraw ? t.draw : isPlayerDefeat ? t.defeat : t.victory}
        </h2>

        <p className="text-xs sm:text-sm font-semibold text-amber-200/90 uppercase tracking-widest mb-5">
          {gameOver.reason}
        </p>

        {/* Country Result Showcase - Pure Country Names Only */}
        {isDraw ? (
          <div className="p-4 rounded-xl bg-[#1b1730] border border-white/10 flex items-center justify-around mb-6">
            <div className="flex flex-col items-center">
              <span className="font-display font-bold text-base sm:text-lg text-white">
                {whiteCountry.name}
              </span>
            </div>
            <span className="font-display font-bold text-slate-400 text-lg">DRAW</span>
            <div className="flex flex-col items-center">
              <span className="font-display font-bold text-base sm:text-lg text-white">
                {blackCountry.name}
              </span>
            </div>
          </div>
        ) : (
          winningCountry &&
          losingCountry && (
            <div className="p-5 rounded-xl bg-[#1b162e] border border-amber-500/30 mb-6">
              <div className="font-display font-extrabold text-xl sm:text-2xl text-white">
                {winningCountry.name} Triumphs!
              </div>
              <div className="text-xs text-amber-300 mt-0.5">{winningCountry.armyTitle}</div>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-center gap-4">
                <span>Defeated: {losingCountry.name}</span>
                <span>·</span>
                <span>Total Moves: {moveCount}</span>
              </div>
            </div>
          )
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {gameMode === 'tournament' && hasNextTournamentMatch && gameOver.outcome === 'white_win' ? (
            <button
              onClick={onNextTournamentMatch}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#09080d] font-display font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>NEXT TOURNAMENT ROUND</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onPlayAgain}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09080d] font-display font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          )}

          <button
            onClick={onChangeCountry}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#1e1934] hover:bg-[#292246] border border-amber-500/35 text-amber-200 font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>CHANGE COUNTRY</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#171326] hover:bg-[#221c38] border border-white/15 text-slate-200 font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
