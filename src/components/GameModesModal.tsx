import React from 'react';
import { X, Bot, Users, Globe2, Trophy, WifiOff, Play, RotateCcw } from 'lucide-react';
import { GameMode } from './MainMenu';
import { AIDifficulty } from '../engine/chessAI';
import { CountryConfig } from '../data/countries';

export interface TournamentMatch {
  id: string;
  round: 'Quarterfinal' | 'Semifinal' | 'Grand Final';
  team1: CountryConfig;
  team2: CountryConfig;
  winner?: CountryConfig;
  isPlayerMatch: boolean;
}

interface GameModesModalProps {
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  whiteCountry: CountryConfig;
  blackCountry: CountryConfig;
  tournamentMatches: TournamentMatch[];
  tournamentStage: number;
  tournamentChampion: CountryConfig | null;
  onSelectMode: (mode: GameMode) => void;
  onSelectDifficulty: (diff: AIDifficulty) => void;
  onResetTournament: () => void;
  onStartSelectedMode: () => void;
  onOpenCountrySelect: () => void;
  onClose: () => void;
}

export const GameModesModal: React.FC<GameModesModalProps> = ({
  gameMode,
  aiDifficulty,
  whiteCountry,
  blackCountry,
  tournamentMatches,
  tournamentChampion,
  onSelectMode,
  onSelectDifficulty,
  onResetTournament,
  onStartSelectedMode,
  onOpenCountrySelect,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-black/75">
      <div className="w-full max-w-3xl max-h-[88vh] bg-[#0e0c18] border border-amber-500/40 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/25 bg-[#141122]">
          <h2 className="font-display font-bold text-base sm:text-lg text-amber-300 tracking-wider">
            GAME MODES
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1d1830] hover:bg-[#2a2344] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* MODE 1: PLAYER VS AI */}
            <div
              onClick={() => onSelectMode('ai')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-[#1f1934] border-amber-400'
                  : 'bg-[#151224] border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <Bot className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-sm sm:text-base text-white">
                  PLAYER VS AI
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMode('ai');
                      onSelectDifficulty(diff);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-display font-bold uppercase cursor-pointer ${
                      aiDifficulty === diff && gameMode === 'ai'
                        ? 'bg-amber-500 text-[#09080d]'
                        : 'bg-[#120f1e] text-slate-300 border border-white/10'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* MODE 2: LOCAL TWO PLAYER */}
            <div
              onClick={() => onSelectMode('local')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                gameMode === 'local'
                  ? 'bg-[#1f1934] border-amber-400'
                  : 'bg-[#151224] border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm sm:text-base text-white">
                  LOCAL 2 PLAYER
                </h3>
              </div>
              <div className="text-xs text-slate-300 mt-2">
                {whiteCountry.name} vs {blackCountry.name}
              </div>
            </div>

            {/* MODE 3: COUNTRY BATTLE */}
            <div
              onClick={() => onSelectMode('country')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                gameMode === 'country'
                  ? 'bg-[#1f1934] border-amber-400'
                  : 'bg-[#151224] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe2 className="w-5 h-5 text-sky-400" />
                  <h3 className="font-display font-bold text-sm sm:text-base text-white">
                    COUNTRY BATTLE
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMode('country');
                    onOpenCountrySelect();
                  }}
                  className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold cursor-pointer"
                >
                  Change
                </button>
              </div>
              <div className="text-xs text-amber-100 mt-2">
                {whiteCountry.name} vs {blackCountry.name}
              </div>
            </div>

            {/* MODE 4: TOURNAMENT */}
            <div
              onClick={() => onSelectMode('tournament')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                gameMode === 'tournament'
                  ? 'bg-[#1f1934] border-amber-400'
                  : 'bg-[#151224] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <h3 className="font-display font-bold text-sm sm:text-base text-white">
                    TOURNAMENT
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetTournament();
                  }}
                  title="New Bracket"
                  className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs text-slate-300 mt-2">8-Nation Knockout Cup</div>
            </div>
          </div>

          {gameMode === 'tournament' && (
            <div className="p-3 rounded-xl bg-[#131022] border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-xs text-amber-300">BRACKET</span>
                {tournamentChampion && (
                  <span className="text-xs font-bold text-emerald-300">
                    Champion: {tournamentChampion.name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tournamentMatches.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-lg border text-xs ${
                      m.isPlayerMatch
                        ? 'bg-[#1e1836] border-amber-400/60'
                        : 'bg-[#161326] border-white/10'
                    }`}
                  >
                    <div className="text-[10px] text-amber-300/80 font-semibold uppercase mb-0.5">
                      {m.round}
                    </div>
                    <div className="truncate text-white">{m.team1.name}</div>
                    <div className="truncate text-white">{m.team2.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Online Multiplayer Coming Soon */}
          <div className="p-3 rounded-xl bg-[#12101c] border border-white/10 flex items-center justify-between opacity-75">
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-slate-400" />
              <span className="font-display font-bold text-xs text-slate-300">
                ONLINE MULTIPLAYER
              </span>
            </div>
            <span className="text-xs font-display font-semibold text-amber-400">
              COMING SOON
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#141122] border-t border-amber-500/25 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1d1830] hover:bg-[#282142] text-xs font-semibold text-slate-200 cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={onStartSelectedMode}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09080d] font-display font-bold text-xs tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>PLAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
