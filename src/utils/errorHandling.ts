export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export function createError(code: string, message: string, details?: unknown): AppError {
  return { code, message, details };
}

export function handleFirebaseError(error: unknown): AppError {
  if (error instanceof Error) {
    // Handle common Firebase Auth errors
    switch (error.message) {
      case 'auth/user-not-found':
        return createError('AUTH_USER_NOT_FOUND', 'No account found with this email address');
      case 'auth/wrong-password':
        return createError('AUTH_WRONG_PASSWORD', 'Incorrect password');
      case 'auth/email-already-in-use':
        return createError('AUTH_EMAIL_IN_USE', 'An account with this email already exists');
      case 'auth/weak-password':
        return createError('AUTH_WEAK_PASSWORD', 'Password is too weak');
      case 'auth/invalid-email':
        return createError('AUTH_INVALID_EMAIL', 'Invalid email address');
      case 'auth/too-many-requests':
        return createError('AUTH_TOO_MANY_REQUESTS', 'Too many failed attempts. Please try again later');
      default:
        return createError('UNKNOWN_ERROR', error.message);
    }
  }
  
  return createError('UNKNOWN_ERROR', 'An unexpected error occurred');
}

export function logError(error: AppError, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'App'}] Error:`, error);
  }
  // In production, you might want to send this to an error tracking service
}
