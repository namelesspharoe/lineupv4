import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="min-h-0 flex-1 overflow-auto bg-slate-100 dark:bg-gray-950">
      <div className="px-3 py-3 sm:p-4">{children}</div>
    </main>
  );
}

