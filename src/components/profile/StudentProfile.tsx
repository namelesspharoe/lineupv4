import React, { useState, useEffect } from 'react';
import { User, Lesson, StudentProgress, Achievement } from '../../types';
import {
  User as UserIcon,
  Edit,
  Save,
  X,
  Star,
  Calendar,
  Target,
  Award,
  TrendingUp,
  BookOpen,
  Camera,
  Mail,
  Phone,
  MapPin,
  Clock,
  Trophy,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AvatarUpload } from '../common/AvatarUpload';

interface StudentProfileProps {
  student: User;
  onUpdate?: (updatedStudent: User) => void;
  isEditable?: boolean;
}

interface StudentStats {
  totalLessons: number;
  completedLessons: number;
  averageRating: number;
  currentLevel: string;
  totalAchievements: number;
  lessonsThisMonth: number;
  favoriteInstructors: string[];
  totalSpent: number;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  onUpdate,
  isEditable = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<User>(student);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<StudentStats>({
    totalLessons: 0,
    completedLessons: 0,
    averageRating: 0,
    currentLevel: 'first_time',
    totalAchievements: 0,
    lessonsThisMonth: 0,
    favoriteInstructors: [],
    totalSpent: 0
  });
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadStudentStats();
  }, [student.id]);

  // Reset editedProfile when student prop changes
  useEffect(() => {
    setEditedProfile(student);
  }, [student]);

  const loadStudentStats = async () => {
    try {
      // Get lessons for this student (simplified query to avoid index issues)
      const lessonsQuery = query(
        collection(db, 'lessons'),
        where('studentIds', 'array-contains', student.id)
      );
      
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const lessons = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lesson[];

      // Calculate stats
      const totalLessons = lessons.length;
      const completedLessons = lessons.filter(lesson => lesson.status === 'completed').length;
      const totalSpent = lessons.reduce((sum, lesson) => sum + (lesson.price || 0), 0);
      
      // Calculate average rating from instructor feedback
      const allFeedback = lessons.flatMap(lesson => lesson.feedback || []);
      const averageRating = allFeedback.length > 0 
        ? allFeedback.reduce((sum, feedback) => sum + (feedback.performance?.overall || 0), 0) / allFeedback.length 
        : 0;

      // Get lessons this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const lessonsThisMonth = lessons.filter(lesson => 
        new Date(lesson.date) >= thisMonth
      ).length;

      // Get favorite instructors (most lessons with)
      const instructorCounts: { [key: string]: number } = {};
      lessons.forEach(lesson => {
        if (instructorCounts[lesson.instructorId]) {
          instructorCounts[lesson.instructorId]++;
        } else {
          instructorCounts[lesson.instructorId] = 1;
        }
      });
      
      const favoriteInstructors = Object.entries(instructorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([instructorId]) => instructorId);

      // Get student progress
      const progressQuery = query(
        collection(db, 'studentProgress'),
        where('studentId', '==', student.id)
      );
      const progressSnapshot = await getDocs(progressQuery);
      const progress = progressSnapshot.docs[0]?.data() as StudentProgress;

      // Get recent achievements (simplified query to avoid index issues)
      const achievementsQuery = query(
        collection(db, 'achievements'),
        where('studentId', '==', student.id)
      );
      const achievementsSnapshot = await getDocs(achievementsQuery);
      const achievements = achievementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Achievement[];
      
      // Sort achievements in memory
      achievements.sort((a, b) => {
        const dateA = new Date(a.unlockedDate || 0);
        const dateB = new Date(b.unlockedDate || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setStats({
        totalLessons,
        completedLessons,
        averageRating: Math.round(averageRating * 10) / 10,
        currentLevel: progress?.level || 'first_time',
        totalAchievements: achievements.length,
        lessonsThisMonth,
        favoriteInstructors,
        totalSpent
      });

      setRecentAchievements(achievements.slice(0, 5));
    } catch (error) {
      console.error('Error loading student stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', student.id);
      
      // Filter out undefined values to prevent Firebase errors
      const updateData: any = {};
      if (editedProfile.name !== undefined) updateData.name = editedProfile.name;
      if (editedProfile.bio !== undefined) updateData.bio = editedProfile.bio;
      if (editedProfile.phone !== undefined) updateData.phone = editedProfile.phone;
      if (editedProfile.address !== undefined) updateData.address = editedProfile.address;
      if (editedProfile.level !== undefined) updateData.level = editedProfile.level;
      if (editedProfile.avatar !== undefined) updateData.avatar = editedProfile.avatar;
      
      await updateDoc(userRef, updateData);

      // Update the local student state to reflect changes immediately
      const updatedStudent = { ...student, ...editedProfile };
      onUpdate?.(updatedStudent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(student);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof User, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpdate = async (avatarUrl: string) => {
    console.log('Avatar updated:', avatarUrl);
    setEditedProfile(prev => ({
      ...prev,
      avatar: avatarUrl
    }));
    
    // Automatically save the avatar update to the database
    try {
      const userRef = doc(db, 'users', student.id);
      await updateDoc(userRef, {
        avatar: avatarUrl
      });
      console.log('Avatar saved to database successfully');
      
      // Update the local student state
      const updatedStudent = { ...student, avatar: avatarUrl };
      onUpdate?.(updatedStudent);
    } catch (error) {
      console.error('Error saving avatar to database:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'first_time': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'developing_turns': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'linking_turns': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'confident_turns': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'consistent_blue': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getLevelDisplayName = (level: string) => {
    switch (level) {
      case 'first_time': return 'First Time';
      case 'developing_turns': return 'Developing Turns';
      case 'linking_turns': return 'Linking Turns';
      case 'confident_turns': return 'Confident Turns';
      case 'consistent_blue': return 'Consistent Blue';
      default: return 'Unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {isEditable ? (
            <AvatarUpload
              currentAvatar={editedProfile.avatar}
              userId={student.id}
              onAvatarUpdate={handleAvatarUpdate}
              size="md"
            />
          ) : (
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                {student.avatar ? (
                  <img 
                    src={student.avatar} 
                    alt={student.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-white" />
                )}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {student.name}
              </h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(student.level || 'first_time')}`}>
                {getLevelDisplayName(student.level || 'first_time')}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Ski Student
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {student.email}
            </p>
          </div>
        </div>
        
        {isEditable && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalLessons}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.completedLessons}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.averageRating.toFixed(1)}
          </p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Achievements</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.totalAchievements}
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">This Month</span>
          </div>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            {stats.lessonsThisMonth}
          </p>
        </div>
        
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Current Level</span>
          </div>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {getLevelDisplayName(student.level || 'first_time')}
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Total Spent</span>
          </div>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            ${stats.totalSpent.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Recent Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {achievement.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {achievement.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(achievement.unlockedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Bio */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              About Me
            </h3>
            {isEditing ? (
              <textarea
                value={editedProfile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {student.bio || 'No bio available.'}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editedProfile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <textarea
                    value={editedProfile.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Enter your full address..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {student.phone && (
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.address && (
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{student.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Level */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Current Level
            </h3>
            {isEditing ? (
              <select
                value={editedProfile.level || 'first_time'}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="first_time">First Time</option>
                <option value="developing_turns">Developing Turns</option>
                <option value="linking_turns">Linking Turns</option>
                <option value="confident_turns">Confident Turns</option>
                <option value="consistent_blue">Consistent Blue</option>
              </select>
            ) : (
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-2 rounded-full text-sm font-medium ${getLevelColor(student.level || 'first_time')}`}>
                  {getLevelDisplayName(student.level || 'first_time')}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${(() => {
                        const levels = ['first_time', 'developing_turns', 'linking_turns', 'confident_turns', 'consistent_blue'];
                        const currentIndex = levels.indexOf(student.level || 'first_time');
                        return ((currentIndex + 1) / levels.length) * 100;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Learning Goals */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Learning Goals
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Master basic turns</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Improve balance and control</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">Link turns smoothly</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">Navigate blue runs confidently</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                <span>{student.email}</span>
              </div>
              {student.phone && (
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4" />
                  <span>{student.phone}</span>
                </div>
              )}
              {student.address && (
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{student.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Learning Progress */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Learning Progress
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Lesson Completion</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.completedLessons}/{stats.totalLessons}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ 
                    width: `${stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Average Rating</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Lessons This Month</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.lessonsThisMonth}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                <Calendar className="w-4 h-4 mx-auto mb-1" />
                Book Lesson
              </button>
              <button className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                <BookOpen className="w-4 h-4 mx-auto mb-1" />
                View Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
