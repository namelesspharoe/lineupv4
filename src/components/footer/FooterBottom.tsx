import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

interface FooterBottomProps {
  currentYear: number;
}

export function FooterBottom({ currentYear }: FooterBottomProps) {
  return (
    <div className="border-t border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>&copy; {currentYear} SlopesMaster. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Made with</span>
            <Heart className="w-4 h-4 text-red-400 hidden sm:inline" />
            <span className="hidden sm:inline">for snow enthusiasts</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <Link 
              to="/privacy" 
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <Link 
              to="/support" 
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


