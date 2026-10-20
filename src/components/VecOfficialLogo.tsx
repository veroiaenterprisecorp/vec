import React from 'react';

interface VecOfficialLogoProps {
  className?: string;
  size?: number;
}

export const VecOfficialLogo: React.FC<VecOfficialLogoProps> = ({ className = 'w-9 h-9', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 800"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="vecCyanBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="40%" stopColor="#0072FF" />
          <stop offset="100%" stopColor="#001B99" />
        </linearGradient>
        <linearGradient id="vecHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#0099FF" />
        </linearGradient>
        <linearGradient id="vecShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0033CC" />
          <stop offset="100%" stopColor="#000B40" />
        </linearGradient>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D0D7DE" />
        </linearGradient>
        <radialGradient id="bgDark" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#050C1E" />
          <stop offset="100%" stopColor="#02040A" />
        </radialGradient>
      </defs>

      <rect width="800" height="800" rx="40" fill="url(#bgDark)" />
      <g transform="translate(130, 160)">
        <path d="M 0 35 L 55 0 L 180 280 L 135 315 Z" fill="url(#vecHighlight)" />
        <path d="M 135 250 L 340 250 A 15 15 0 0 1 355 265 L 355 300 A 15 15 0 0 1 340 315 L 135 315 Z" fill="url(#vecHighlight)" />
        <path d="M 185 35 L 340 35 A 15 15 0 0 1 355 50 L 355 85 A 15 15 0 0 1 340 100 L 185 100 Z" fill="url(#vecCyanBlue)" />
        <path d="M 185 145 L 325 145 A 15 15 0 0 1 340 160 L 340 195 A 15 15 0 0 1 325 210 L 185 210 Z" fill="url(#vecCyanBlue)" />
        <path d="M 370 35 L 430 35 A 140 140 0 0 1 550 175 A 140 140 0 0 1 430 315 L 370 315 L 370 250 L 420 250 A 75 75 0 0 0 480 175 A 75 75 0 0 0 420 100 L 370 100 Z" fill="url(#vecCyanBlue)" />
        <path d="M 135 250 L 180 280 L 135 315 Z" fill="url(#vecShadow)" opacity="0.6" />
      </g>
      <g fill="url(#textGrad)">
        <path d="M 220 500 L 260 500 L 305 575 L 350 500 L 390 500 L 325 595 L 285 595 Z" />
        <path d="M 405 500 L 495 500 L 495 522 L 435 522 L 435 536 L 485 536 L 485 558 L 435 558 L 435 573 L 498 573 L 498 595 L 405 595 Z" />
        <path d="M 570 500 C 605 500 625 520 625 532 L 595 532 C 595 525 585 522 570 522 C 545 522 535 538 535 547.5 C 535 557 545 573 570 573 C 585 573 595 570 595 563 L 625 563 C 625 575 605 595 570 595 C 530 595 505 565 505 547.5 C 505 530 530 500 570 500 Z" />
      </g>
      <line x1="120" y1="650" x2="220" y2="650" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
      <text
        x="400"
        y="656"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="'Inter', sans-serif"
        fontWeight="600"
        fontSize="16"
        letterSpacing="8"
      >
        VEROIA ENTERPRISE CORE
      </text>
      <line x1="580" y1="650" x2="680" y2="650" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};
