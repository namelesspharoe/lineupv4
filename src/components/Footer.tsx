import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin, 
  Heart,
  Users,
  Award,
  Shield
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      {/* Mountain Silhouette Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-0 w-full h-80">
          {/* Dramatic Mountain Range */}
          <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
            {/* Far Mountain Range */}
            <path 
              d="M0,400 L100,380 L150,360 L200,340 L250,320 L300,300 L350,280 L400,260 L450,240 L500,220 L550,200 L600,180 L650,160 L700,140 L750,120 L800,100 L850,80 L900,60 L950,40 L1000,20 L1050,0 L1100,20 L1150,40 L1200,60 L1200,400 Z" 
              fill="url(#mountainGradient1)" 
              opacity="0.3"
            />
            
            {/* Middle Mountain Range */}
            <path 
              d="M0,400 L80,380 L120,360 L160,340 L200,320 L240,300 L280,280 L320,260 L360,240 L400,220 L440,200 L480,180 L520,160 L560,140 L600,120 L640,100 L680,80 L720,60 L760,40 L800,20 L840,0 L880,20 L920,40 L960,60 L1000,80 L1040,100 L1080,120 L1120,140 L1160,160 L1200,180 L1200,400 Z" 
              fill="url(#mountainGradient2)" 
              opacity="0.4"
            />
            
            {/* Near Mountain Range */}
            <path 
              d="M0,400 L60,380 L100,360 L140,340 L180,320 L220,300 L260,280 L300,260 L340,240 L380,220 L420,200 L460,180 L500,160 L540,140 L580,120 L620,100 L660,80 L700,60 L740,40 L780,20 L820,0 L860,20 L900,40 L940,60 L980,80 L1020,100 L1060,120 L1100,140 L1140,160 L1180,180 L1200,200 L1200,400 Z" 
              fill="url(#mountainGradient3)" 
              opacity="0.5"
            />
            
            {/* Sharp Peaks */}
            <path d="M1050,0 L1060,20 L1040,20 Z" fill="white" opacity="0.4"/>
            <path d="M840,0 L850,20 L830,20 Z" fill="white" opacity="0.4"/>
            <path d="M820,0 L830,20 L810,20 Z" fill="white" opacity="0.4"/>
            <path d="M860,20 L870,40 L850,40 Z" fill="white" opacity="0.3"/>
            <path d="M780,20 L790,40 L770,40 Z" fill="white" opacity="0.3"/>
            
            {/* Gradients */}
            <defs>
              <linearGradient id="mountainGradient1" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="1"/>
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="mountainGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#334155" stopOpacity="1"/>
                <stop offset="100%" stopColor="#334155" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="mountainGradient3" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#475569" stopOpacity="1"/>
                <stop offset="100%" stopColor="#475569" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Company Info */}
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

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/" 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/find-instructor" 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Find Instructors</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/book-lesson" 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>Book Lessons</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/progress" 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>Track Progress</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Services</h3>
              <ul className="space-y-2">
                <li className="text-gray-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Private Lessons</span>
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Group Classes</span>
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span>Certification Programs</span>
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <div className="relative w-4 h-4">
                    {/* Small Mountain Icon */}
                    <svg className="w-full h-full" viewBox="0 0 16 16">
                      <polygon 
                        points="2,14 8,4 14,14" 
                        fill="#60a5fa"
                      />
                      <circle cx="8" cy="6" r="1" fill="white"/>
                    </svg>
                  </div>
                  <span>Equipment Rental</span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>info@slopesmaster.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                  <span>123 Mountain View Dr.<br />Aspen, CO 81611</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
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
      </div>
    </footer>
  );
}
