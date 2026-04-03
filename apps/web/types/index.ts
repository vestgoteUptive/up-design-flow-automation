// Frontend-specific types (mirrors database types)

export interface User {
  id: string
  email: string
  name: string
  role: 'creator' | 'designer' | 'developer'
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  color: string
  creatorId: string
  createdAt: string
  updatedAt: string
}

export interface FigmaConnection {
  id: string
  projectId: string
  name: string
  fileKey: string
  accessToken: string
  createdAt: string
}

export interface FigmaComponentGroup {
  id: string
  name: string
  nodeId: string
  componentCount: number
  thumbnailUrl?: string
}

export interface FigmaComponent {
  id: string
  name: string
  nodeId: string
  groupId?: string
  thumbnailUrl?: string
}

export type IdeaSource = 'figma' | 'url' | 'prompt'

export type IdeaStatus =
  | 'DRAFTING'
  | 'REVIEWED'
  | 'BUILDING'
  | 'PR_OPEN'
  | 'VERIFIED'
  | 'PUBLISHED'
  | 'FAILED'

export interface Idea {
  id: string
  projectId: string
  creatorId: string
  componentName: string
  source: IdeaSource
  sourceData: Record<string, unknown>
  status: IdeaStatus
  createdAt: string
  updatedAt: string
  reviewedAt?: string
}

export interface Iteration {
  id: string
  ideaId: string
  prompt: string
  componentCode: string
  storyCode: string
  typesCode: string
  docsCode: string
  createdAt: string
}

export interface Promotion {
  id: string
  ideaId: string
  projectId: string
  status: IdeaStatus
  prUrl?: string
  verificationResults?: {
    accessibility: number
    storybook: boolean
    tests: number
  }
  createdAt: string
  updatedAt: string
}

// API request/response types

export interface RegisterBody {
  email: string
  password: string
  name: string
  role: 'creator' | 'designer' | 'developer'
}

export interface LoginBody {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface CreateProject {
  name: string
  description: string
  color: string
}

export interface UpdateProject {
  name?: string
  description?: string
  color?: string
}

export interface AddFigmaConnection {
  name: string
  fileKey: string
  accessToken: string
}

export interface CreateIdea {
  componentName: string
  source: IdeaSource
  sourceData: Record<string, unknown>
  enrichmentPrompt?: string
}

export interface CreateIteration {
  prompt: string
}

export interface GalleryFilters {
  status?: IdeaStatus
  source?: IdeaSource
}
