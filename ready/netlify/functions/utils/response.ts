/**
 * ============================================================================
 * RESPONSE UTILITY FOR READY
 * ============================================================================
 * Functions for sending consistent, properly formatted API responses.
 * ============================================================================
 */

import { HandlerResponse } from '@netlify/functions';

/**
 * Standard CORS headers
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Create a success response
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
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  details?: any
): HandlerResponse {
  console.error(`[Error ${statusCode}]:`, message, details);
  
  const response: any = {
    success: false,
    error: message
  };
  
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
 */
export function handleOptions(): HandlerResponse {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: ''
  };
}

// Common HTTP status codes
export const ok = (data: any) => successResponse(data, 200);
export const created = (data: any) => successResponse(data, 201);
export const noContent = () => ({ statusCode: 204, headers: corsHeaders, body: '' });

export const badRequest = (message: string = 'Bad Request', details?: any) =>
  errorResponse(message, 400, details);

export const unauthorized = (message: string = 'Unauthorized') =>
  errorResponse(message, 401);

export const forbidden = (message: string = 'Forbidden') =>
  errorResponse(message, 403);

export const notFound = (message: string = 'Not Found') =>
  errorResponse(message, 404);

export const internalServerError = (message: string = 'Internal Server Error', details?: any) =>
  errorResponse(message, 500, details);

/**
 * Paginated response helper
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
