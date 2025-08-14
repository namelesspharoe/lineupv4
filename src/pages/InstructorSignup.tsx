import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Snowflake, ChevronRight, Camera, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  bio: string;
  certifications: string[];
  languages: string[];
  yearsOfExperience: number;
  hourlyRate: number;
  preferredLocations: string[];
  qualifications: string;
  specialties: string[];
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    bio: '',
    certifications: [],
    languages: [],
    yearsOfExperience: 0,
    hourlyRate: 0,
    preferredLocations: [],
    qualifications: '',
    specialties: []
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Track blob URLs for cleanup
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup effect for any remaining blob URLs
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

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
      if (formData.certifications.length === 0) newErrors.certifications = 'At least one certification is required';
      if (formData.languages.length === 0) newErrors.languages = 'At least one language is required';
    }

    if (currentStep === 3) {
      if (!formData.bio) newErrors.bio = 'Bio is required';
      if (!formData.qualifications) newErrors.qualifications = 'Qualifications are required';
      if (formData.specialties.length === 0) newErrors.specialties = 'At least one specialty is required';
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

      await signup(formData.email, formData.password, {
        name: formData.name,
        email: formData.email,
        role: 'instructor',
        avatar: formData.avatar,
        bio: formData.bio,
        certifications: formData.certifications,
        languages: formData.languages,
        yearsOfExperience: formData.yearsOfExperience,
        hourlyRate: formData.hourlyRate,
        preferredLocations: formData.preferredLocations,
        qualifications: formData.qualifications,
        specialties: formData.specialties
      });

      navigate('/');

    } catch (error: any) {
      console.error('Signup error:', error);
      setErrors({ 
        submit: error.message || 'An error occurred during signup'
      });
    } finally {
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
          {[1, 2, 3].map((s) => (
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
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                  Years of Experience
                </label>
                <input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.yearsOfExperience && <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>}
              </div>

              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                  Hourly Rate ($)
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.hourlyRate && <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications
                </label>
                <div className="space-y-2">
                  {['PSIA Level 1', 'PSIA Level 2', 'PSIA Level 3', 'AASI', 'First Aid', 'Avalanche Safety'].map((cert) => (
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
                      <span className="ml-2 text-gray-700">{cert}</span>
                    </label>
                  ))}
                </div>
                {errors.certifications && <p className="mt-1 text-sm text-red-600">{errors.certifications}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <div className="space-y-2">
                  {['English', 'Spanish', 'French', 'German', 'Italian', 'Japanese'].map((lang) => (
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
                      <span className="ml-2 text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
                {errors.languages && <p className="mt-1 text-sm text-red-600">{errors.languages}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                <div className="mt-1 flex items-center justify-center">
                  <div className="relative">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile"
                        className="h-32 w-32 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about your teaching experience..."
                />
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
                  placeholder="List any additional qualifications..."
                />
                {errors.qualifications && <p className="mt-1 text-sm text-red-600">{errors.qualifications}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <div className="space-y-2">
                  {['Alpine Skiing', 'Snowboarding', 'Cross-Country', 'Freestyle', 'Racing', 'Children'].map((specialty) => (
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
                      <span className="ml-2 text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>
                {errors.specialties && <p className="mt-1 text-sm text-red-600">{errors.specialties}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            {step < 3 ? (
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
        </form>
      </div>
    </div>
  );
}