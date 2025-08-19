import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';

export function FooterLogo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8">
          {/* Simple Mountain Logo */}
          <svg className="w-full h-full" viewBox="0 0 32 32">
            {/* Main Mountain */}
            <polygon 
              points="4,28 16,8 28,28" 
              fill="url(#logoGradient)" 
            />
            {/* Snow Cap */}
            <circle cx="16" cy="12" r="2" fill="white"/>
            
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa"/>
                <stop offset="100%" stopColor="#93c5fd"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-2xl font-bold text-white">SlopesMaster</span>
      </div>
      <p className="text-gray-300 leading-relaxed">
        Your premier destination for ski and snowboard instruction. 
        Connect with expert instructors and master the slopes with confidence.
      </p>
      <div className="flex space-x-4">
        <a 
          href="#" 
          className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
          aria-label="Facebook"
        >
          <Facebook className="w-5 h-5" />
        </a>
        <a 
          href="#" 
          className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
          aria-label="Twitter"
        >
          <Twitter className="w-5 h-5" />
        </a>
        <a 
          href="#" 
          className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
          aria-label="Instagram"
        >
          <Instagram className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}


