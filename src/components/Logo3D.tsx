import React from 'react';

interface Logo3DProps {
  compact?: boolean;
}

export const Logo3D: React.FC<Logo3DProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 select-none">
        <svg
          className="w-6 h-6 shrink-0"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldGradCompact" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>
          <path
            d="M32 6L37 16H27L32 6ZM12 22L22 28L28 18L32 26L36 18L42 28L52 22L46 46H18L12 22ZM16 50H48V56H16V50Z"
            fill="url(#goldGradCompact)"
            stroke="#FEF08A"
            strokeWidth="1.5"
          />
        </svg>
        <span
          className="font-display font-extrabold text-sm sm:text-base tracking-wider bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 bg-clip-text text-transparent whitespace-nowrap"
          style={{ textShadow: '0 2px 10px rgba(245, 158, 11, 0.25)' }}
        >
          CHESS LEGENDS 3D
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center select-none">
      <div className="relative mb-1">
        <svg
          className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)]"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="royalGold" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="35%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="arcaneGlow" x1="0" y1="0" x2="0" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
          </defs>
          <circle cx="48" cy="52" r="38" stroke="url(#arcaneGlow)" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
          <path d="M45 8H51V16H57V22H51V30H45V22H39V16H45V8Z" fill="url(#royalGold)" />
          <path
            d="M16 36L30 48L48 28L66 48L80 36L70 70H26L16 36Z"
            fill="url(#royalGold)"
            stroke="#FEF08A"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="48" cy="52" r="4.5" fill="#38BDF8" />
          <circle cx="34" cy="56" r="3.5" fill="#EF4444" />
          <circle cx="62" cy="56" r="3.5" fill="#10B981" />
          <rect x="24" y="74" width="48" height="8" rx="3" fill="url(#royalGold)" stroke="#FEF08A" strokeWidth="1.5" />
        </svg>
      </div>

      <h1
        className="font-display font-black tracking-[0.1em] text-2xl sm:text-4xl md:text-5xl bg-gradient-to-b from-[#fffbeb] via-[#fbbf24] to-[#b45309] bg-clip-text text-transparent"
        style={{
          filter: 'drop-shadow(0 4px 0 #451a03) drop-shadow(0 8px 20px rgba(245, 158, 11, 0.45))',
        }}
      >
        CHESS LEGENDS 3D
      </h1>
    </div>
  );
};
