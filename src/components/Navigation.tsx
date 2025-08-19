import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Users,
  BookOpen,
  BarChart2,
  MessageSquare,
  Video,
  GraduationCap,
  Search,
  ChevronRight,
  Settings,
  Shield,
  User,
  Trophy
} from 'lucide-react';

interface NavigationProps {
  onItemClick?: () => void;
}

const publicLinks = [
  { name: 'Find Instructor', icon: Search, href: '/find-instructor' },
  { name: 'Book Lesson', icon: Calendar, href: '/book-lesson' },
];

const adminLinks = [
  { name: 'Dashboard', icon: BarChart2, href: '/dashboard' },
  { name: 'Users', icon: Users, href: '/users' },
  { name: 'Lessons', icon: BookOpen, href: '/lessons' },
  { name: 'Messages', icon: MessageSquare, href: '/messages' },
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

const instructorLinks = [
  { name: 'Dashboard', icon: BarChart2, href: '/dashboard' },
  { name: 'Students', icon: Users, href: '/students' },
  { name: 'Schedule', icon: Calendar, href: '/schedule' },
  { name: 'Lessons', icon: BookOpen, href: '/lessons' },
  { name: 'Messages', icon: MessageSquare, href: '/messages' },
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'Resources', icon: Video, href: '/resources' },
];

const studentLinks = [
  { name: 'Dashboard', icon: BarChart2, href: '/dashboard' },
  { name: 'My Progress', icon: GraduationCap, href: '/progress' },
  { name: 'Achievements', icon: Trophy, href: '/achievements' },
  { name: 'Schedule', icon: Calendar, href: '/schedule' },
  { name: 'Messages', icon: MessageSquare, href: '/messages' },
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'Resources', icon: Video, href: '/resources' },
];

export function Navigation({ onItemClick }: NavigationProps) {
  const { user } = useAuth();
  
  let links;
  if (!user) {
    links = publicLinks;
  } else if (user.role === 'admin') {
    links = adminLinks;
  } else if (user.role === 'instructor') {
    links = instructorLinks;
  } else {
    links = studentLinks;
  }

  return (
    <nav className="space-y-2">
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          onClick={onItemClick}
          className="flex items-center justify-between px-4 py-4 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group active:bg-blue-100 dark:active:bg-blue-900/30 touch-manipulation"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
              <link.icon className="w-5 h-5" />
            </div>
            <span className="text-base font-medium">{link.name}</span>
          </div>
          <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      ))}
    </nav>
  );
}