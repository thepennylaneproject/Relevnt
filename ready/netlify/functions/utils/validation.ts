/**
 * ============================================================================
 * VALIDATION UTILITY FOR READY
 * ============================================================================
 * Input validation and sanitization functions.
 * ============================================================================
 */

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const field of requiredFields) {
    if (isEmpty(data[field])) {
      errors[field] = `${field} is required`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number
): boolean {
  const length = value.length;
  
  if (min !== undefined && length < min) return false;
  if (max !== undefined && length > max) return false;
  
  return true;
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date format
 */
export function validateDate(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate enum value
 */
export function validateEnum(
  value: any,
  allowedValues: any[]
): boolean {
  return allowedValues.includes(value);
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate interview session data
 */
export function validateInterviewSessionData(data: any): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (isEmpty(data.question)) {
    errors.question = 'Question is required';
  }
  
  if (isEmpty(data.userAnswer)) {
    errors.userAnswer = 'User answer is required';
  }
  
  if (data.score !== undefined && (data.score < 1 || data.score > 10)) {
    errors.score = 'Score must be between 1 and 10';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate assessment data
 */
export function validateAssessmentData(data: any): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (isEmpty(data.targetRole)) {
    errors.targetRole = 'Target role is required';
  }
  
  const validTypes = ['mirror', 'skill-gap', 'readiness'];
  if (data.type && !validateEnum(data.type, validTypes)) {
    errors.type = `Type must be one of: ${validTypes.join(', ')}`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page?: string | number,
  limit?: string | number
): { page: number; limit: number; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  let parsedPage = 1;
  if (page) {
    parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    if (isNaN(parsedPage) || parsedPage < 1) {
      errors.page = 'Page must be a positive number';
      parsedPage = 1;
    }
  }
  
  let parsedLimit = 20;
  if (limit) {
    parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      errors.limit = 'Limit must be between 1 and 100';
      parsedLimit = 20;
    }
  }
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
