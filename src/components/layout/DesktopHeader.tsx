import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

export function DesktopHeader() {
  return (
    <div className="p-4 border-b border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-frost-600 dark:text-frost-400" />
          <span className="font-bold text-lg text-gray-900 dark:text-white">SlopesMaster</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

