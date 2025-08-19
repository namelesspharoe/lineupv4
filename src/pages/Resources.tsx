import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Download, 
  ExternalLink, 
  Mountain, 
  Snowflake,
  Shield,
  Users,
  Award,
  Clock,
  MapPin
} from 'lucide-react';

export function Resources() {
  const resources = [
    {
      category: 'Learning Materials',
      items: [
        {
          title: 'Beginner Skiing Guide',
          description: 'Complete guide for first-time skiers',
          type: 'PDF',
          icon: FileText,
          link: '#',
          color: 'bg-blue-100 text-blue-600'
        },
        {
          title: 'Snowboarding Basics',
          description: 'Essential techniques for snowboarders',
          type: 'Video',
          icon: Video,
          link: '#',
          color: 'bg-green-100 text-green-600'
        },
        {
          title: 'Safety Guidelines',
          description: 'Important safety tips for the slopes',
          type: 'PDF',
          icon: Shield,
          link: '#',
          color: 'bg-red-100 text-red-600'
        }
      ]
    },
    {
      category: 'Equipment Guides',
      items: [
        {
          title: 'Ski Equipment Guide',
          description: 'How to choose the right ski equipment',
          type: 'PDF',
          icon: Mountain,
          link: '#',
          color: 'bg-purple-100 text-purple-600'
        },
        {
          title: 'Snowboard Setup',
          description: 'Setting up your snowboard correctly',
          type: 'Video',
          icon: Video,
          link: '#',
          color: 'bg-orange-100 text-orange-600'
        }
      ]
    },
    {
      category: 'Mountain Information',
      items: [
        {
          title: 'Resort Maps',
          description: 'Interactive maps of popular resorts',
          type: 'Interactive',
          icon: MapPin,
          link: '#',
          color: 'bg-indigo-100 text-indigo-600'
        },
        {
          title: 'Weather Conditions',
          description: 'Real-time weather updates',
          type: 'Live',
          icon: Snowflake,
          link: '#',
          color: 'bg-cyan-100 text-cyan-600'
        }
      ]
    },
    {
      category: 'Instructor Resources',
      items: [
        {
          title: 'Teaching Techniques',
          description: 'Advanced teaching methods for instructors',
          type: 'PDF',
          icon: Users,
          link: '#',
          color: 'bg-pink-100 text-pink-600'
        },
        {
          title: 'Certification Guide',
          description: 'PSIA and AASI certification information',
          type: 'PDF',
          icon: Award,
          link: '#',
          color: 'bg-yellow-100 text-yellow-600'
        },
        {
          title: 'Lesson Planning',
          description: 'Templates and guides for lesson planning',
          type: 'Template',
          icon: Clock,
          link: '#',
          color: 'bg-teal-100 text-teal-600'
        }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Resources
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Helpful materials, guides, and information to enhance your skiing and snowboarding experience.
        </p>
      </div>

      <div className="space-y-8">
        {resources.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {section.category}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item, itemIndex) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={itemIndex} className="group">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                            {item.type}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {item.type === 'PDF' && (
                            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          )}
                          {item.type === 'Video' && (
                            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                              <Video className="w-4 h-4" />
                              Watch
                            </button>
                          )}
                          {item.type === 'Interactive' && (
                            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                              <ExternalLink className="w-4 h-4" />
                              Open
                            </button>
                          )}
                          {item.type === 'Live' && (
                            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                              <ExternalLink className="w-4 h-4" />
                              View
                            </button>
                          )}
                          {item.type === 'Template' && (
                            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Resources Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Need More Help?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Can't find what you're looking for? Our team is here to help.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/find-instructor"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Find an Instructor
          </Link>
          <Link
            to="/messages"
            className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
