import React, { useState } from 'react';
import { X, Shuffle, ArrowLeftRight, Check, Search } from 'lucide-react';
import { COUNTRIES, CountryConfig } from '../data/countries';

interface CountrySelectorProps {
  whiteCountry: CountryConfig;
  blackCountry: CountryConfig;
  onSelectWhite: (country: CountryConfig) => void;
  onSelectBlack: (country: CountryConfig) => void;
  onClose: () => void;
  onStartMatch: () => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  whiteCountry,
  blackCountry,
  onSelectWhite,
  onSelectBlack,
  onClose,
  onStartMatch,
}) => {
  const [activeSlot, setActiveSlot] = useState<'w' | 'b'>('w');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePickCountry = (country: CountryConfig) => {
    if (activeSlot === 'w') {
      onSelectWhite(country);
    } else {
      onSelectBlack(country);
    }
  };

  const handleRandomize = () => {
    const idx1 = Math.floor(Math.random() * COUNTRIES.length);
    let idx2 = Math.floor(Math.random() * COUNTRIES.length);
    if (idx2 === idx1) idx2 = (idx1 + 1) % COUNTRIES.length;
    onSelectWhite(COUNTRIES[idx1]);
    onSelectBlack(COUNTRIES[idx2]);
  };

  const handleSwapTeams = () => {
    const temp = whiteCountry;
    onSelectWhite(blackCountry);
    onSelectBlack(temp);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-2.5 sm:p-6 bg-black/75">
      <div className="w-full max-w-4xl max-h-[88vh] bg-[#0e0c18] border border-amber-500/40 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/25 bg-[#141122]">
          <h2 className="font-display font-bold text-base sm:text-lg text-amber-300 tracking-wider">
            SELECT COUNTRIES (30)
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1d1830] hover:bg-[#2a2344] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team 1 vs Team 2 Active Selection - Only Country Names */}
        <div className="grid grid-cols-11 gap-2 p-3 bg-[#120f1d] border-b border-white/10 items-center">
          <div
            onClick={() => setActiveSlot('w')}
            className={`col-span-5 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
              activeSlot === 'w'
                ? 'bg-[#1e1932] border-amber-400'
                : 'bg-[#151224] border-white/10'
            }`}
          >
            <div className="text-[10px] font-semibold text-amber-300 mb-1">TEAM 1 (WHITE)</div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-lg text-white truncate">
                {whiteCountry.name}
              </span>
            </div>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center gap-1.5">
            <button
              onClick={handleSwapTeams}
              title="Swap"
              className="p-2 rounded-lg bg-[#1c172e] hover:bg-[#282142] border border-amber-500/30 text-amber-300 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRandomize}
              title="Random"
              className="p-2 rounded-lg bg-[#1c172e] hover:bg-[#282142] border border-amber-500/30 text-amber-300 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            onClick={() => setActiveSlot('b')}
            className={`col-span-5 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
              activeSlot === 'b'
                ? 'bg-[#1e1932] border-amber-400'
                : 'bg-[#151224] border-white/10'
            }`}
          >
            <div className="text-[10px] font-semibold text-purple-300 mb-1">TEAM 2 (BLACK)</div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-lg text-white truncate">
                {blackCountry.name}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Slot Bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#0e0c18] border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSlot('w')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                activeSlot === 'w'
                  ? 'bg-amber-500 text-[#09080d]'
                  : 'bg-[#1a162b] text-slate-300'
              }`}
            >
              Team 1
            </button>
            <button
              onClick={() => setActiveSlot('b')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                activeSlot === 'b'
                  ? 'bg-amber-500 text-[#09080d]'
                  : 'bg-[#1a162b] text-slate-300'
              }`}
            >
              Team 2
            </button>
          </div>

          <div className="relative w-44 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full pl-8 pr-3 py-1 rounded-lg bg-[#161326] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* 30 Countries Grid - Pure Country Names Only */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {filteredCountries.map((country) => {
            const isWhite = whiteCountry.id === country.id;
            const isBlack = blackCountry.id === country.id;
            return (
              <button
                key={country.id}
                onClick={() => handlePickCountry(country)}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  isWhite
                    ? 'bg-[#211b36] border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                    : isBlack
                    ? 'bg-[#211b36] border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.25)]'
                    : 'bg-[#151224] border-white/10 hover:border-amber-500/40'
                }`}
              >
                <span className="font-display font-bold text-xs sm:text-sm text-white truncate w-full">
                  {country.name}
                </span>
                {(isWhite || isBlack) && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-300">
                    <Check className="w-3 h-3" />
                    {isWhite ? 'Team 1' : 'Team 2'}
                  </span>
                )}
              </button>
            );
          })}
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
            onClick={onStartMatch}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09080d] font-display font-bold text-xs tracking-wider cursor-pointer"
          >
            START
          </button>
        </div>
      </div>
    </div>
  );
};
