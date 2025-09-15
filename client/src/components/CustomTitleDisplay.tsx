'use client';

import React from 'react';

interface CustomTitleDisplayProps {
  customTitle: string | null;
  username: string;
  className?: string;
}

export default function CustomTitleDisplay({
  customTitle,
  username,
  className = ''
}: CustomTitleDisplayProps) {
  if (!customTitle) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="font-semibold text-gray-900 dark:text-white">
        {username}
      </div>
      <div className="text-sm text-amber-600 dark:text-amber-400 font-medium italic">
        {customTitle}
      </div>
    </div>
  );
}