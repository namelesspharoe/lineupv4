import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Lesson, LessonFeedback, StudentProgress } from '../types';
import { getLessonsByStudent, getStudentFeedback } from './lessons';
import { instructorStatsService, InstructorStats } from './instructorStats';
import { getMountains, instructorMatchesMountainSelection } from './mountains';

export interface InstructorMatch {
  instructor: User;
  matchScore: number;
  reasons: string[];
  stats?: InstructorStats;
}

export interface StudentProfile {
  id: string;
  level?: string;
  preferredLocations?: string[];
  preferredLanguages?: string[];
  maxPrice?: number;
  specialties?: string[]; // What they want to learn
  pastLessons?: Lesson[];
  feedback?: LessonFeedback[];
  progress?: StudentProgress;
  // New preference fields
  preferredLessonType?: 'private' | 'group' | 'workshop' | 'any';
  learningGoals?: string[];
  preferredDays?: string[];
  preferredTimes?: string[];
  preferredInstructorGender?: string;
  preferredInstructorExperience?: string;
  learningStyle?: string;
}

interface MatchingWeights {
  skillLevel: number;
  specialties: number;
  location: number;
  language: number;
  price: number;
  rating: number;
  experience: number;
  pastHistory: number;
  studentGoals: number;
  lessonType: number;
  instructorGender: number;
  instructorExperience: number;
  learningStyle: number;
}

const DEFAULT_WEIGHTS: MatchingWeights = {
  skillLevel: 18,
  specialties: 22,
  location: 12,
  language: 8,
  price: 10,
  rating: 10,
  experience: 5,
  pastHistory: 3,
  studentGoals: 5,
  lessonType: 3,
  instructorGender: 2,
  instructorExperience: 2,
  learningStyle: 2
};

/**
 * AI Matching Service for matching students with instructors
 */
