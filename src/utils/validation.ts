export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateField(value: any, rules: ValidationRule): ValidationResult {
  const errors: string[] = [];

  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push('This field is required');
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: errors.length === 0, errors };
  }

  // Length validation
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push('Invalid format');
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateEmail(email: string): ValidationResult {
  return validateField(email, {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  });
}

export function validatePassword(password: string): ValidationResult {
  return validateField(password, {
    required: true,
    minLength: 6,
    custom: (value) => {
      if (!/(?=.*[a-z])/.test(value)) {
        return 'Password must contain at least one lowercase letter';
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!/(?=.*\d)/.test(value)) {
        return 'Password must contain at least one number';
      }
      return null;
    }
  });
}

export function validatePhoneNumber(phone: string): ValidationResult {
  return validateField(phone, {
    pattern: /^[\+]?[1-9][\d]{0,15}$/
  });
}

export function validateRequired(value: any): ValidationResult {
  return validateField(value, { required: true });
}

export function validateLength(value: string, min: number, max?: number): ValidationResult {
  return validateField(value, { minLength: min, maxLength: max });
}
