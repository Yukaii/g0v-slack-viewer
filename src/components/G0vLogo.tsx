import React from 'react';

interface G0vLogoProps {
  size?: 'sm' | 'md';
  showText?: boolean;
}

export const G0vLogo: React.FC<G0vLogoProps> = ({
  size = 'md',
  showText = false,
}) => {
  const box = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 32 32"
        className={`${box} shrink-0 rounded-md shadow-xs`}
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#c8161d" />
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="5.5"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        {/* Stylized g0v slashed zero / civic node emblem */}
        <circle
          cx="16"
          cy="16"
          r="8.2"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.2"
        />
        <line
          x1="10.5"
          y1="21.5"
          x2="21.5"
          y2="10.5"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className="inline-flex items-baseline gap-1 font-extrabold tracking-tight text-white">
          <span>g0v</span>
          <span className="text-[11px] font-semibold text-white/60">.tw</span>
        </span>
      )}
    </span>
  );
};
