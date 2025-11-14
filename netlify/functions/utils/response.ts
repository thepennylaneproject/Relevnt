/**
 * ============================================================================
 * RESPONSE UTILITY
 * ============================================================================
 * ðŸŽ“ LEARNING NOTE: These functions help you send consistent, properly
 * formatted responses from your API endpoints. They handle CORS, status codes,
 * and error formatting automatically.
 * ============================================================================
 */

import { HandlerResponse } from '@netlify/functions';

/**
 * Standard CORS headers
 * ðŸŽ“ CORS (Cross-Origin Resource Sharing) allows your frontend (on one domain)
 * to make requests to your API (on another domain/port). Without these headers,
 * browsers block the requests for security!
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, set this to your specific domain
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Create a success response
 * 
 * @param data - The data to return
 * @param statusCode - HTTP status code (default: 200)
 * @returns Formatted response
 */
export function successResponse(
  data: any,
  statusCode: number = 200
): HandlerResponse {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      data
    })
  };
}

/**
 * Create an error response
 * 
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param details - Additional error details
 * @returns Formatted error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  details?: any
): HandlerResponse {
  // Log error for debugging
  console.error(`[Error ${statusCode}]:`, message, details);
  
  const response: any = {
    success: false,
    error: message
  };
  
  // Add details in development mode
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(response)
  };
}

/**
 * Handle OPTIONS requests (for CORS preflight)
 * ðŸŽ“ Browsers send an OPTIONS request before the actual request to check if
 * the server allows CORS. This function handles that automatically.
 * 
 * @returns 200 response with CORS headers
 */
export function handleOptions(): HandlerResponse {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: ''
  };
}

/**
 * Common HTTP status codes with helper functions
 * ðŸŽ“ These are standardized codes that tell the client what happened
 */

// 2xx Success
export const ok = (data: any) => successResponse(data, 200);
export const created = (data: any) => successResponse(data, 201);
export const noContent = () => ({ statusCode: 204, headers: corsHeaders, body: '' });

// 4xx Client Errors
export const badRequest = (message: string = 'Bad Request', details?: any) =>
  errorResponse(message, 400, details);

export const unauthorized = (message: string = 'Unauthorized') =>
  errorResponse(message, 401);

export const forbidden = (message: string = 'Forbidden') =>
  errorResponse(message, 403);

export const notFound = (message: string = 'Not Found') =>
  errorResponse(message, 404);

export const conflict = (message: string = 'Conflict') =>
  errorResponse(message, 409);

export const unprocessableEntity = (message: string, details?: any) =>
  errorResponse(message, 422, details);

export const tooManyRequests = (message: string = 'Too Many Requests') =>
  errorResponse(message, 429);

// 5xx Server Errors
export const internalServerError = (message: string = 'Internal Server Error', details?: any) =>
  errorResponse(message, 500, details);

export const notImplemented = (message: string = 'Not Implemented') =>
  errorResponse(message, 501);

export const serviceUnavailable = (message: string = 'Service Unavailable') =>
  errorResponse(message, 503);

/**
 * Paginated response helper
 * ðŸŽ“ When returning lists of items, it's best practice to paginate them.
 * This prevents sending huge responses that slow down your app.
 * 
 * @param data - Array of items
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Paginated response
 */
export function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number
): HandlerResponse {
  const totalPages = Math.ceil(total / limit);
  
  return successResponse({
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  });
}

/**
 * Validation error response
 * For input validation failures
 * 
 * @param errors - Object with field names as keys and error messages as values
 * @returns 422 Unprocessable Entity response
 */
export function validationErrorResponse(errors: Record<string, string>): HandlerResponse {
  return {
    statusCode: 422,
    headers: corsHeaders,
    body: JSON.stringify({
      success: false,
      error: 'Validation failed',
      validationErrors: errors
    })
  };
}

/**
 * Rate limit response
 * 
 * @param retryAfter - Seconds until the user can try again
 * @returns 429 Too Many Requests response
 */
export function rateLimitResponse(retryAfter: number = 60): HandlerResponse {
  return {
    statusCode: 429,
    headers: {
      ...corsHeaders,
      'Retry-After': retryAfter.toString()
    },
    body: JSON.stringify({
      success: false,
      error: 'Too many requests',
      retryAfter
    })
  };
}

/**
 * Common HTTP status code reference
 * ðŸŽ“ LEARNING NOTE: Understanding status codes is crucial for API development
 * 
 * 2xx - Success
 * - 200 OK: Request succeeded
 * - 201 Created: Resource created successfully
 * - 204 No Content: Success but no content to return
 * 
 * 4xx - Client Errors
 * - 400 Bad Request: Invalid request format/data
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Authenticated but not allowed
 * - 404 Not Found: Resource doesn't exist
 * - 409 Conflict: Request conflicts with current state
 * - 422 Unprocessable Entity: Valid format but invalid data
 * - 429 Too Many Requests: Rate limit exceeded
 * 
 * 5xx - Server Errors
 * - 500 Internal Server Error: Something went wrong on the server
 * - 501 Not Implemented: Feature not implemented yet
 * - 503 Service Unavailable: Server temporarily unavailable
 */
