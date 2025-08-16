import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Testimonial {
  id: string;
  studentName: string;
  studentAvatar: string;
  instructorName: string;
  rating: number;
  comment: string;
  lessonType: string;
  skillLevel: string;
  date: string;
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setIsLoading(true);
        
        // Fetch completed lessons with reviews
        const lessonsQuery = query(
          collection(db, 'lessons'),
          where('status', '==', 'completed'),
          limit(20)
        );
        
        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessonsWithReviews = lessonsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(lesson => lesson.studentReviews && lesson.studentReviews.length > 0);

        // Process testimonials from reviews
        const processedTestimonials: Testimonial[] = [];
        
        for (const lesson of lessonsWithReviews) {
          for (const review of lesson.studentReviews) {
            if (review.rating >= 4 && review.comment) {
              // Get student and instructor names
              let studentName = 'Anonymous Student';
              let instructorName = 'Our Instructor';
              let studentAvatar = `https://images.unsplash.com/photo-${1500000000000 + Math.random()}?w=100`;
              
              try {
                // Get student name
                const studentDoc = await getDocs(query(
                  collection(db, 'users'),
                  where('id', '==', review.studentId)
                ));
                if (!studentDoc.empty) {
                  const studentData = studentDoc.docs[0].data();
                  studentName = studentData.name || studentName;
                  studentAvatar = studentData.avatar || studentAvatar;
                }

                // Get instructor name
                const instructorDoc = await getDocs(query(
                  collection(db, 'users'),
                  where('id', '==', lesson.instructorId)
                ));
                if (!instructorDoc.empty) {
                  const instructorData = instructorDoc.docs[0].data();
                  instructorName = instructorData.name || instructorName;
                }
              } catch (error) {
                console.log('Could not fetch user names for testimonial');
              }

              processedTestimonials.push({
                id: `${lesson.id}-${review.studentId}`,
                studentName,
                studentAvatar,
                instructorName,
                rating: review.rating,
                comment: review.comment,
                lessonType: lesson.type || 'private',
                skillLevel: lesson.skillLevel || 'beginner',
                date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'
              });
            }
          }
        }

        // Shuffle and limit to 6 testimonials
        const shuffled = processedTestimonials.sort(() => 0.5 - Math.random());
        setTestimonials(shuffled.slice(0, 6));
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Fallback testimonials
        setTestimonials([
          {
            id: '1',
            studentName: 'Sarah Johnson',
            studentAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
            instructorName: 'Mike Chen',
            rating: 5,
            comment: 'My instructor Mike was incredible! I went from never skiing to confidently tackling blue runs in just 5 lessons. The personalized approach made all the difference.',
            lessonType: 'private',
            skillLevel: 'beginner',
            date: '2 weeks ago'
          },
          {
            id: '2',
            studentName: 'David Rodriguez',
            studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            instructorName: 'Emma Wilson',
            rating: 5,
            comment: 'Emma helped me perfect my carving technique and build confidence on steeper terrain. Her attention to detail and patience are unmatched!',
            lessonType: 'private',
            skillLevel: 'intermediate',
            date: '1 month ago'
          },
          {
            id: '3',
            studentName: 'Lisa Thompson',
            studentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
            instructorName: 'Alex Martinez',
            rating: 5,
            comment: 'As a complete beginner, I was nervous about learning to snowboard. Alex made me feel comfortable and safe while teaching me proper technique.',
            lessonType: 'private',
            skillLevel: 'beginner',
            date: '3 weeks ago'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gray-800">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold mb-6">
            <Quote className="w-5 h-5" />
            Real Stories from Real Students
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What Our Students
            <span className="block text-green-400">
              Are Saying
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Hear from students who have transformed their skiing and snowboarding skills 
            with our certified instructors.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-600"
            >
              <ChevronLeft className="w-6 h-6 text-gray-300" />
            </button>
            
            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-600"
            >
              <ChevronRight className="w-6 h-6 text-gray-300" />
            </button>

            {/* Testimonial Card */}
            <div className="bg-gray-900 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-700">
              <div className="text-center">
                {/* Quote Icon */}
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Quote className="w-8 h-8 text-white" />
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${i < testimonials[currentIndex].rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <blockquote className="text-xl text-gray-300 leading-relaxed mb-8 italic">
                  "{testimonials[currentIndex].comment}"
                </blockquote>

                {/* Student Info */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <img
                    src={testimonials[currentIndex].studentAvatar}
                    alt={testimonials[currentIndex].studentName}
                    className="w-16 h-16 rounded-full object-cover border-4 border-gray-700 shadow-lg"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-white">{testimonials[currentIndex].studentName}</p>
                    <p className="text-sm text-gray-400">
                      {testimonials[currentIndex].lessonType} lesson with {testimonials[currentIndex].instructorName}
                    </p>
                  </div>
                </div>

                {/* Lesson Details */}
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {testimonials[currentIndex].skillLevel}
                  </span>
                  <span>•</span>
                  <span>{testimonials[currentIndex].date}</span>
                </div>
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">98%</p>
            <p className="text-gray-400">Satisfaction Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">4.9/5</p>
            <p className="text-gray-400">Average Rating</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">2,500+</p>
            <p className="text-gray-400">Happy Students</p>
          </div>
        </div>
      </div>
    </section>
  );
}
