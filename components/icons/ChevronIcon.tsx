import React from 'react';

interface ChevronIconProps {
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const ChevronIcon: React.FC<ChevronIconProps> = ({ className = 'w-4 h-4', direction = 'down' }) => {
  const rotations = {
    up: 'rotate-180',
    down: 'rotate-0',
    left: 'rotate-90',
    right: '-rotate-90',
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`${className} ${rotations[direction]} transition-transform duration-200`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
};


