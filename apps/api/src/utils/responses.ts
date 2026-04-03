/**
 * HTTP response formatting for Lambda/API Gateway
 */

import type { ApiResponse, ApiError } from '@design-studio/types'

export interface LambdaResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

/**
 * Format a successful response
 */
export function successResponse<T>(data: T, statusCode = 200): LambdaResponse {
  const response: ApiResponse<T> = {
    data,
    timestamp: new Date().toISOString(),
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(response),
  }
}

/**
 * Format an error response
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown,
): LambdaResponse {
  const response: ApiResponse<null> = {
    error: {
      code,
      message,
      ...((details as Record<string, unknown>) && { details }),
    },
    timestamp: new Date().toISOString(),
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(response),
  }
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(): LambdaResponse {
  return errorResponse('UNAUTHORIZED', 'Missing or invalid authorization token', 401)
}

/**
 * Forbidden response
 */
export function forbiddenResponse(): LambdaResponse {
  return errorResponse('FORBIDDEN', 'You do not have permission to access this resource', 403)
}

/**
 * Not found response
 */
export function notFoundResponse(resource: string): LambdaResponse {
  return errorResponse('NOT_FOUND', `${resource} not found`, 404)
}

/**
 * Internal server error response
 */
export function internalErrorResponse(error: Error): LambdaResponse {
  console.error('Internal error:', error)
  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500, {
    message: error.message,
  })
}
