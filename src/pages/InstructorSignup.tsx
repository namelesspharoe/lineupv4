import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LessonSport, Mountain } from '../types';
import { getMountains } from '../services/mountains';
import { disciplineAvatarDataUrl } from '../utils/disciplineAvatar';

const DISCIPLINE_SPECIALTY: Record<LessonSport, 'Ski' | 'Snowboard'> = {
  skiing: 'Ski',
  snowboarding: 'Snowboard',
};

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
  discipline: LessonSport;
}

interface FormErrors {
  [key: string]: string;
}

const INSTRUCTOR_STEP_HELP: { label: string; headline: string; body: string }[] = [
  {
    label: 'Account & contact',
    headline: 'Your login and reachability',
    body: 'Create secure credentials and share where we can reach you. This information is used for your profile, booking notifications, and verification—not shown publicly in full.',
  },
  {
    label: 'Credentials',
    headline: 'Prove you teach on snow',
    body: 'Primary discipline, home mountain, and certifications help us route you to the right resort ops and student matches. Languages ensure guests who need them can find you.',
  },
  {
    label: 'Profile',
    headline: 'Tell students who you are',
    body: 'Your bio is the main thing learners read before booking. Qualifications and extras build trust; you can refine photos and rates after signup.',
  },
];

const inputFieldClass =
  'block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500';

const inputClassName = `mt-1.5 ${inputFieldClass}`;

