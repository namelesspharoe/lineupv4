import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Snowflake, ChevronRight, ChevronLeft, Plus, X } from 'lucide-react';
import { StudentLevelQuestionnaire } from '../components/StudentLevelQuestionnaire';
import { createKidProfile } from '../services/kids';
import { KidProfile } from '../types';
import { auth } from '../lib/firebase';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  bio: string;
  phone: string;
  address: string;
  level: 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue';
  interests: string[];
  hasKids: boolean;
  termsAccepted: boolean;
  newsletter: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function StudentSignup() {
  const { signup, user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showKidForm, setShowKidForm] = useState(false);
  const [kidProfiles, setKidProfiles] = useState<Partial<KidProfile>[]>([]);
  const [signupCompleted, setSignupCompleted] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: '',
    bio: '',
    phone: '',
    address: '',
    level: 'first_time',
    interests: [],
    hasKids: false,
    termsAccepted: false,
    newsletter: false
  });
  
  // Navigate to dashboard when user is available after signup
  useEffect(() => {
    if (signupCompleted && user) {
      console.log('User state updated, navigating to dashboard...');
      navigate('/dashboard');
    }
  }, [signupCompleted, user, navigate]);

  // Avatar upload temporarily disabled
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Function disabled for now
  };

  const handleLevelSelect = (level: string) => {
    setFormData(prev => ({ 
      ...prev, 
      level: level as 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue'
    }));
  };

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
      if (!formData.level) newErrors.level = 'Please complete the skill assessment';
      if (formData.interests.length === 0) newErrors.interests = 'Select at least one interest';
    }

    if (currentStep === 3) {
      // Kid profiles validation happens in the KidProfileForm component
    }

    if (currentStep === 4) {
      if (!formData.termsAccepted) newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || step !== 4) return;

    try {
      setIsSubmitting(true);
      setErrors({});

      if (!validateStep(step)) {
        setIsSubmitting(false);
        return;
      }

      // Sign up the user first
      const userData = {
        name: formData.name,
        email: formData.email,
        role: 'student' as const,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // Default avatar
        bio: formData.bio || '',
        phone: formData.phone,
        address: formData.address,
        level: formData.level,
        specialties: formData.interests,
        createdAt: new Date().toISOString()
      };
      
      await signup(formData.email, formData.password, userData);
      console.log('User created successfully');

      // If user has kids, create kid profiles
      if (formData.hasKids && kidProfiles.length > 0) {
        // Get the current user from auth context
        const currentUser = auth.currentUser;
        console.log('Creating kid profiles for user:', currentUser?.uid);
        console.log('Kid profiles to create:', kidProfiles);
        
        if (currentUser) {
          for (const profile of kidProfiles) {
            try {
              console.log('Creating kid profile:', profile);
              const kidProfileData = {
                parentId: currentUser.uid,
                name: profile.name || '',
                age: profile.age || 5,
                allergies: profile.allergies || '',
                helmet_color: profile.helmet_color || '#000000',
                jacket_color: profile.jacket_color || '#000000',
                pants_color: profile.pants_color || '#000000',
                level: profile.level || 'first_time',
                emergency_contact_name: profile.emergency_contact_name || '',
                emergency_contact_phone: profile.emergency_contact_phone || '',
                emergency_contact_relationship: profile.emergency_contact_relationship || ''
              };
              
              console.log('Kid profile data to save:', kidProfileData);
              await createKidProfile(kidProfileData);
              console.log('Kid profile created successfully');
            } catch (kidError: any) {
              console.error('Error creating kid profile:', kidError);
              throw new Error(`Failed to create kid profile: ${kidError.message}`);
            }
          }
        } else {
          console.error('No current user found after signup');
          throw new Error('User authentication failed after signup');
        }
      } else {
        console.log('No kid profiles to create');
      }

      console.log('Signup completed successfully, navigating to dashboard...');
      setSignupCompleted(true);
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
            <Snowflake className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join our community of snow sports enthusiasts</p>
        </div>

        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full ${
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
            <div className="space-y-6">
              <StudentLevelQuestionnaire onLevelSelect={handleLevelSelect} />
              
              {/* Avatar Upload - Temporarily Disabled */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    Profile pictures can be added after signup
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about yourself and your snow sports experience..."
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Skiing', 'Snowboarding', 'Freestyle', 'Backcountry', 'Racing', 'Terrain Park'].map((interest) => (
                    <label key={interest} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={(e) => {
                          const newInterests = e.target.checked
                            ? [...formData.interests, interest]
                            : formData.interests.filter(i => i !== interest);
                          setFormData(prev => ({ ...prev, interests: newInterests }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">{interest}</span>
                    </label>
                  ))}
                </div>
                {errors.interests && <p className="mt-1 text-sm text-red-600">{errors.interests}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you have kids that will be taking lessons?
                </label>
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={formData.hasKids}
                      onChange={() => setFormData(prev => ({ ...prev, hasKids: true }))}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={!formData.hasKids}
                      onChange={() => setFormData(prev => ({ ...prev, hasKids: false }))}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && formData.hasKids && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Kid Profiles</h3>
              
              {kidProfiles.map((profile, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{profile.name || 'Unnamed Profile'}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setKidProfiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowKidForm(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Kid Profile
              </button>
            </div>
          )}

          {step === 3 && !formData.hasKids && (
            <div className="text-center py-8">
              <p className="text-gray-600">No kid profiles to add.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Almost there!</h3>
                <p className="text-blue-700">
                  Please review and accept our terms to complete your registration.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      termsAccepted: e.target.checked 
                    }))}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    I accept the <a href="/terms" className="text-blue-600 hover:text-blue-700">Terms and Conditions</a> and 
                    <a href="/privacy" className="text-blue-600 hover:text-blue-700"> Privacy Policy</a>
                  </span>
                </label>
                {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.newsletter}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      newsletter: e.target.checked 
                    }))}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    I want to receive updates about snow conditions, special offers, and events
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-4 h-4" />
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

      {showKidForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowKidForm(false)} />
          
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
              <button
                onClick={() => setShowKidForm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Kid Profile</h2>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const profile = {
                  name: formData.get('name') as string,
                  age: parseInt(formData.get('age') as string),
                  allergies: formData.get('allergies') as string,
                  helmet_color: formData.get('helmet_color') as string,
                  jacket_color: formData.get('jacket_color') as string,
                  pants_color: formData.get('pants_color') as string,
                  level: formData.get('level') as 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue',
                  emergency_contact_name: formData.get('emergency_contact_name') as string,
                  emergency_contact_phone: formData.get('emergency_contact_phone') as string,
                  emergency_contact_relationship: formData.get('emergency_contact_relationship') as string
                };
                setKidProfiles(prev => [...prev, profile]);
                setShowKidForm(false);
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      name="name"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      name="age"
                      type="number"
                      min="0"
                      max="18"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Helmet Color</label>
                    <input
                      name="helmet_color"
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jacket Color</label>
                    <input
                      name="jacket_color"
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pants Color</label>
                    <input
                      name="pants_color"
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                    <select
                      name="level"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="first_time">First Time</option>
                      <option value="developing_turns">Developing Turns</option>
                      <option value="linking_turns">Linking Turns</option>
                      <option value="confident_turns">Confident Turns</option>
                      <option value="consistent_blue">Consistent Blue</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                    <textarea
                      name="allergies"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="List any allergies or medical conditions..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                    <input
                      name="emergency_contact_name"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                    <input
                      name="emergency_contact_phone"
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Relationship</label>
                    <input
                      name="emergency_contact_relationship"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowKidForm(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}