import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Snowflake } from 'lucide-react';
import { validateEmail, validateRequired } from '../utils/validation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validate inputs
    const emailValidation = validateEmail(email);
    const passwordValidation = validateRequired(password);
    
    const newErrors: { email?: string; password?: string } = {};
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors[0];
    }
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      await login(email, password);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
      setErrors({ email: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Snowflake className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="mt-2 text-sm text-gray-600">Sign in to access your account</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 transition-colors ${
            isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="text-center">
          <a href="/signup" className="text-sm text-blue-600 hover:text-blue-500">
            Don't have an account? Sign up
          </a>
        </div>
      </form>
    </div>
  );
}