function FieldHelper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 ${className}`.trim()}>{children}</p>
  );
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
    specialties: ['Ski'],
    level: '',
    gender: '',
    teachingStyle: '',
    ageGroups: [],
    lessonTypes: [],
    preferredDays: [],
    preferredTimes: [],
    discipline: 'skiing',
  });

  const applyDiscipline = (discipline: LessonSport) => {
    setFormData((prev) => {
      const tag = DISCIPLINE_SPECIALTY[discipline];
      const stripped = prev.specialties.filter((s) => s !== 'Ski' && s !== 'Snowboard');
      return { ...prev, discipline, specialties: [...stripped, tag] };
    });
  };

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
        discipline: formData.discipline,
        avatar: disciplineAvatarDataUrl(formData.discipline),
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

  const stepHelp = INSTRUCTOR_STEP_HELP[step - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/80 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl space-y-8 rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100/80 lg:p-10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50 dark:ring-slate-800">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Award className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-sky-400">
            Instructor application
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Become an instructor</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Join our network of snow sports professionals—three quick steps to get your profile started.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center gap-2 sm:gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-2 sm:max-w-[6.5rem]">
                <div
                  className={`h-2 w-full max-w-[5rem] rounded-full transition-colors ${
                    s === step ? 'bg-blue-600 dark:bg-sky-500' : s < step ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
                <span
                  className={`text-center text-[10px] font-medium uppercase tracking-wide sm:text-xs ${
                    s === step ? 'text-blue-700 dark:text-sky-300' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {INSTRUCTOR_STEP_HELP[s - 1].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {stepHelp && (
          <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/90 to-blue-50/50 px-4 py-3.5 dark:border-sky-900/50 dark:from-sky-950/40 dark:to-slate-800/60">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{stepHelp.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{stepHelp.body}</p>
          </div>
        )}

        <form className="mt-2 space-y-6" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {errors.submit}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={inputClassName}
                  />
                  <FieldHelper>Shown on your public profile as your first name.</FieldHelper>
                  {errors.firstName && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={inputClassName}
                  />
                  <FieldHelper>Shown on your public profile—use the name students should expect.</FieldHelper>
                  {errors.lastName && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={inputClassName}
                />
                <FieldHelper>Your login and booking notifications—use an inbox you check regularly.</FieldHelper>
                {errors.email && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={inputClassName}
                />
                <FieldHelper>At least 6 characters. A mix of letters and numbers is recommended.</FieldHelper>
                {errors.password && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={inputClassName}
                />
                <FieldHelper>Re-enter your password to catch typos before we create your account.</FieldHelper>
                {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Phone number <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className={inputClassName}
                  placeholder="(555) 123-4567"
                />
                <FieldHelper>Helps coordinators reach you if lesson details change last minute.</FieldHelper>
                {errors.phone && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Mailing address
                </label>
                <FieldHelper className="mb-2 mt-0">
                  Used for verification, payouts, or compliance when required—not displayed in full to students.
                </FieldHelper>
                <div className="space-y-3">
                  <div>
                    <input
                      id="street"
                      type="text"
                      autoComplete="street-address"
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      className={inputFieldClass}
                      placeholder="Street address"
                    />
                    {errors.street && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.street}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        id="city"
                        type="text"
                        autoComplete="address-level2"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className={inputFieldClass}
                        placeholder="City"
                      />
                      {errors.city && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.city}</p>}
                    </div>
                    <div>
                      <input
                        id="state"
                        type="text"
                        autoComplete="address-level1"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className={inputFieldClass}
                        placeholder="State / province"
                      />
                      {errors.state && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.state}</p>}
                    </div>
                  </div>
                  <div>
                    <input
                      id="zipCode"
                      type="text"
                      autoComplete="postal-code"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className={inputFieldClass}
                      placeholder="ZIP or postal code"
                    />
                    {errors.zipCode && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Primary discipline <span className="text-red-500">*</span>
                </label>
                <FieldHelper className="mb-3 mt-0">
                  What you mainly teach right now. Student search filters use this; you can teach both sports later and update your profile.
                </FieldHelper>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'skiing' as const, label: 'Skiing', hint: 'Alpine / downhill', icon: '⛷️' },
                      { id: 'snowboarding' as const, label: 'Snowboarding', hint: 'Single board', icon: '🏂' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => applyDiscipline(opt.id)}
                      className={`rounded-xl border-2 p-4 text-left transition-all dark:border-slate-600 ${
                        formData.discipline === opt.id
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-200 dark:border-sky-500 dark:bg-sky-950/40 dark:ring-sky-900'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-slate-500'
                      }`}
                    >
                      <span className="text-2xl" aria-hidden>
                        {opt.icon}
                      </span>
                      <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{opt.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{opt.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="homeMountain" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Home mountain <span className="text-red-500">*</span>
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
                  className={inputClassName}
                >
                  <option value="">Select your home mountain</option>
                  {mountainOptions.map((mountain) => (
                    <option key={mountain.id} value={mountain.id}>
                      {mountain.name}
                    </option>
                  ))}
                </select>
                <FieldHelper>Primary resort where you teach most often. Ops can update this later if your assignment changes.</FieldHelper>
                {errors.homeMountain && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.homeMountain}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Certifications <span className="text-red-500">*</span>
                </label>
                <FieldHelper className="mb-3 mt-0">
                  Select every credential you currently hold. Some choices may suggest related specialties for your profile.
                </FieldHelper>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
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
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">{cert}</span>
                    </label>
                  ))}
                </div>
                {errors.certifications && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.certifications}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Languages spoken <span className="text-red-500">*</span>
                </label>
                <FieldHelper className="mb-3 mt-0">
                  Students often filter by language—include every language you are comfortable teaching in.
                </FieldHelper>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
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
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">{lang}</span>
                    </label>
                  ))}
                </div>
                {errors.languages && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.languages}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Profile photo</label>
                <div className="mt-2 flex items-center justify-center">
                  <div className="relative ring-4 ring-slate-100 ring-offset-2 dark:ring-slate-800 dark:ring-offset-slate-900">
                    <img
                      src={disciplineAvatarDataUrl(formData.discipline)}
                      alt=""
                      className="h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32"
                    />
                  </div>
                </div>
                <FieldHelper className="mt-3 text-center">
                  A default avatar is used for now. Upload your own photo from the dashboard after signup.
                </FieldHelper>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bio"
                  rows={5}
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className={inputClassName}
                  placeholder="Teaching experience, certifications in practice, terrain you love, and what students can expect from a lesson with you..."
                />
                <FieldHelper>This is the first thing many students read—be specific and friendly.</FieldHelper>
                {errors.bio && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.bio}</p>}
              </div>

              <div>
                <label htmlFor="qualifications" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Additional qualifications
                </label>
                <textarea
                  id="qualifications"
                  rows={3}
                  value={formData.qualifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                  className={inputClassName}
                  placeholder="Awards, race coaching, adaptive experience, clinics you have led..."
                />
                <FieldHelper>Optional. Highlights credentials that do not fit in the checkboxes above.</FieldHelper>
                {errors.qualifications && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.qualifications}</p>}
              </div>

              
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Back
              </button>
            ) : (
              <span className="hidden sm:inline sm:w-20" aria-hidden />
            )}
            <div className="ml-auto">
            {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 dark:bg-sky-600 dark:hover:bg-sky-500"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition dark:bg-sky-600 ${
                    isSubmitting ? 'cursor-not-allowed opacity-70' : 'hover:bg-blue-700 dark:hover:bg-sky-500'
                  }`}
                >
                  {isSubmitting ? 'Creating account…' : 'Complete signup'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}