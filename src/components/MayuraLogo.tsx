import React from 'react';

interface MayuraLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  textClassName?: string;
  subtitleClassName?: string;
}

/**
 * Mayura (मयूर) - The Indian Peacock (National Bird of India)
 * Reusable vector crest emblem symbolizing vigilance, agricultural foresight, and harvest prosperity.
 */
export const MayuraLogo: React.FC<MayuraLogoProps> = ({
  className = 'w-9 h-9',
  size = 36,
  withText = false,
  textClassName = 'text-stone-900 dark:text-stone-100 font-extrabold text-base',
  subtitleClassName = 'text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold',
}) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-sm bg-gradient-to-br from-emerald-600 via-teal-700 to-sky-800 p-1.5 ${className}`}
        style={{ width: size, height: size }}
        title="Mayura - Indian Peacock National Agricultural Emblem"
      >
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-transparent to-cyan-300/30 pointer-events-none" />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-sm"
        >
          {/* Fan Plumage / Feathers (Radiating arcs with peacock eyes) */}
          {/* Feather 1 (left) */}
          <path
            d="M50 78 C35 70, 20 52, 22 34 C24 22, 36 24, 42 38 C46 48, 49 66, 50 78 Z"
            fill="url(#mayura-emerald-grad)"
            opacity="0.88"
          />
          <circle cx="28" cy="30" r="4.5" fill="#0284C7" />
          <circle cx="28" cy="30" r="2.2" fill="#F59E0B" />

          {/* Feather 2 (center-left) */}
          <path
            d="M50 78 C40 60, 30 36, 38 20 C42 12, 54 16, 50 32 C48 48, 50 66, 50 78 Z"
            fill="url(#mayura-teal-grad)"
            opacity="0.94"
          />
          <circle cx="39" cy="18" r="4.8" fill="#1D4ED8" />
          <circle cx="39" cy="18" r="2.4" fill="#FBBF24" />

          {/* Feather 3 (center-right) */}
          <path
            d="M50 78 C52 60, 60 36, 66 22 C72 14, 82 22, 72 36 C64 48, 54 68, 50 78 Z"
            fill="url(#mayura-teal-grad)"
            opacity="0.94"
          />
          <circle cx="71" cy="22" r="4.8" fill="#1D4ED8" />
          <circle cx="71" cy="22" r="2.4" fill="#FBBF24" />

          {/* Feather 4 (far-right) */}
          <path
            d="M50 78 C56 68, 70 54, 78 38 C84 26, 74 20, 68 32 C62 44, 54 64, 50 78 Z"
            fill="url(#mayura-emerald-grad)"
            opacity="0.85"
          />
          <circle cx="76" cy="32" r="4.5" fill="#0284C7" />
          <circle cx="76" cy="32" r="2.2" fill="#F59E0B" />

          {/* Majestic Peacock Neck & Body */}
          <path
            d="M45 84 C40 76, 38 64, 42 54 C46 44, 53 38, 55 30 C56 25, 53 22, 49 22 C46 22, 44 24, 43 27 C42 25, 43 21, 47 18 C53 14, 61 17, 62 25 C63 35, 54 44, 49 55 C46 62, 47 74, 54 84 Z"
            fill="url(#mayura-royal-blue)"
          />

          {/* Peacock Crown Crest (3 Regal Plumes - Kalangi) */}
          <path d="M57 18 L60 8" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="60" cy="7" r="2" fill="#FDE047" />

          <path d="M55 17 L55 6" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="55" cy="5" r="2" fill="#FDE047" />

          <path d="M53 17 L49 8" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="48" cy="7" r="2" fill="#FDE047" />

          {/* Golden Beak */}
          <path d="M43 23 L34 26 L42 29 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />

          {/* Alert Eye */}
          <circle cx="48" cy="22" r="1.8" fill="#FFFFFF" />
          <circle cx="48" cy="22" r="0.9" fill="#0F172A" />

          {/* Chest plumage highlight */}
          <path
            d="M45 52 C48 46, 52 42, 54 36 C52 42, 48 48, 45 52 Z"
            fill="#38BDF8"
            opacity="0.8"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="mayura-royal-blue" x1="40" y1="18" x2="60" y2="84" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" />
              <stop offset="0.4" stopColor="#2563EB" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>

            <linearGradient id="mayura-emerald-grad" x1="20" y1="20" x2="60" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" />
              <stop offset="0.6" stopColor="#059669" />
              <stop offset="1" stopColor="#064E3B" />
            </linearGradient>

            <linearGradient id="mayura-teal-grad" x1="30" y1="10" x2="70" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2DD4BF" />
              <stop offset="0.5" stopColor="#0D9488" />
              <stop offset="1" stopColor="#115E59" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col leading-tight">
          <div className={`flex items-center gap-1.5 ${textClassName}`}>
            <span>Mayura Mandi AI</span>
            <span className="text-[10px] px-1.5 py-0.2 font-mono font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              मयूर
            </span>
          </div>
          <span className={subtitleClassName}>
            National APMC Pulse & Statutory Agricultural Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
