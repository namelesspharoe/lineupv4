import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  bio: string;
  phone: string;
  address: string;
  homeMountain: string;
  certifications: string[];
  languages: string[];
  yearsOfExperience: number;
  hourlyRate: number;
  price: number; // Base price for lessons
  preferredLocations: string[];
  qualifications: string;
  specialties: string[];
  level: string; // Instructor skill level
  gender: string; // For matching with student preferences
  teachingStyle: string; // Teaching approach
  ageGroups: string[]; // Who they teach
  lessonTypes: string[]; // Types of lessons offered
  preferredDays: string[]; // Preferred teaching days
  preferredTimes: string[]; // Preferred teaching times
}

interface FormErrors {
  [key: string]: string;
}

export function InstructorSignup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    bio: '',
    phone: '',
    address: '',
    homeMountain: '',
    certifications: [],
    languages: [],
    yearsOfExperience: 0,
    hourlyRate: 0,
    price: 0,
    preferredLocations: [],
    qualifications: '',
    specialties: [],
    level: '',
    gender: '',
    teachingStyle: '',
    ageGroups: [],
    lessonTypes: [],
    preferredDays: [],
    preferredTimes: []
  });




  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentStep === 2) {
      if (!formData.yearsOfExperience) newErrors.yearsOfExperience = 'Years of experience is required';
      if (!formData.hourlyRate) newErrors.hourlyRate = 'Hourly rate is required';
      if (!formData.price) newErrors.price = 'Base lesson price is required';
      if (!formData.homeMountain) newErrors.homeMountain = 'Home mountain is required';
      if (!formData.level) newErrors.level = 'Skill level is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (formData.certifications.length === 0) newErrors.certifications = 'At least one certification is required';
      if (formData.languages.length === 0) newErrors.languages = 'At least one language is required';
    }

    if (currentStep === 3) {
      if (formData.specialties.length === 0) newErrors.specialties = 'At least one specialty is required';
      if (formData.ageGroups.length === 0) newErrors.ageGroups = 'Please select at least one age group';
      if (formData.lessonTypes.length === 0) newErrors.lessonTypes = 'Please select at least one lesson type';
      if (!formData.teachingStyle) newErrors.teachingStyle = 'Teaching style is required';
    }

    if (currentStep === 4) {
      if (!formData.bio) newErrors.bio = 'Bio is required';
      if (formData.preferredLocations.length === 0) newErrors.preferredLocations = 'Please select at least one preferred location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrors({});

      if (!validateStep(step)) {
        setIsSubmitting(false);
        return;
      }

      // Prepare user data with all fields
      const userData: any = {
        name: formData.name,
        email: formData.email,
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // Default avatar
        bio: formData.bio,
        phone: formData.phone,
        address: formData.address,
        homeMountain: formData.homeMountain,
        certifications: formData.certifications,
        languages: formData.languages,
        yearsOfExperience: formData.yearsOfExperience,
        hourlyRate: formData.hourlyRate,
        price: formData.price,
        preferredLocations: formData.preferredLocations,
        qualifications: formData.qualifications,
        specialties: formData.specialties,
        level: formData.level,
        gender: formData.gender,
        // Store additional preferences for matching (as custom field)
        instructorPreferences: {
          teachingStyle: formData.teachingStyle,
          ageGroups: formData.ageGroups,
          lessonTypes: formData.lessonTypes,
          preferredDays: formData.preferredDays,
          preferredTimes: formData.preferredTimes
        },
        createdAt: new Date().toISOString()
      };

      await signup(formData.email, formData.password, userData);

      navigate('/dashboard?showProfilePopup=true');

    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message?.includes('auth/email-already-in-use')) {
        setErrors({
          email: 'This email is already registered. Please use a different email or sign in.'
        });
        setStep(1);
      } else {
        setErrors({ 
          submit: err.message || 'An error occurred during signup'
        });
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Award className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Become an Instructor</h2>
          <p className="mt-2 text-sm text-gray-600">Join our elite team of snow sports professionals</p>
        </div>

        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full ${
                s === step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full address..."
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Professional Information</h3>
                <p className="text-xs text-blue-700">This information helps us match you with the right students</p>
              </div>

              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                  Your Skill Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select your skill level</option>
                  <option value="first_time">First Time</option>
                  <option value="developing_turns">Developing Turns</option>
                  <option value="linking_turns">Linking Turns</option>
                  <option value="confident_turns">Confident Turns</option>
                  <option value="consistent_blue">Consistent Blue Runs</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level}</p>}
              </div>

              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                  Years of Teaching Experience <span className="text-red-500">*</span>
                </label>
                <input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5"
                />
                {errors.yearsOfExperience && <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>

              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                  Hourly Rate ($) <span className="text-red-500">*</span>
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 75"
                />
                {errors.hourlyRate && <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Base Lesson Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 150"
                />
                <p className="mt-1 text-xs text-gray-500">Standard price for a typical lesson</p>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              <div>
                <label htmlFor="homeMountain" className="block text-sm font-medium text-gray-700">
                  Home Mountain <span className="text-red-500">*</span>
                </label>
                <input
                  id="homeMountain"
                  type="text"
                  value={formData.homeMountain}
                  onChange={(e) => setFormData(prev => ({ ...prev, homeMountain: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Vail, Aspen, Breckenridge"
                />
                {errors.homeMountain && <p className="mt-1 text-sm text-red-600">{errors.homeMountain}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'PSIA Level 1', 'PSIA Level 2', 'PSIA Level 3', 
                    'AASI Level 1', 'AASI Level 2', 'AASI Level 3',
                    'CSIA Level 1', 'CSIA Level 2', 'CSIA Level 3',
                    'BASI Level 1', 'BASI Level 2', 'BASI Level 3',
                    'First Aid', 'CPR', 'Avalanche Safety', 'Wilderness First Responder'
                  ].map((cert) => (
                    <label key={cert} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.certifications.includes(cert)}
                        onChange={(e) => {
                          const newCerts = e.target.checked
                            ? [...formData.certifications, cert]
                            : formData.certifications.filter(c => c !== cert);
                          setFormData(prev => ({ ...prev, certifications: newCerts }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{cert}</span>
                    </label>
                  ))}
                </div>
                {errors.certifications && <p className="mt-1 text-sm text-red-600">{errors.certifications}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages Spoken <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['English', 'Spanish', 'French', 'German', 'Italian', 'Japanese', 'Portuguese', 'Russian', 'Chinese', 'Korean'].map((lang) => (
                    <label key={lang} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.languages.includes(lang)}
                        onChange={(e) => {
                          const newLangs = e.target.checked
                            ? [...formData.languages, lang]
                            : formData.languages.filter(l => l !== lang);
                          setFormData(prev => ({ ...prev, languages: newLangs }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
                {errors.languages && <p className="mt-1 text-sm text-red-600">{errors.languages}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Teaching Preferences</h3>
                <p className="text-xs text-blue-700">Help us match you with students who fit your teaching style</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Alpine Skiing', 'Snowboarding', 'Cross-Country Skiing', 
                    'Freestyle', 'Racing', 'Backcountry', 'Moguls',
                    'Youth Instruction', 'Adult Instruction', 'Senior Instruction',
                    'Adaptive Skiing', 'Terrain Park', 'Powder Skiing',
                    'Carving', 'Off-Piste', 'Freeride'
                  ].map((specialty) => (
                    <label key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={(e) => {
                          const newSpecialties = e.target.checked
                            ? [...formData.specialties, specialty]
                            : formData.specialties.filter(s => s !== specialty);
                          setFormData(prev => ({ ...prev, specialties: newSpecialties }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>
                {errors.specialties && <p className="mt-1 text-sm text-red-600">{errors.specialties}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Groups You Teach <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Kids (3-7)', 'Children (8-12)', 'Teens (13-17)', 'Adults (18-64)', 'Seniors (65+)'].map((ageGroup) => (
                    <label key={ageGroup} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.ageGroups.includes(ageGroup)}
                        onChange={(e) => {
                          const newAgeGroups = e.target.checked
                            ? [...formData.ageGroups, ageGroup]
                            : formData.ageGroups.filter(a => a !== ageGroup);
                          setFormData(prev => ({ ...prev, ageGroups: newAgeGroups }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{ageGroup}</span>
                    </label>
                  ))}
                </div>
                {errors.ageGroups && <p className="mt-1 text-sm text-red-600">{errors.ageGroups}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Types You Offer <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Private Lessons', 'Group Lessons', 'Workshops', 'Multi-Day Programs'].map((lessonType) => (
                    <label key={lessonType} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.lessonTypes.includes(lessonType)}
                        onChange={(e) => {
                          const newLessonTypes = e.target.checked
                            ? [...formData.lessonTypes, lessonType]
                            : formData.lessonTypes.filter(l => l !== lessonType);
                          setFormData(prev => ({ ...prev, lessonTypes: newLessonTypes }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{lessonType}</span>
                    </label>
                  ))}
                </div>
                {errors.lessonTypes && <p className="mt-1 text-sm text-red-600">{errors.lessonTypes}</p>}
              </div>

              <div>
                <label htmlFor="teachingStyle" className="block text-sm font-medium text-gray-700">
                  Teaching Style <span className="text-red-500">*</span>
                </label>
                <select
                  id="teachingStyle"
                  value={formData.teachingStyle}
                  onChange={(e) => setFormData(prev => ({ ...prev, teachingStyle: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select your teaching style</option>
                  <option value="patient">Patient & Encouraging</option>
                  <option value="energetic">Energetic & Fun</option>
                  <option value="technical">Technical & Detailed</option>
                  <option value="challenging">Challenging & Motivational</option>
                  <option value="balanced">Balanced Approach</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">How would you describe your teaching approach?</p>
                {errors.teachingStyle && <p className="mt-1 text-sm text-red-600">{errors.teachingStyle}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Teaching Days (Optional)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferredDays.includes(day)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...formData.preferredDays, day]
                            : formData.preferredDays.filter(d => d !== day);
                          setFormData(prev => ({ ...prev, preferredDays: newDays }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-1 text-xs text-gray-700">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Teaching Times (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Morning (8am-12pm)', 'Afternoon (12pm-4pm)', 'Evening (4pm-8pm)', 'Full Day'].map((time) => (
                    <label key={time} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferredTimes.includes(time)}
                        onChange={(e) => {
                          const newTimes = e.target.checked
                            ? [...formData.preferredTimes, time]
                            : formData.preferredTimes.filter(t => t !== time);
                          setFormData(prev => ({ ...prev, preferredTimes: newTimes }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{time}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Profile & Location</h3>
                <p className="text-xs text-blue-700">Complete your profile to attract more students</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                <div className="mt-1 flex items-center justify-center">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                      alt="Profile"
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Profile pictures can be added after signup
                </p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bio"
                  rows={5}
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about your teaching experience, background, and what makes you a great instructor..."
                />
                <p className="mt-1 text-xs text-gray-500">This will be visible to students looking for instructors</p>
                {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
              </div>

              <div>
                <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700">
                  Additional Qualifications
                </label>
                <textarea
                  id="qualifications"
                  rows={3}
                  value={formData.qualifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List any additional qualifications, awards, or achievements..."
                />
                {errors.qualifications && <p className="mt-1 text-sm text-red-600">{errors.qualifications}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Locations <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Aspen', 'Vail', 'Breckenridge', 'Park City', 'Deer Valley', 'Jackson Hole', 'Big Sky', 'Telluride', 'Whistler', 'Sun Valley'].map((location) => (
                    <label key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferredLocations.includes(location)}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...formData.preferredLocations, location]
                            : formData.preferredLocations.filter(l => l !== location);
                          setFormData(prev => ({ ...prev, preferredLocations: newLocations }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
                {errors.preferredLocations && <p className="mt-1 text-sm text-red-600">{errors.preferredLocations}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <div className="ml-auto">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-2 bg-blue-600 text-white rounded-lg transition-colors ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Creating Account...' : 'Complete Signup'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}