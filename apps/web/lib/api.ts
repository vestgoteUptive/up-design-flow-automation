/**
 * API client for frontend
 * Handles all HTTP communication with the backend
 */

import type {
  User,
  Project,
  Idea,
  Iteration,
  Promotion,
  SessionData,
} from '@design-studio/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * HTTP response wrapper
 */
interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}

/**
 * Handle API errors
 */
function handleError(error: unknown): never {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    throw new Error('Network error: Could not reach the API')
  }

  if (error instanceof Error) {
    throw error
  }

  throw new Error('An unexpected error occurred')
}

/**
 * Make authenticated request
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data: ApiResponse<T> = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export const auth = {
  /**
   * Register a new user
   */
  async register(email: string, name: string, password: string): Promise<{
    accessToken: string
    user: Omit<User, 'passwordHash'>
  }> {
    const response = await request<{ accessToken: string; user: Omit<User, 'passwordHash'> }>(
      'POST',
      '/auth/register',
      { email, name, password },
    )
    return response.data!
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{
    accessToken: string
    user: Omit<User, 'passwordHash'>
  }> {
    const response = await request<{ accessToken: string; user: Omit<User, 'passwordHash'> }>(
      'POST',
      '/auth/login',
      { email, password },
    )
    return response.data!
  },

  /**
   * Verify current session
   */
  async getSession(token: string): Promise<{ session: SessionData }> {
    const response = await request<{ session: SessionData }>('GET', '/auth/session', undefined, token)
    return response.data!
  },
}

// ============================================================================
// PROJECT ENDPOINTS
// ============================================================================

export const projects = {
  /**
   * Create a new project
   */
  async create(
    token: string,
    data: {
      name: string
      description?: string
      agentInstructions?: string
      githubRepoUrl?: string
      githubBranch?: string
    },
  ): Promise<Project> {
    const response = await request<Project>('POST', '/projects', data, token)
    return response.data!
  },

  /**
   * Get all projects
   */
  async list(token: string): Promise<Project[]> {
    const response = await request<{ projects: Project[] }>('GET', '/projects', undefined, token)
    return response.data?.projects || []
  },

  /**
   * Get a specific project
   */
  async get(token: string, projectId: string): Promise<Project> {
    const response = await request<Project>('GET', `/projects/${projectId}`, undefined, token)
    return response.data!
  },

  /**
   * Update a project
   */
  async update(token: string, projectId: string, data: Partial<Project>): Promise<Project> {
    const response = await request<Project>('PUT', `/projects/${projectId}`, data, token)
    return response.data!
  },

  /**
   * Delete a project
   */
  async delete(token: string, projectId: string): Promise<void> {
    await request('DELETE', `/projects/${projectId}`, undefined, token)
  },
}

// ============================================================================
// IDEA ENDPOINTS
// ============================================================================

export const ideas = {
  /**
   * Create a new idea
   */
  async create(
    token: string,
    projectId: string,
    data: {
      sourceType: 'FIGMA' | 'URL' | 'PROMPT'
      sourceData: unknown
      userPrompt?: string
    },
  ): Promise<Idea> {
    const response = await request<Idea>('POST', `/projects/${projectId}/ideas`, data, token)
    return response.data!
  },

  /**
   * Get all ideas in a project
   */
  async list(token: string, projectId: string): Promise<Idea[]> {
    const response = await request<{ ideas: Idea[] }>(
      'GET',
      `/projects/${projectId}/ideas`,
      undefined,
      token,
    )
    return response.data?.ideas || []
  },

  /**
   * Get a specific idea
   */
  async get(token: string, projectId: string, ideaId: string): Promise<Idea> {
    const response = await request<Idea>(
      'GET',
      `/projects/${projectId}/ideas/${ideaId}`,
      undefined,
      token,
    )
    return response.data!
  },

  /**
   * Update an idea
   */
  async update(token: string, projectId: string, ideaId: string, data: Partial<Idea>): Promise<Idea> {
    const response = await request<Idea>(
      'PUT',
      `/projects/${projectId}/ideas/${ideaId}`,
      data,
      token,
    )
    return response.data!
  },

  /**
   * Delete an idea
   */
  async delete(token: string, projectId: string, ideaId: string): Promise<void> {
    await request('DELETE', `/projects/${projectId}/ideas/${ideaId}`, undefined, token)
  },

  /**
   * Generate iteration via Bedrock
   */
  async iterate(token: string, projectId: string, ideaId: string, prompt: string): Promise<Iteration> {
    const response = await request<Iteration>(
      'POST',
      `/projects/${projectId}/ideas/${ideaId}/iterate`,
      { prompt },
      token,
    )
    return response.data!
  },
}

// ============================================================================
// PROMOTION/GALLERY ENDPOINTS
// ============================================================================

export const gallery = {
  /**
   * Promote an idea to production
   */
  async promote(token: string, ideaId: string, projectId: string): Promise<Promotion> {
    const response = await request<Promotion>(
      'POST',
      `/ideas/${ideaId}/promote`,
      { projectId },
      token,
    )
    return response.data!
  },

  /**
   * Get promotion status
   */
  async getPromotion(token: string, ideaId: string): Promise<Promotion> {
    const response = await request<Promotion>(
      'GET',
      `/ideas/${ideaId}/promotion`,
      undefined,
      token,
    )
    return response.data!
  },

  /**
   * List all promotions
   */
  async listPromotions(token: string, status?: string): Promise<Promotion[]> {
    const url = `/promotions${status ? `?status=${status}` : ''}`
    const response = await request<{ promotions: Promotion[] }>(
      'GET',
      url,
      undefined,
      token,
    )
    return response.data?.promotions || []
  },

  /**
   * Update promotion status
   */
  async updatePromotion(
    token: string,
    ideaId: string,
    data: Partial<Promotion>,
  ): Promise<Promotion> {
    const response = await request<Promotion>(
      'PATCH',
      `/ideas/${ideaId}/promotion`,
      data,
      token,
    )
    return response.data!
  },
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}
