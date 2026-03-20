import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Mountain } from '../types';
import { getMountains } from '../services/mountains';

const FALLBACK_MOUNTAINS = [
  'Aspen',
  'Vail',
  'Breckenridge',
  'Park City',
  'Deer Valley',
  'Jackson Hole',
  'Big Sky',
  'Telluride',
  'Whistler',
  'Sun Valley'
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  bio: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  homeMountain: string;
  mountainId: string;
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
  const [availableMountains, setAvailableMountains] = useState<Mountain[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    bio: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    homeMountain: '',
    mountainId: '',
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

  const mountainOptions = (availableMountains.length > 0
    ? availableMountains.map((mountain) => ({ id: mountain.id, name: mountain.name }))
    : FALLBACK_MOUNTAINS.map((mountain) => ({ id: mountain, name: mountain })));

  useEffect(() => {
    let isMounted = true;

    const loadMountains = async () => {
      try {
        const mountains = await getMountains();
        if (isMounted) {
          setAvailableMountains(mountains);
        }
      } catch (error) {
        console.error('Failed to load mountains:', error);
        if (isMounted) {
          setAvailableMountains([]);
        }
      }
    };

    loadMountains();

    return () => {
      isMounted = false;
    };
  }, []);

  const CERTIFICATION_SPECIALTY_MAP: Record<string, string[]> = {
    'Freestyle Certification': ['Freestyle', 'Terrain Park'],
    'Avalanche Safety': ['Backcountry'],
    'Wilderness First Responder': ['Backcountry']
  };

  const deriveSpecialtiesFromCertifications = (certs: string[], currentSpecialties: string[]) => {
    const specialtiesSet = new Set(currentSpecialties);
    certs.forEach(cert => {
      const mapped = CERTIFICATION_SPECIALTY_MAP[cert];
      if (mapped) {
        mapped.forEach(s => specialtiesSet.add(s));
      }
    });
    return Array.from(specialtiesSet);
  };

  const buildFullAddress = (data: FormData) => {
    const parts = [
      data.street,
      [data.city, data.state].filter(Boolean).join(', '),
      data.zipCode
    ].filter(Boolean);
    return parts.join(', ');
  };



  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.street) newErrors.street = 'Street address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    }

    if (currentStep === 2) {
      if (!formData.homeMountain) newErrors.homeMountain = 'Home mountain is required';
      if (formData.certifications.length === 0) newErrors.certifications = 'At least one certification is required';
      if (formData.languages.length === 0) newErrors.languages = 'At least one language is required';
    }

    if (currentStep === 3) {
      if (!formData.bio) newErrors.bio = 'Bio is required';
      // Note: preferredLocations is collected later in the flow,
      // so we don't block submission on it here.
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
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // Default avatar
        bio: formData.bio,
        phone: formData.phone,
        address: buildFullAddress(formData),
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
        mountainId: formData.mountainId,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <div className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl space-y-8 bg-white p-8 lg:p-10 rounded-2xl shadow-xl">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
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
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1 space-y-3">
                  <div>
                    <input
                      id="street"
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Street address"
                    />
                    {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="City"
                      />
                      {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                    </div>
                    <div>
                      <input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="State"
                      />
                      {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                    </div>
                  </div>
                  <div>
                    <input
                      id="zipCode"
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ZIP code"
                    />
                    {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                  </div>
                </div>
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
                <label htmlFor="homeMountain" className="block text-sm font-medium text-gray-700">
                  Home Mountain <span className="text-red-500">*</span>
                </label>
                <select
                  id="homeMountain"
                  value={formData.mountainId || formData.homeMountain}
                  onChange={(e) => {
                    const selectedMountain = mountainOptions.find((mountain) => mountain.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      mountainId: selectedMountain?.id || '',
                      homeMountain: selectedMountain?.name || e.target.value
                    }));
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select your home mountain</option>
                  {mountainOptions.map((mountain) => (
                    <option key={mountain.id} value={mountain.id}>
                      {mountain.name}
                    </option>
                  ))}
                </select>
                {errors.homeMountain && <p className="mt-1 text-sm text-red-600">{errors.homeMountain}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Admins can reassign your mountain later if needed.
                </p>
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
                    'First Aid', 'CPR', 'Avalanche Safety', 'Wilderness First Responder',
                    'Freestyle Certification'
                  ].map((cert) => (
                    <label key={cert} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.certifications.includes(cert)}
                        onChange={(e) => {
                          const newCerts = e.target.checked
                            ? [...formData.certifications, cert]
                            : formData.certifications.filter(c => c !== cert);
                          setFormData(prev => ({
                            ...prev,
                            certifications: newCerts,
                            specialties: deriveSpecialtiesFromCertifications(newCerts, prev.specialties)
                          }));
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
          </div>
        </form>
      </div>
    </div>
  );
}