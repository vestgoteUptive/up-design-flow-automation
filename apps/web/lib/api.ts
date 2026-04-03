/**
 * API client using KY HTTP library
 * Handles all HTTP communication with automatic authentication
 */

import ky from 'ky'
import type {
  User,
  Project,
  Idea,
  Iteration,
  Promotion,
  SessionData,
} from '@design-studio/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

function clearStoredToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}

// ============================================================================
// KY CLIENT WITH INTERCEPTORS
// ============================================================================

const kyClient = ky.create({
  prefixUrl: API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getStoredToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          clearStoredToken()
          // Could redirect to login here
          // window.location.href = '/login'
        }
      },
    ],
  },
})

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export const auth = {
  async register(email: string, name: string, password: string): Promise<{
    accessToken: string
    user: Omit<User, 'passwordHash'>
  }> {
    const response = await kyClient
      .post('auth/register', {
        json: { email, name, password },
      })
      .json<{ accessToken: string; user: Omit<User, 'passwordHash'> }>()

    if (response.accessToken) {
      setStoredToken(response.accessToken)
    }
    return response
  },

  async login(email: string, password: string): Promise<{
    accessToken: string
    user: Omit<User, 'passwordHash'>
  }> {
    const response = await kyClient
      .post('auth/login', {
        json: { email, password },
      })
      .json<{ accessToken: string; user: Omit<User, 'passwordHash'> }>()

    if (response.accessToken) {
      setStoredToken(response.accessToken)
    }
    return response
  },

  async getSession(): Promise<SessionData> {
    const response = await kyClient
      .get('auth/session')
      .json<{ session: SessionData }>()
    return response.session
  },

  logout(): void {
    clearStoredToken()
  },
}

// ============================================================================
// PROJECT ENDPOINTS
// ============================================================================

export const projects = {
  async create(data: {
    name: string
    description?: string
    agentInstructions?: string
    githubRepoUrl?: string
    githubBranch?: string
  }): Promise<Project> {
    return kyClient.post('projects', { json: data }).json<Project>()
  },

  async list(): Promise<Project[]> {
    const response = await kyClient
      .get('projects')
      .json<{ projects: Project[] }>()
    return response.projects || []
  },

  async get(projectId: string): Promise<Project> {
    return kyClient.get(`projects/${projectId}`).json<Project>()
  },

  async update(projectId: string, data: Partial<Project>): Promise<Project> {
    return kyClient.put(`projects/${projectId}`, { json: data }).json<Project>()
  },

  async delete(projectId: string): Promise<void> {
    await kyClient.delete(`projects/${projectId}`)
  },
}

// ============================================================================
// IDEA ENDPOINTS
// ============================================================================

export const ideas = {
  async create(
    projectId: string,
    data: {
      title: string
      description?: string
      source: 'figma' | 'url' | 'prompt'
      sourceData: string
    },
  ): Promise<Idea> {
    return kyClient
      .post(`projects/${projectId}/ideas`, { json: data })
      .json<Idea>()
  },

  async list(projectId: string): Promise<Idea[]> {
    const response = await kyClient
      .get(`projects/${projectId}/ideas`)
      .json<{ ideas: Idea[] }>()
    return response.ideas || []
  },

  async get(projectId: string, ideaId: string): Promise<Idea> {
    return kyClient
      .get(`projects/${projectId}/ideas/${ideaId}`)
      .json<Idea>()
  },

  async delete(projectId: string, ideaId: string): Promise<void> {
    await kyClient.delete(`projects/${projectId}/ideas/${ideaId}`)
  },
}

// ============================================================================
// GALLERY ENDPOINTS
// ============================================================================

export const gallery = {
  async list(): Promise<Project[]> {
    const response = await kyClient
      .get('gallery')
      .json<{ projects: Project[] }>()
    return response.projects || []
  },

  async getPromotions(ideaId: string): Promise<Promotion[]> {
    const response = await kyClient
      .get(`ideas/${ideaId}/promotions`)
      .json<{ promotions: Promotion[] }>()
    return response.promotions || []
  },

  async updatePromotion(
    ideaId: string,
    data: Partial<Promotion>,
  ): Promise<Promotion> {
    return kyClient
      .patch(`ideas/${ideaId}/promotion`, { json: data })
      .json<Promotion>()
  },
}

// ============================================================================
// API NAMESPACE (for convenience)
// ============================================================================

export const api = {
  auth,
  projects,
  ideas,
  gallery,
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await kyClient.get('health')
    return response.ok
  } catch {
    return false
  }
}
