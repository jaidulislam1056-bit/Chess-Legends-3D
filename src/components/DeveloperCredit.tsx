import React from 'react';

export const DeveloperCredit: React.FC = () => {
  return (
    <div
      className="fixed bottom-2.5 right-3.5 z-50 pointer-events-none select-none"
      aria-label="Developer Credit"
    >
      <span
        className="font-display text-xs sm:text-sm font-semibold tracking-wider text-amber-200/95 px-2.5 py-1 rounded bg-[#0c0a14]/85 border border-amber-500/25 shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
        style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(245, 158, 11, 0.35)' }}
      >
        Developed by Jaidul
      </span>
    </div>
  );
};
