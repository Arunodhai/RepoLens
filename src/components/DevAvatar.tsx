import React, { useState } from 'react';

interface DevAvatarProps {
  src?: string;
  name: string;
  username?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  borderColor?: string;
}

export const DevAvatar: React.FC<DevAvatarProps> = ({
  src,
  name,
  username,
  size = 'md',
  className = '',
  borderColor,
}) => {
  const [imgError, setImgError] = useState(false);

  const identifier = (name || username || '').toLowerCase();
  const isArun = identifier.includes('arun');
  const isAshta = identifier.includes('ashta') || identifier.includes('padhi');

  // Determine official GitHub avatar ID
  const primarySrc = src
    ? src
    : isArun
    ? 'https://avatars.githubusercontent.com/u/60264218?v=4'
    : isAshta
    ? 'https://avatars.githubusercontent.com/u/86525473?v=4'
    : undefined;

  const initial = (name || username || 'D').charAt(0).toUpperCase();

  const sizeClasses = {
    xs: 'w-3.5 h-3.5 text-[8px]',
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-6 h-6 text-[10px]',
    lg: 'w-8 h-8 text-xs',
    xl: 'w-10 h-10 text-sm',
  };

  const defaultBorder = isArun
    ? 'border-orange-500'
    : isAshta
    ? 'border-emerald-500'
    : 'border-slate-600';

  const borderClass = borderColor || defaultBorder;
  const dimensionClass = sizeClasses[size];

  if (imgError || !primarySrc) {
    return (
      <div
        className={`${dimensionClass} rounded-full flex items-center justify-center font-mono font-bold shrink-0 border ${borderClass} ${
          isArun
            ? 'bg-gradient-to-br from-orange-500 to-amber-700 text-white shadow-[0_0_8px_rgba(249,115,22,0.3)]'
            : isAshta
            ? 'bg-gradient-to-br from-emerald-500 to-teal-800 text-white shadow-[0_0_8px_rgba(34,197,94,0.3)]'
            : 'bg-slate-800 text-slate-200'
        } ${className}`}
        title={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={primarySrc}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => {
        // Mark as error so state transitions smoothly to fallback initial avatar
        setImgError(true);
      }}
      className={`${dimensionClass} rounded-full object-cover shrink-0 border ${borderClass} ${
        isArun
          ? 'shadow-[0_0_8px_rgba(249,115,22,0.25)]'
          : isAshta
          ? 'shadow-[0_0_8px_rgba(34,197,94,0.25)]'
          : ''
      } ${className}`}
    />
  );
};
