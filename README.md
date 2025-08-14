# Ski Lesson Booking System

A comprehensive React TypeScript application for managing ski lessons, instructors, and student progress.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bolt-vite-react-eesvpn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── calendar/       # Calendar and availability components
│   ├── dashboard/      # Dashboard components for different user roles
│   ├── instructor/     # Instructor-specific components
│   ├── lessons/        # Lesson management components
│   └── common/         # Shared components
├── context/            # React context providers
├── services/           # API and service functions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── pages/              # Page components
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run seed` - Seed Firebase with sample data
- `npm run clear` - Clear Firebase data

## 🛠️ Features

### For Students
- Browse and book lessons with instructors
- Track progress and achievements
- View lesson history and feedback
- Manage profile and preferences

### For Instructors
- Manage availability and schedule
- Create and manage lessons
- Track student progress
- Provide feedback and assessments
- Timesheet management

### For Admins
- User management
- Lesson oversight
- Analytics and reporting
- System configuration

## 🐛 Recent Bug Fixes

### Critical Issues Resolved
- ✅ Fixed build failure due to missing `DayDetailsModal` component
- ✅ Updated TypeScript version compatibility
- ✅ Removed debug code from production components
- ✅ Fixed type safety issues (replaced `any` types)
- ✅ Added proper error boundaries
- ✅ Implemented input validation
- ✅ Created reusable loading components
- ✅ Secured Firebase configuration with environment variables

### Performance Improvements
- ✅ Added error boundaries for better error handling
- ✅ Implemented proper loading states
- ✅ Created validation utilities
- ✅ Added proper TypeScript types

## 🔒 Security

- Firebase configuration uses environment variables
- Input validation on all forms
- Proper error handling without exposing sensitive information
- Type-safe error boundaries

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
