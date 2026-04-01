import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

const benefits = [
  {
    icon: Target,
    title: 'Get matched with serious learners',
    body: 'Students describe goals, level, and resort preferences—so the leads you see are closer to a real fit than a cold inbox.',
  },
  {
    icon: Calendar,
    title: 'Keep your week organized',
    body: 'Lessons, calendar, and instructor tools live in one place so you spend less time on logistics and more time teaching.',
  },
  {
    icon: MessageSquare,
    title: 'Communicate before you meet',
    body: 'Clear expectations and quick messages help you show up prepared and deliver a smoother first impression on snow.',
  },
  {
    icon: TrendingUp,
    title: 'Build repeat business',
    body: 'Progress tracking and structured profiles help learners see the value of coming back—and referring friends.',
  },
];

const HERO_IMAGE =
  'https://images.pexels.com/photos/29920626/pexels-photo-29920626.jpeg?auto=compress&cs=tinysrgb&w=1920';

const premiumPoints = [
  {
    title: 'A storefront-quality profile',
    body: 'Certifications, languages, home mountain, and bio are presented in a consistent way so you look as professional online as you are on the hill.',
  },
  {
    title: 'Less friction for the guest',
    body: 'From discovery to booking, the path is designed to feel modern and trustworthy—so your time on snow feels like the main event.',
  },
  {
    title: 'Room to grow',
    body: 'As we add tools for scheduling, payouts, and insights, your presence on SlopesMaster becomes a channel—not just a listing.',
  },
];

export function InstructorLanding() {
  return (
    <div className="bg-winter-light dark:bg-winter-dark">
      <section className="relative min-h-[min(32rem,85vh)] overflow-hidden border-b border-slate-200/80 pt-24 pb-16 dark:border-slate-800 sm:min-h-[min(36rem,88vh)] sm:pt-28 sm:pb-20 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center"
            width={1920}
            height={1080}
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-slate-950/55" aria-hidden />
          <div
            className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/50 to-slate-950/80"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_70%_20%,rgba(37,99,235,0.2),transparent)]"
            aria-hidden
          />
        </div>
        <div className="container relative z-10 mx-auto flex max-w-5xl min-h-[inherit] flex-col justify-center px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-300">
            For certified instructors
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Teach more. Stress less.{' '}
            <span className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">
              Elevate every lesson.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200/95">
            SlopesMaster connects you with skiers and snowboarders who are actively looking for coaching—not random DMs. Use one
            platform to be discovered, booked, and remembered.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/instructor-signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500"
            >
              Apply to join
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              to="/book-lesson"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-8 py-3.5 text-base font-medium text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/15"
            >
              See how students book
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Already on SlopesMaster? Use <span className="font-medium text-white">Sign In</span> in the header.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200/80 py-16 dark:border-slate-800 sm:py-20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Built to help you drive real business
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Whether you are full-time on snow or stacking weekend clinics, visibility and follow-through matter. Here is how we
              support both.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-sky-950/80 dark:text-sky-300">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 dark:bg-slate-900/30 sm:py-20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                Premium experience
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Lessons that feel worth the lift ticket
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Guests compare you to other activities on their trip. A polished, predictable experience—from first click to last
                turn—helps you stand out and earn referrals.
              </p>
              <ul className="mt-8 space-y-6">
                {premiumPoints.map((item) => (
                  <li key={item.title}>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-blue-50/60 p-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/80 sm:p-8">
              <div className="flex items-start gap-4 rounded-xl bg-white/90 p-4 shadow-sm dark:bg-slate-950/50">
                <Users className="mt-0.5 h-8 w-8 shrink-0 text-blue-600 dark:text-sky-400" aria-hidden />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Serious learners</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Matching and search help guests filter by level, language, resort, and more—so you meet people who actually want
                    to improve.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl bg-white/90 p-4 shadow-sm dark:bg-slate-950/50">
                <Wallet className="mt-0.5 h-8 w-8 shrink-0 text-blue-600 dark:text-sky-400" aria-hidden />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Your brand, your rates</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Present your credentials and story in one trusted place. Fine-tune pricing and details as you grow on the
                    platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-slate-900 py-16 text-white dark:border-slate-800 sm:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to list your teaching?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Create your instructor profile in a few minutes. We will ask for your certifications, languages, and home mountain so
            students can find you with confidence.
          </p>
          <Link
            to="/instructor-signup"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
          >
            Start instructor signup
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
