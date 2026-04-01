import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Snowflake, ChevronRight, ChevronLeft, Plus, X, CheckCircle2, Sparkles } from 'lucide-react';
import { StudentLevelQuestionnaire } from '../components/StudentLevelQuestionnaire';
import { createKidProfile } from '../services/kids';
import { KidProfile, LessonSport, SkiPassType } from '../types';
import { disciplineAvatarDataUrl } from '../utils/disciplineAvatar';
import { auth } from '../lib/firebase';
import { ResponsiveModalPanel } from '../components/common/ResponsiveModalPanel';

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
  discipline: LessonSport;
  interests: string[];
  hasKids: boolean;
  termsAccepted: boolean;
  newsletter: boolean;
  // New fields for AI matching
  preferredLocations: string[];
  preferredLanguages: string[];
  learningGoals: string[];
  preferredInstructorGender: string;
  learningStyle: string;
  skiPass: SkiPassType;
}

interface FormErrors {
  [key: string]: string;
}

type SignupStepHelp = {
  label: string;
  headline: string;
  body: string;
  matchingBullets?: string[];
};

/** Firebase-style IDs only — avoids open redirects via query string. */
function isSafeInstructorIdParam(id: string | null): id is string {
  if (!id || id.length > 128) return false;
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

const SIGNUP_STEP_HELP: SignupStepHelp[] = [
  {
    label: 'Account',
    headline: 'Create your login',
    body: 'We use email and password so you can return to bookings, messages, and lesson history. Phone and address help coaches or logistics reach you when plans shift—you can keep them minimal if you prefer.',
  },
  {
    label: 'Skills & style',
    headline: 'Level and how you ride',
    body: 'Discipline (ski vs snowboard), the short questionnaire, interests, and bio describe where you are on snow. That profile feeds browse filters, recommendations, and matching when you describe a lesson—honest answers mean better instructor fits.',
    matchingBullets: [
      'The questionnaire maps you to a clear skill level instructors expect',
      'Interests highlight parks, powder, carving, racing, and more',
      'You can update level and bio anytime from your profile',
    ],
  },
  {
    label: 'Matching prefs',
    headline: 'Fine-tune coach fit',
    body: 'Pass type, favorite resorts, languages, goals, instructor gender preference, and learning style are all optional. They narrow suggestions toward coaches who teach where you ski and how you like to learn—skip anything you are unsure about.',
    matchingBullets: [
      'Resorts + pass: align with where you actually hold a ticket',
      'Goals + learning style: match teaching tone to how you progress best',
    ],
  },
  {
    label: 'Family',
    headline: 'Kids on snow',
    body: 'If children will take lessons, add a short profile per kid (age, level, colors, emergency contact) so bookings stay accurate and safe. If this is only for you, you will skip adding profiles here.',
  },
  {
    label: 'Finish',
    headline: 'Review and start',
    body: 'Accept the terms to complete signup. You will land on your dashboard next—you can refine photos, level, and preferences before you book your first lesson.',
  },
];

function SignupAside({
  step,
  help,
  allSteps,
}: {
  step: number;
  help: SignupStepHelp;
  allSteps: SignupStepHelp[];
}) {
  return (
    <div className="sticky top-24 space-y-8 rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-md shadow-slate-200/40 backdrop-blur-sm">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">How signup works</h2>
        <ol className="mt-4 space-y-3">
          {allSteps.map((h, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <li key={n} className="flex gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                      : done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                  aria-hidden
                >
                  {done ? <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} /> : n}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className={`text-sm font-semibold ${active ? 'text-slate-900' : 'text-slate-700'}`}>
                    {h.label}
                  </p>
                  <p className="text-xs text-slate-500">{h.headline}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="border-t border-slate-100 pt-6">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" aria-hidden />
          <div>
            <h3 className="font-semibold text-slate-900">{help.headline}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{help.body}</p>
            {help.matchingBullets && help.matchingBullets.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                {help.matchingBullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="font-bold text-blue-500">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileStepHelp({ help }: { help: SignupStepHelp }) {
  return (
    <div className="mb-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/90 to-slate-50 p-4 lg:hidden">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-800">This step</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{help.headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{help.body}</p>
      {help.matchingBullets && help.matchingBullets.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {help.matchingBullets.map((b) => (
            <li key={b} className="flex gap-2 pl-0.5">
              <span className="text-blue-500">·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function StudentSignup() {
  const { signup, user } = useAuth();
  const [searchParams] = useSearchParams();
  const instructorIdFromQuery = searchParams.get('instructorId');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showKidForm, setShowKidForm] = useState(false);
  const [kidProfiles, setKidProfiles] = useState<Partial<KidProfile>[]>([]);
  const [signupCompleted, setSignupCompleted] = useState(false);
  const navigate = useNavigate();

  const postSignupPath = useMemo(() => {
    if (instructorIdFromQuery && isSafeInstructorIdParam(instructorIdFromQuery)) {
      return '/book-lesson#ai-matching';
    }
    return '/dashboard?showProfilePopup=true';
  }, [instructorIdFromQuery]);
  
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
    discipline: 'skiing',
    interests: [],
    hasKids: false,
    termsAccepted: false,
    newsletter: false,
    // New fields for AI matching
    preferredLocations: [],
    preferredLanguages: [],
    learningGoals: [],
    preferredInstructorGender: 'any',
    learningStyle: 'balanced',
    skiPass: 'none'
  });
  
  // After signup, redirect when auth user is ready (dashboard or Book Lesson → AI matching from query)
  useEffect(() => {
    if (signupCompleted && user) {
      navigate(postSignupPath, { replace: true });
    }
  }, [signupCompleted, user, navigate, postSignupPath]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

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
      // Preferences validation - all optional but helpful
    }

    if (currentStep === 4) {
      // Kid profiles validation happens in the KidProfileForm component
    }

    if (currentStep === 5) {
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
    if (isSubmitting || step !== 5) return;

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
        avatar: disciplineAvatarDataUrl(formData.discipline),
        bio: formData.bio || '',
        phone: formData.phone,
        address: formData.address,
        level: formData.level,
        discipline: formData.discipline,
        specialties: formData.interests,
        // New preference fields for AI matching
        preferredLocations: formData.preferredLocations,
        languages: formData.preferredLanguages,
        // Store additional preferences in a studentPreferences object
        studentPreferences: {
          learningGoals: formData.learningGoals,
          preferredInstructorGender: formData.preferredInstructorGender,
          learningStyle: formData.learningStyle,
          skiPass: formData.skiPass
        },
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
                discipline: profile.discipline || 'skiing',
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

      console.log('Signup completed successfully, navigating...', postSignupPath);
      setSignupCompleted(true);

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

  const stepHelp = SIGNUP_STEP_HELP[step - 1] ?? SIGNUP_STEP_HELP[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white py-10 px-4 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center lg:mb-10 lg:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 lg:mx-0">
            <Snowflake className="h-8 w-8 text-blue-600" aria-hidden />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Create your student account
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 lg:mx-0 lg:text-base">
            Five steps: secure your account, tell us how you ride (for level and matching), optional preferences
            for instructor fit, kid profiles if needed, then terms. Account fields and preferences can be edited
            anytime in your profile after signup.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          <aside className="hidden lg:col-span-5 lg:block xl:col-span-4">
            <SignupAside step={step} help={stepHelp} allSteps={SIGNUP_STEP_HELP} />
          </aside>

          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-8">
              <MobileStepHelp help={stepHelp} />

              <div className="mb-8">
                <p className="text-center text-sm text-gray-600 lg:text-left">
                  <span className="font-semibold text-gray-900">Step {step} of 5</span>
                  <span className="mx-2 text-gray-300" aria-hidden>
                    ·
                  </span>
                  <span>{stepHelp.label}</span>
                </p>
                <div
                  className="mt-3 flex gap-1.5 sm:justify-center lg:justify-start"
                  aria-hidden
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className={`h-2 max-w-24 min-w-0 flex-1 rounded-full transition-colors ${
                        s < step ? 'bg-blue-400' : s === step ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          {errors.submit ? (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {errors.submit}
            </div>
          ) : null}

          {step === 1 && (
            <div className="space-y-4">
              <p className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700">
                Use a personal email you check often—this is how we send booking confirmations and password resets.
                Phone and address are optional on this step but help if an instructor needs to coordinate on the mountain.
              </p>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.name ? (
                  <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.email ? (
                  <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.password ? (
                  <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.password}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">At least 6 characters.</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.confirmPassword ? (
                  <p id="confirmPassword-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.confirmPassword}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone number <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
                {errors.phone ? (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.phone}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="City, region, or full address—whatever you are comfortable sharing"
                />
                {errors.address ? (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.address}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50/90 p-4 text-sm leading-relaxed text-blue-950">
                <p className="font-semibold text-blue-900">Used for level and matching</p>
                <p className="mt-2 text-blue-900/90">
                  Answers here become your default skill level and ride style across the app. Instructors and
                  search tools use them to suggest appropriate lessons; the home matching flow also leans on this
                  profile when you describe what you want to work on.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Primary discipline</label>
                <p className="mb-3 text-xs text-gray-500">
                  Ski and snowboard are tracked separately—pick what you mainly ride. You can add the other sport later
                  from your profile if you do both.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'skiing' as const, label: 'Skiing', hint: 'Alpine / downhill', icon: '⛷️' },
                      { id: 'snowboarding' as const, label: 'Snowboarding', hint: 'Single board', icon: '🏂' }
                    ] as const
                  ).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, discipline: opt.id }))}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        formData.discipline === opt.id
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl" aria-hidden>
                        {opt.icon}
                      </span>
                      <div className="mt-2 font-semibold text-gray-900">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-800">Skill questionnaire</p>
                <p className="mb-3 text-xs text-gray-500">
                  There are no wrong answers—we map your responses to a standard level so coaches know what to expect
                  before you meet.
                </p>
                <StudentLevelQuestionnaire onLevelSelect={handleLevelSelect} />
              </div>
              
              {/* Avatar Upload - Temporarily Disabled */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={disciplineAvatarDataUrl(formData.discipline)}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 bg-white"
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Interests</label>
                <p className="mb-2 text-xs text-gray-500">
                  Choose anything that excites you on snow. We use this to highlight relevant coaches and terrain
                  when you browse or match.
                </p>
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

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-blue-50 p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-blue-950">Matching preferences (all optional)</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-900/90">
                  Nothing here blocks signup. When you search, book, or use lesson matching, we combine these choices
                  with your level from the last step to surface coaches who teach where you ski, speak your languages,
                  and fit how you like to learn. Skip anything you are not sure about—you can complete it from your
                  profile before your first booking.
                </p>
              </div>

              {/* Season pass — Book Lesson defaults */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season pass (optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  We use this to highlight compatible resorts when you book. Choose the closest match.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'none' as const, label: 'Not sure / day tickets' },
                      { value: 'ikon' as const, label: 'Ikon' },
                      { value: 'epic' as const, label: 'Epic' },
                      { value: 'both' as const, label: 'Ikon & Epic' },
                      { value: 'independent' as const, label: 'Indy / other pass' }
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, skiPass: opt.value }))}
                      className={`rounded-xl px-3 py-2 text-sm font-medium border-2 transition-colors ${
                        formData.skiPass === opt.value
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Locations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Resorts/Locations
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Aspen', 'Vail', 'Breckenridge', 'Park City', 'Deer Valley', 'Jackson Hole', 'Big Sky', 'Telluride'].map((location) => (
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Languages (optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['English', 'Spanish', 'French', 'German', 'Italian', 'Japanese'].map((language) => (
                    <label key={language} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferredLanguages.includes(language)}
                        onChange={(e) => {
                          const newLanguages = e.target.checked
                            ? [...formData.preferredLanguages, language]
                            : formData.preferredLanguages.filter(l => l !== language);
                          setFormData(prev => ({ ...prev, preferredLanguages: newLanguages }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 text-sm">{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Learning Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Goals (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Improve Technique', 'Learn New Skills', 'Build Confidence', 'Prepare for Competition', 'Safety Training', 'Have Fun'].map((goal) => (
                    <label key={goal} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.learningGoals.includes(goal)}
                        onChange={(e) => {
                          const newGoals = e.target.checked
                            ? [...formData.learningGoals, goal]
                            : formData.learningGoals.filter(g => g !== goal);
                          setFormData(prev => ({ ...prev, learningGoals: newGoals }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Instructor Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Instructor Gender
                </label>
                <select
                  value={formData.preferredInstructorGender}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredInstructorGender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="any">No Preference</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>

              {/* Learning Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Style
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'structured', label: 'Structured - I prefer clear plans and step-by-step instruction' },
                    { value: 'balanced', label: 'Balanced - Mix of structure and flexibility' },
                    { value: 'flexible', label: 'Flexible - I like to adapt and explore as we go' }
                  ].map((style) => (
                    <label key={style.value} className="flex items-start">
                      <input
                        type="radio"
                        name="learningStyle"
                        checked={formData.learningStyle === style.value}
                        onChange={() => setFormData(prev => ({ ...prev, learningStyle: style.value }))}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 text-sm">{style.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && formData.hasKids && (
            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-gray-600">
                Add one profile per child who will take lessons. Details stay on your account for faster booking and
                safety; instructors see what you choose to share when you book for them.
              </p>
              <h3 className="text-lg font-medium text-gray-900">Kid profiles</h3>
              
              {kidProfiles.map((profile, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{profile.name || 'Unnamed Profile'}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {profile.discipline === 'snowboarding' ? 'Snowboard' : 'Ski'}
                        {profile.age != null ? ` · age ${profile.age}` : ''}
                      </p>
                    </div>
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

          {step === 4 && !formData.hasKids && (
            <div className="py-8 text-center">
              <p className="text-gray-600">
                You indicated lessons are just for you—no kid profiles needed. Tap <strong>Next</strong> to review terms.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 text-lg font-semibold text-blue-950">Almost there</h3>
                <p className="text-sm leading-relaxed text-blue-900/90">
                  Accept the terms to create your account. You can update level, matching preferences, and photos from
                  your dashboard before you book.
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
              {step < 5 ? (
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
        </div>
      </div>

      {showKidForm && (
        <ResponsiveModalPanel onClose={() => setShowKidForm(false)} labelledBy="signup-kid-profile-title">
          <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={() => setShowKidForm(false)}
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
            <h2
              id="signup-kid-profile-title"
              className="mb-6 text-2xl font-bold text-gray-900 dark:text-white"
            >
              Add Kid Profile
            </h2>

            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const profile = {
                  name: formData.get('name') as string,
                  age: parseInt(formData.get('age') as string),
                  discipline: (formData.get('discipline') as LessonSport | null) || 'skiing',
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
                    <p className="block text-sm font-medium text-gray-700 mb-2">Discipline</p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="discipline" value="skiing" defaultChecked className="text-blue-600" />
                        <span className="text-sm text-gray-800">Skiing</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="discipline" value="snowboarding" className="text-blue-600" />
                        <span className="text-sm text-gray-800">Snowboarding</span>
                      </label>
                    </div>
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
        </ResponsiveModalPanel>
      )}
    </div>
  );
}