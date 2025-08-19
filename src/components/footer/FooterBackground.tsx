import React from 'react';

interface FooterBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function FooterBackground({ children, className = '' }: FooterBackgroundProps) {
  return (
    <div className={`bg-gray-900 text-white ${className}`}>
      {children}
    </div>
  );
}
