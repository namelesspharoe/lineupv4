import React, { useState, useEffect } from 'react';
import { Trophy, X, Star } from 'lucide-react';
import { Achievement } from '../../types';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function AchievementNotification({ 
  achievement, 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 5000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, autoCloseDelay);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [achievement, onClose, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm w-full overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-400 to-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Achievement Unlocked!</h3>
              <p className="text-white/90 text-sm">Congratulations!</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Achievement content */}
        <div className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl">{achievement.icon}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {achievement.name}
              </h4>
              <p className="text-sm text-gray-600">
                {achievement.description}
              </p>
            </div>
          </div>

          {/* Category and points */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              achievement.category === 'skill' ? 'bg-green-100 text-green-700' :
              achievement.category === 'milestone' ? 'bg-blue-100 text-blue-700' :
              achievement.category === 'social' ? 'bg-purple-100 text-purple-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {achievement.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">+25 pts</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing multiple achievement notifications
export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<Achievement[]>([]);

  const addNotification = (achievement: Achievement) => {
    setNotifications(prev => [...prev, achievement]);
  };

  const removeNotification = (achievementId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== achievementId));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
}

// Component for displaying multiple achievement notifications
export function AchievementNotificationStack() {
  const { notifications, removeNotification } = useAchievementNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {notifications.map((achievement, index) => (
        <AchievementNotification
          key={`${achievement.id}-${index}`}
          achievement={achievement}
          onClose={() => removeNotification(achievement.id)}
          autoClose={true}
          autoCloseDelay={5000}
        />
      ))}
    </div>
  );
}