export const instructorMatchingService = {
  /**
   * Get comprehensive student profile for matching
   */
  async getStudentProfile(studentId: string): Promise<StudentProfile> {
    try {
      // Get student user data
      const studentDoc = await getDoc(doc(db, 'users', studentId));
      const studentData = studentDoc.data() as any; // Use any to access studentPreferences

      // Get past lessons
      const pastLessons = await getLessonsByStudent(studentId);

      // Get feedback
      const feedback = await getStudentFeedback(studentId);

      // Extract preferences from past lessons and feedback
      const preferredLocations = this.extractPreferredLocations(pastLessons, studentData);
      const specialties = this.extractDesiredSpecialties(feedback, pastLessons);
      const preferredLanguages = studentData.languages || [];

      // Determine max price from past lessons, user preferences, or use a default
      const maxPrice = studentData.studentPreferences?.maxPrice || 
                       this.extractMaxPrice(pastLessons, studentData) || 
                       150;

      // Get preferences from studentPreferences object or use defaults
      const studentPreferences = studentData.studentPreferences || {};

      return {
        id: studentId,
        level: studentData.level,
        preferredLocations: preferredLocations.length > 0 
          ? preferredLocations 
          : (studentData.preferredLocations || []),
        preferredLanguages: preferredLanguages.length > 0 
          ? preferredLanguages 
          : (studentData.languages || []),
        maxPrice,
        specialties,
        pastLessons,
        feedback,
        // New preference fields
        preferredLessonType: studentPreferences.preferredLessonType || 'any',
        learningGoals: studentPreferences.learningGoals || [],
        preferredDays: studentPreferences.preferredDays || [],
        preferredTimes: studentPreferences.preferredTimes || [],
        preferredInstructorGender: studentPreferences.preferredInstructorGender || 'any',
        preferredInstructorExperience: studentPreferences.preferredInstructorExperience || 'any',
        learningStyle: studentPreferences.learningStyle || 'balanced'
      };
    } catch (error) {
      console.error('Error getting student profile:', error);
      throw error;
    }
  },

  /**
   * Match a student with all available instructors
   */
  async matchStudentWithInstructors(
    studentId: string,
    options?: {
      resort?: string;
      maxResults?: number;
      weights?: Partial<MatchingWeights>;
    }
  ): Promise<InstructorMatch[]> {
    try {
      // Get student profile
      const studentProfile = await this.getStudentProfile(studentId);

      // Get all instructors
      const instructorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'instructor')
      );
      const snapshot = await getDocs(instructorsQuery);
      
      const instructors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // Filter by resort if specified (same rules as BookLesson browse: mountainId, homeMountain,
      // preferredLocations, mountains.instructorIds — not only preferredLocations)
      let filteredInstructors = instructors;
      if (options?.resort) {
        const resortName = options.resort.trim();
        let mountainsList: Awaited<ReturnType<typeof getMountains>> = [];
        try {
          mountainsList = await getMountains();
        } catch {
          mountainsList = [];
        }
        const mountainDoc = mountainsList.find(
          (m) => m.name.toLowerCase() === resortName.toLowerCase()
        );
        filteredInstructors = instructors.filter((instructor) => {
          if (mountainDoc) {
            return instructorMatchesMountainSelection(
              instructor,
              mountainDoc.id,
              mountainDoc.name,
              mountainsList
            );
          }
          const n = resortName.toLowerCase();
          return (
            instructor.homeMountain?.trim().toLowerCase() === n ||
            (instructor.preferredLocations?.some(
              (loc) => loc.trim().toLowerCase() === n
            ) ??
              false) ||
            instructor.mountainId === resortName
          );
        });
      }

      // Calculate match scores for each instructor
      const matches: InstructorMatch[] = await Promise.all(
        filteredInstructors.map(async (instructor) => {
          const stats = await instructorStatsService.getInstructorStats(instructor.id);
          const matchScore = this.calculateMatchScore(
            studentProfile,
            instructor,
            stats,
            options?.weights
          );
          const reasons = this.generateMatchReasons(
            studentProfile,
            instructor,
            stats
          );

          return {
            instructor,
            matchScore,
            reasons,
            stats
          };
        })
      );

      // Sort by match score (highest first)
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Return top results
      const maxResults = options?.maxResults || 10;
      return matches.slice(0, maxResults);
    } catch (error) {
      console.error('Error matching student with instructors:', error);
      throw error;
    }
  },

  /**
   * Calculate match score between student and instructor
   */
  calculateMatchScore(
    student: StudentProfile,
    instructor: User,
    stats?: InstructorStats | null,
    customWeights?: Partial<MatchingWeights>
  ): number {
    const weights = { ...DEFAULT_WEIGHTS, ...customWeights };
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Skill Level Match (0-100)
    const skillLevelScore = this.scoreSkillLevelMatch(student.level, instructor.level);
    totalScore += (skillLevelScore / 100) * weights.skillLevel;
    maxPossibleScore += weights.skillLevel;

    // Specialties Match (0-100)
    const specialtiesScore = this.scoreSpecialtiesMatch(
      student.specialties || [],
      instructor.specialties || []
    );
    totalScore += (specialtiesScore / 100) * weights.specialties;
    maxPossibleScore += weights.specialties;

    // Location Match (0-100)
    const locationScore = this.scoreLocationMatch(
      student.preferredLocations || [],
      instructor.preferredLocations || []
    );
    totalScore += (locationScore / 100) * weights.location;
    maxPossibleScore += weights.location;

    // Language Match (0-100)
    const languageScore = this.scoreLanguageMatch(
      student.preferredLanguages || [],
      instructor.languages || []
    );
    totalScore += (languageScore / 100) * weights.language;
    maxPossibleScore += weights.language;

    // Price Match (0-100)
    const priceScore = this.scorePriceMatch(
      student.maxPrice,
      instructor.price || instructor.hourlyRate
    );
    totalScore += (priceScore / 100) * weights.price;
    maxPossibleScore += weights.price;

    // Rating Score (0-100)
    const ratingScore = stats ? (stats.averageRating / 5) * 100 : 70;
    totalScore += (ratingScore / 100) * weights.rating;
    maxPossibleScore += weights.rating;

    // Experience Score (0-100)
    const experienceScore = this.scoreExperience(instructor.yearsOfExperience || 0);
    totalScore += (experienceScore / 100) * weights.experience;
    maxPossibleScore += weights.experience;

    // Past History Bonus (0-100)
    const historyScore = this.scorePastHistory(student.pastLessons || [], instructor.id);
    totalScore += (historyScore / 100) * weights.pastHistory;
    maxPossibleScore += weights.pastHistory;

    // Student Goals Match (0-100)
    const goalsScore = this.scoreStudentGoals(
      student.feedback || [], 
      instructor, 
      student.learningGoals
    );
    totalScore += (goalsScore / 100) * weights.studentGoals;
    maxPossibleScore += weights.studentGoals;

    // Lesson Type Match (0-100)
    const lessonTypeScore = this.scoreLessonTypeMatch(
      student.preferredLessonType,
      instructor
    );
    totalScore += (lessonTypeScore / 100) * weights.lessonType;
    maxPossibleScore += weights.lessonType;

    // Instructor Gender Match (0-100)
    const genderScore = this.scoreInstructorGenderMatch(
      student.preferredInstructorGender,
      instructor.gender
    );
    totalScore += (genderScore / 100) * weights.instructorGender;
    maxPossibleScore += weights.instructorGender;

    // Instructor Experience Match (0-100)
    const experiencePreferenceScore = this.scoreInstructorExperienceMatch(
      student.preferredInstructorExperience,
      instructor.yearsOfExperience || 0
    );
    totalScore += (experiencePreferenceScore / 100) * weights.instructorExperience;
    maxPossibleScore += weights.instructorExperience;

    // Learning Style Match (0-100) - This is more nuanced, could match with instructor teaching style
    const learningStyleScore = this.scoreLearningStyleMatch(
      student.learningStyle,
      instructor
    );
    totalScore += (learningStyleScore / 100) * weights.learningStyle;
    maxPossibleScore += weights.learningStyle;

    // Normalize to 0-100 scale
    return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  },

  /**
   * Score skill level compatibility
   */
  scoreSkillLevelMatch(studentLevel?: string, instructorLevel?: string): number {
    if (!studentLevel || !instructorLevel) return 50; // Neutral if unknown

    const levelHierarchy: Record<string, number> = {
      'first_time': 1,
      'developing_turns': 2,
      'linking_turns': 3,
      'confident_turns': 4,
      'consistent_blue': 5
    };

    const studentNum = levelHierarchy[studentLevel] || 3;
    const instructorNum = levelHierarchy[instructorLevel] || 3;

    // Perfect match
    if (studentNum === instructorNum) return 100;
    
    // Instructor one level above (ideal for teaching)
    if (instructorNum === studentNum + 1) return 95;
    
    // Instructor two levels above (still good)
    if (instructorNum === studentNum + 2) return 85;
    
    // Instructor at higher level (can teach but might be too advanced)
    if (instructorNum > studentNum + 2) return 70;
    
    // Instructor at lower level (not ideal)
    if (instructorNum < studentNum) return 40;

    return 50;
  },

  /**
   * Score specialties match
   */
  scoreSpecialtiesMatch(studentSpecialties: string[], instructorSpecialties: string[]): number {
    if (studentSpecialties.length === 0) return 70; // Neutral if student has no preferences
    
    if (instructorSpecialties.length === 0) return 30; // Low if instructor has no specialties

    // Count matches
    const matches = studentSpecialties.filter(spec =>
      instructorSpecialties.some(instSpec =>
        instSpec.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(instSpec.toLowerCase())
      )
    ).length;

    // Calculate percentage match
    return (matches / studentSpecialties.length) * 100;
  },

  /**
   * Score location match
   */
  scoreLocationMatch(studentLocations: string[], instructorLocations: string[]): number {
    if (studentLocations.length === 0) return 70; // Neutral if no preference
    
    if (instructorLocations.length === 0) return 30; // Low if instructor has no locations

    const matches = studentLocations.filter(loc =>
      instructorLocations.includes(loc)
    ).length;

    return studentLocations.length > 0
      ? (matches / studentLocations.length) * 100
      : 70;
  },

  /**
   * Score language match
   */
  scoreLanguageMatch(studentLanguages: string[], instructorLanguages: string[]): number {
    if (studentLanguages.length === 0) return 100; // Perfect if no preference
    
    if (instructorLanguages.length === 0) return 50; // Neutral if instructor has no languages

    const matches = studentLanguages.filter(lang =>
      instructorLanguages.includes(lang)
    ).length;

    return studentLanguages.length > 0
      ? (matches / studentLanguages.length) * 100
      : 100;
  },

  /**
   * Score price match
   */
  scorePriceMatch(studentMaxPrice?: number, instructorPrice?: number): number {
    if (!studentMaxPrice) return 70; // Neutral if no price preference
    
    if (!instructorPrice) return 50; // Neutral if instructor has no price

    // Perfect match if within 10% of max
    if (instructorPrice <= studentMaxPrice * 1.1) {
      // Closer to max is better (but not over)
      if (instructorPrice <= studentMaxPrice) {
        return 100 - ((studentMaxPrice - instructorPrice) / studentMaxPrice) * 20;
      }
      return 90;
    }

    // Penalize if significantly over budget
    const overage = (instructorPrice - studentMaxPrice) / studentMaxPrice;
    if (overage > 0.5) return 20; // More than 50% over
    if (overage > 0.3) return 40; // More than 30% over
    return 60; // 10-30% over
  },

  /**
   * Score experience
   */
  scoreExperience(years: number): number {
    if (years >= 10) return 100;
    if (years >= 5) return 85;
    if (years >= 3) return 70;
    if (years >= 1) return 55;
    return 40;
  },

  /**
   * Score past history (bonus for previous lessons)
   */
  scorePastHistory(pastLessons: Lesson[], instructorId: string): number {
    const lessonsWithInstructor = pastLessons.filter(
      lesson => lesson.instructorId === instructorId && lesson.status === 'completed'
    );

    if (lessonsWithInstructor.length === 0) return 0;

    // Bonus increases with number of past lessons
    if (lessonsWithInstructor.length >= 5) return 100;
    if (lessonsWithInstructor.length >= 3) return 80;
    if (lessonsWithInstructor.length >= 2) return 60;
    return 40;
  },

  /**
   * Score student goals alignment
   */
  scoreStudentGoals(feedback: LessonFeedback[], instructor: User, learningGoals?: string[]): number {
    // Combine goals from feedback and signup preferences
    const goalsFromFeedback = feedback.flatMap(f =>
      f.skillAssessment?.nextSteps || []
    );
    
    const allGoals = [...goalsFromFeedback, ...(learningGoals || [])];
    
    if (allGoals.length === 0) return 50; // Neutral if no goals

    // Check if instructor specialties align with goals
    const instructorSpecialties = (instructor.specialties || []).map(s => s.toLowerCase());
    const matchingGoals = allGoals.filter(goal =>
      instructorSpecialties.some(spec =>
        goal.toLowerCase().includes(spec) || spec.includes(goal.toLowerCase())
      )
    ).length;

    return (matchingGoals / allGoals.length) * 100;
  },

  /**
   * Generate human-readable match reasons
   */
  generateMatchReasons(
    student: StudentProfile,
    instructor: User,
    stats?: InstructorStats | null
  ): string[] {
    const reasons: string[] = [];

    // Skill level
    if (student.level && instructor.level) {
      if (student.level === instructor.level) {
        reasons.push(`Perfect skill level match (${instructor.level})`);
      } else {
        reasons.push(`Experienced with ${instructor.level} level students`);
      }
    }

    // Specialties
    if (student.specialties && student.specialties.length > 0) {
      const matchingSpecialties = student.specialties.filter(spec =>
        instructor.specialties?.some(instSpec =>
          instSpec.toLowerCase().includes(spec.toLowerCase())
        )
      );
      if (matchingSpecialties.length > 0) {
        reasons.push(`Specializes in: ${matchingSpecialties.join(', ')}`);
      }
    }

    // Learning Goals
    if (student.learningGoals && student.learningGoals.length > 0) {
      const matchingGoals = student.learningGoals.filter(goal => {
        const goalLower = goal.toLowerCase();
        return instructor.specialties?.some(spec =>
          spec.toLowerCase().includes(goalLower) || goalLower.includes(spec.toLowerCase())
        );
      });
      if (matchingGoals.length > 0) {
        reasons.push(`Can help with: ${matchingGoals.slice(0, 2).join(', ')}`);
      }
    }

    // Instructor Gender Preference
    if (student.preferredInstructorGender && 
        student.preferredInstructorGender !== 'any' &&
        instructor.gender &&
        student.preferredInstructorGender === instructor.gender.toLowerCase()) {
      reasons.push(`Matches your preferred instructor gender`);
    }

    // Instructor Experience Preference
    if (student.preferredInstructorExperience && 
        student.preferredInstructorExperience !== 'any' &&
        instructor.yearsOfExperience) {
      const experienceRanges: Record<string, string> = {
        'beginner': '1-3 years',
        'intermediate': '3-5 years',
        'advanced': '5-10 years',
        'expert': '10+ years'
      };
      const rangeLabel = experienceRanges[student.preferredInstructorExperience];
      if (rangeLabel) {
        reasons.push(`Experience level matches your preference (${rangeLabel})`);
      }
    }

    // Location
    if (student.preferredLocations && student.preferredLocations.length > 0) {
      const matchingLocations = student.preferredLocations.filter(loc =>
        instructor.preferredLocations?.includes(loc)
      );
      if (matchingLocations.length > 0) {
        reasons.push(`Available at: ${matchingLocations.join(', ')}`);
      }
    }

    // Rating
    if (stats && stats.averageRating >= 4.5) {
      reasons.push(`Highly rated (${stats.averageRating.toFixed(1)}⭐)`);
    }

    // Experience
    if (instructor.yearsOfExperience && instructor.yearsOfExperience >= 5) {
      reasons.push(`${instructor.yearsOfExperience}+ years of experience`);
    }

    // Past history
    const pastLessonsWithInstructor = (student.pastLessons || []).filter(
      lesson => lesson.instructorId === instructor.id && lesson.status === 'completed'
    );
    if (pastLessonsWithInstructor.length > 0) {
      reasons.push(`You've had ${pastLessonsWithInstructor.length} successful lesson${pastLessonsWithInstructor.length > 1 ? 's' : ''} together`);
    }

    // Certifications
    if (instructor.certifications && instructor.certifications.length > 0) {
      reasons.push(`Certified: ${instructor.certifications.slice(0, 2).join(', ')}`);
    }

    // Tier
    if (stats && stats.tier && stats.tier !== 'bronze') {
      const tierNames: Record<string, string> = {
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum',
        diamond: 'Diamond'
      };
      reasons.push(`${tierNames[stats.tier]} tier instructor`);
    }

    return reasons;
  },

  /**
   * Extract preferred locations from past lessons
   */
  extractPreferredLocations(lessons: Lesson[], student: User): string[] {
    const locations = new Set<string>();

    // From past lessons
    lessons.forEach(lesson => {
      // Extract location from lesson if available
      // This would need to be added to Lesson type if not present
    });

    // From student profile
    if (student.preferredLocations) {
      student.preferredLocations.forEach(loc => locations.add(loc));
    }

    return Array.from(locations);
  },

  /**
   * Extract desired specialties from feedback and lessons
   */
  extractDesiredSpecialties(feedback: LessonFeedback[], lessons: Lesson[]): string[] {
    const specialties = new Set<string>();

    // From feedback next steps
    feedback.forEach(f => {
      f.skillAssessment?.nextSteps?.forEach(step => {
        // Extract specialty keywords
        const keywords = step.toLowerCase().split(/\s+/);
        keywords.forEach(keyword => {
          if (keyword.length > 3) {
            specialties.add(keyword);
          }
        });
      });
    });

    // From lesson skills focus
    lessons.forEach(lesson => {
      lesson.skillsFocus?.forEach(skill => {
        specialties.add(skill.toLowerCase());
      });
    });

    return Array.from(specialties).slice(0, 5); // Limit to top 5
  },

  /**
   * Extract max price from past lessons
   */
  extractMaxPrice(lessons: Lesson[], student: User): number | undefined {
    if (lessons.length === 0) return undefined;

    const prices = lessons
      .map(lesson => lesson.price)
      .filter((price): price is number => price !== undefined && price > 0);

    if (prices.length === 0) return undefined;

    // Use average of past lesson prices + 20% as max
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    return Math.ceil(avgPrice * 1.2);
  },

  /**
   * Score lesson type match
   */
  scoreLessonTypeMatch(
    preferredType?: 'private' | 'group' | 'workshop' | 'any',
    instructor?: User
  ): number {
    if (!preferredType || preferredType === 'any') return 70; // Neutral if no preference
    
    // Most instructors can teach all types, but we can check if they specialize
    // For now, return a neutral score since lesson type is more about availability
    return 70;
  },

  /**
   * Score instructor gender match
   */
  scoreInstructorGenderMatch(
    preferredGender?: string,
    instructorGender?: string
  ): number {
    if (!preferredGender || preferredGender === 'any' || !instructorGender) return 100;
    
    if (preferredGender === instructorGender.toLowerCase()) return 100;
    
    return 50; // Partial match if not exact
  },

  /**
   * Score instructor experience match based on student preference
   */
  scoreInstructorExperienceMatch(
    preferredExperience?: string,
    instructorYears?: number
  ): number {
    if (!preferredExperience || preferredExperience === 'any' || !instructorYears) return 70;
    
    const experienceRanges: Record<string, { min: number; max: number }> = {
      'beginner': { min: 1, max: 3 },
      'intermediate': { min: 3, max: 5 },
      'advanced': { min: 5, max: 10 },
      'expert': { min: 10, max: Infinity }
    };
    
    const range = experienceRanges[preferredExperience];
    if (!range) return 70;
    
    if (instructorYears >= range.min && instructorYears <= range.max) return 100;
    if (instructorYears > range.max) return 85; // More experienced is usually fine
    return 50; // Less experienced than preferred
  },

  /**
   * Score learning style match
   */
  scoreLearningStyleMatch(
    studentLearningStyle?: string,
    instructor?: User
  ): number {
    if (!studentLearningStyle) return 70;
    
    // This is a simplified match - in a real system, instructors might have teaching styles
    // For now, we'll use a neutral score since we don't track instructor teaching styles yet
    // This could be enhanced by analyzing instructor bio, feedback, etc.
    return 70;
  }
};

