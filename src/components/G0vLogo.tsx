import React from 'react';

interface G0vLogoProps {
  variant?: 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  showText?: boolean;
  className?: string;
}

const G_PATH =
  'M89.6,93.7c30.4,0,52,4.5,67.5,10.4v-25c-13.1-4.2-33.8-8.6-66.9-8.6C48.1,70.5,28,79,18,89c-9.2,9.2-14,21.6-14,37.5s4.8,28.3,14,37.5c10.1,10.3,29.8,18.5,70.9,18.5c32.9,0,53.2-4.6,65.7-17.1c6.9-6.9,10.4-16.5,10.4-33.2v-13.9H73.3v20.9h64.3c0.1,2.4,0.1,7.9-3.6,11.6c-6.7,6.7-23.2,8.9-45.1,8.9c-26.8,0-40.8-4.9-47.4-11.5c-4.8-4.9-7.3-11.9-7.3-21.7c0-9.5,2.7-17,7.9-22.2C47.9,98.5,62.1,93.7,89.6,93.7z';

const ZERO_PATH =
  'M370.1,89.3c-9.7-9.8-28.4-18.8-69.6-18.8c-39.6,0-59.8,8.8-69.7,18.8c-9,9.1-13.9,20.4-13.9,37.2s4.9,28,13.9,37.1c9.7,9.8,29.3,18.9,69.7,18.9s59.8-8.9,69.6-18.8c9-9.1,13.9-20.4,13.9-37.2C384,109.5,379.1,98.4,370.1,89.3z M300.6,158.5c-26.3,0-40-5.5-45.8-11.3c-4.5-4.6-7.8-10.5-7.8-21.7s2.8-17.2,7.6-22.1c6-6,19.6-10.9,46-10.9s39.5,5,45.7,11.2c4.8,4.9,7.8,10.6,7.8,21.8s-2.8,17.2-7.6,22.1C340.2,153.8,326.9,158.5,300.6,158.5z';

const V_PATH =
  'M602,74.5h-34.1l-54.7,81.9l-54.5-81.9H423l71.4,104h36.2l0,0L602,74.5L602,74.5z';

const SLASH_PATH = 'M414,2.5h-29.6L191,249.5h30.1L414,2.5z';

const G0V_RED = '#C60000';

/**
 * Official g0v logo based on the g0v press kit / style guide:
 * https://github.com/g0v/style-guide & https://g0v.tw/assets/img/g0v-only.svg
 */
export const G0vLogo: React.FC<G0vLogoProps> = ({
  variant = 'icon',
  size = 'md',
  inverted = true,
  showText = false,
  className = '',
}) => {
  const glyphFill = inverted ? '#ffffff' : '#000000';

  if (variant === 'wordmark') {
    const wordmarkHeight =
      size === 'sm' ? 'h-6' : size === 'lg' ? 'h-8' : 'h-7';
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        <svg
          viewBox="0 0 606 252"
          className={`${wordmarkHeight} w-auto shrink-0`}
          role="img"
          aria-label="g0v"
        >
          <path d={G_PATH} fill={glyphFill} />
          <path d={V_PATH} fill={glyphFill} />
          <path d={SLASH_PATH} fill={G0V_RED} />
          <path d={ZERO_PATH} fill={glyphFill} />
        </svg>
      </span>
    );
  }

  const iconBox =
    size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-7 w-7';

  return (
    <span className={`inline-flex shrink-0 items-center gap-2 ${className}`}>
      <svg
        viewBox="152 -24 301 301"
        className={`${iconBox} shrink-0 rounded-md shadow-xs`}
        aria-hidden="true"
      >
        <rect x="152" y="-24" width="301" height="301" rx="64" fill="#ffffff" />
        <path d={SLASH_PATH} fill={G0V_RED} />
        <path d={ZERO_PATH} fill="#000000" />
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
