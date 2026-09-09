import React from 'react';
const Logo = ({ height = 38, className = "", variant = "color" }) => {
  const isLight = variant === "light";

  // Unique gradient ids per instance so multiple <Logo/> variants can
  // coexist on the same page without one instance's <defs> overriding another's.
  const uid = React.useId ? React.useId().replace(/:/g, "") : "s2d";
  const idPink   = `pinkGradient-${uid}`;
  const idPurple = `purpleGradient-${uid}`;
  const idCyan   = `cyanGradient-${uid}`;
  const idWhite  = `whiteGradient-${uid}`;

  // On the purple panel, swap the pink + purple strokes for a clean white,
  // and keep a single cyan accent for brand recognition and visual interest.
  const wordmarkStroke = isLight ? `url(#${idWhite})`  : `url(#${idPurple})`;
  const pinkStroke     = isLight ? `url(#${idWhite})`  : `url(#${idPink})`;
  const accentStroke   = `url(#${idCyan})`; // cyan reads clearly on purple too

  return (
    <svg 
      height={height} 
      viewBox="0 0 620 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', maxHeight: '100%', width: 'auto' }}
      role="img"
      aria-label="Shop2Door"
    >
      <defs>
        {/* Pink / Magenta Gradient */}
        <linearGradient id={idPink} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#E91E63" />
        </linearGradient>

        {/* Purple / Dark Purple Gradient */}
        <linearGradient id={idPurple} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7B1FA2" />
        </linearGradient>

        {/* Cyan / Turquoise Accent Gradient */}
        <linearGradient id={idCyan} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Reversed (white) wordmark for dark purple panels */}
        <linearGradient id={idWhite} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3E8FF" />
        </linearGradient>
      </defs>

      <g transform="translate(10, 10)">
        {/* --- S & H INTERTWINED --- */}
        {/* S Path */}
        <path 
          d="M 65 32 C 60 18 42 12 28 18 C 12 24 8 40 22 48 C 38 56 50 62 44 76 C 38 90 18 88 10 76 M 10 76 C 5 68 8 58 14 54" 
          stroke={pinkStroke} 
          strokeWidth="16" 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* H Path interwoven behind/over S */}
        <path 
          d="M 52 20 L 52 85 M 52 52 L 95 52 M 95 20 L 95 85" 
          stroke={wordmarkStroke} 
          strokeWidth="16" 
          strokeLinecap="round" 
          fill="none" 
        />

        {/* --- O & P INTERTWINED --- */}
        {/* O Circle */}
        <circle 
          cx="135" 
          cy="52.5" 
          r="32" 
          stroke={wordmarkStroke} 
          strokeWidth="16" 
          fill="none" 
        />
        {/* P Stem & Loop */}
        <path 
          d="M 160 20 L 160 85 M 160 20 L 190 20 C 210 20 210 52 190 52 L 160 52" 
          stroke={wordmarkStroke} 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none" 
        />

        {/* --- NUMBER 2 --- */}
        <path 
          d="M 225 32 C 225 18 255 14 258 32 C 260 50 225 62 225 85 L 265 85" 
          stroke={wordmarkStroke} 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none" 
        />

        {/* --- LETTER D --- */}
        <path 
          d="M 285 20 L 285 85 M 285 20 L 305 20 C 335 20 335 85 305 85 L 285 85" 
          stroke={pinkStroke} 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none" 
        />

        {/* --- LINKED OO CHAIN --- */}
        {/* Left 'O' Ring */}
        <rect 
          x="345" 
          y="20" 
          width="75" 
          height="65" 
          rx="32.5" 
          fill="none" 
          stroke={pinkStroke} 
          strokeWidth="15" 
        />
        {/* Right 'O' Ring */}
        <rect 
          x="395" 
          y="20" 
          width="75" 
          height="65" 
          rx="32.5" 
          fill="none" 
          stroke={accentStroke} 
          strokeWidth="15" 
        />
        {/* Interlocking Arch Overlap */}
        <path 
          d="M 395 52.5 A 32.5 32.5 0 0 1 427.5 20 L 430 20" 
          fill="none" 
          stroke={pinkStroke} 
          strokeWidth="15" 
          strokeLinecap="round"
        />

        {/* --- LETTER R --- */}
        <path 
          d="M 495 20 L 495 85 M 495 20 L 520 20 C 538 20 538 50 520 50 L 495 50 M 518 50 L 540 85" 
          stroke={pinkStroke} 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none" 
        />
      </g>
    </svg>
  );
};

export default Logo;