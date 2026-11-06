import React from 'react';
import { Logo3D } from './Logo3D';

interface LoadingScreenProps {
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#07060c] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(245, 158, 11, 0.16) 0%, rgba(88, 28, 135, 0.12) 45%, rgba(7, 6, 12, 0.98) 80%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center gap-6">
        {/* Official 3D Game Logo & Name Only */}
        <div className="scale-105 sm:scale-110 transition-transform">
          <Logo3D />
        </div>

        {/* Clean Loading Bar & Percentage */}
        <div className="w-full space-y-2.5">
          <div className="w-full h-3 rounded-full bg-[#151226] border border-amber-500/40 p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-display font-bold tracking-widest">
            <span className="text-amber-200 uppercase">LOADING...</span>
            <span className="font-mono-tabular text-amber-400">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
