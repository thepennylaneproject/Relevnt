/**
 * ============================================================================
 * VALIDATION UTILITY
 * ============================================================================
 * ðŸŽ“ LEARNING NOTE: Never trust user input! Always validate and sanitize
 * data before using it. This prevents security issues and data corruption.
 * ============================================================================
 */

/**
 * Validation result type
 */
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Check if a value is empty (null, undefined, or empty string)
 */
function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * Validate required fields
 * 
 * @param data - The data object to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result
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
 * 
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 * 
 * @param password - Password to validate
 * @returns Validation result with specific error messages
 */
export function validatePassword(password: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (password.length < 8) {
    errors.length = 'Password must be at least 8 characters';
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.uppercase = 'Password must contain at least one uppercase letter';
  }
  
  if (!/[a-z]/.test(password)) {
    errors.lowercase = 'Password must contain at least one lowercase letter';
  }
  
  if (!/\d/.test(password)) {
    errors.number = 'Password must contain at least one number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate string length
 * 
 * @param value - String to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @returns True if valid length
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
 * 
 * @param url - URL to validate
 * @returns True if valid URL format
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
 * Validate date format (ISO 8601)
 * 
 * @param date - Date string to validate
 * @returns True if valid date format
 */
export function validateDate(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate enum value
 * 
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @returns True if value is in allowed values
 */
export function validateEnum(
  value: any,
  allowedValues: any[]
): boolean {
  return allowedValues.includes(value);
}

/**
 * Sanitize string input (remove dangerous characters)
 * ðŸŽ“ This prevents XSS (Cross-Site Scripting) attacks
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
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
 * Validate resume data
 */
export function validateResumeData(data: any): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate required fields
  if (isEmpty(data.title)) {
    errors.title = 'Resume title is required';
  }
  
  // Validate title length
  if (data.title && !validateLength(data.title, 1, 100)) {
    errors.title = 'Resume title must be between 1 and 100 characters';
  }
  
  // Validate version number
  if (data.version_number && (data.version_number < 1 || data.version_number > 999)) {
    errors.version_number = 'Version number must be between 1 and 999';
  }
  
  // Validate ATS score if provided
  if (data.ats_score !== undefined && (data.ats_score < 0 || data.ats_score > 100)) {
    errors.ats_score = 'ATS score must be between 0 and 100';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate job data
 */
export function validateJobData(data: any): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (isEmpty(data.title)) {
    errors.title = 'Job title is required';
  }
  
  if (isEmpty(data.company)) {
    errors.company = 'Company name is required';
  }
  
  // Validate job type
  const validJobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
  if (data.job_type && !validateEnum(data.job_type, validJobTypes)) {
    errors.job_type = `Job type must be one of: ${validJobTypes.join(', ')}`;
  }
  
  // Validate status
  const validStatuses = ['saved', 'applied', 'interviewing', 'rejected', 'offered', 'accepted', 'declined'];
  if (data.status && !validateEnum(data.status, validStatuses)) {
    errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
  }
  
  // Validate match score
  if (data.match_score !== undefined && (data.match_score < 0 || data.match_score > 100)) {
    errors.match_score = 'Match score must be between 0 and 100';
  }
  
  // Validate external URL
  if (data.external_url && !validateURL(data.external_url)) {
    errors.external_url = 'Invalid URL format';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate application data
 */
export function validateApplicationData(data: any): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (isEmpty(data.company)) {
    errors.company = 'Company name is required';
  }
  
  if (isEmpty(data.position)) {
    errors.position = 'Position is required';
  }
  
  // Validate status
  const validStatuses = [
    'pending', 'submitted', 'reviewing', 'phone_screen',
    'interview', 'offer', 'accepted', 'rejected', 'withdrawn'
  ];
  if (data.status && !validateEnum(data.status, validStatuses)) {
    errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
  }
  
  // Validate dates
  if (data.applied_date && !validateDate(data.applied_date)) {
    errors.applied_date = 'Invalid date format';
  }
  
  if (data.follow_up_date && !validateDate(data.follow_up_date)) {
    errors.follow_up_date = 'Invalid date format';
  }
  
  if (data.interview_date && !validateDate(data.interview_date)) {
    errors.interview_date = 'Invalid date format';
  }
  
  // Validate email if provided
  if (data.recruiter_email && !validateEmail(data.recruiter_email)) {
    errors.recruiter_email = 'Invalid email format';
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
  
  // Parse and validate page
  let parsedPage = 1;
  if (page) {
    parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    if (isNaN(parsedPage) || parsedPage < 1) {
      errors.page = 'Page must be a positive number';
      parsedPage = 1;
    }
  }
  
  // Parse and validate limit
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
 * 
 * @param uuid - UUID to validate
 * @returns True if valid UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
