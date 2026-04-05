/**
 * Design Studio Database Package
 * Provides DynamoDB client and repository pattern for all data operations
 */

export { getClient, getTableName } from './client'

// User operations
export {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
} from './repositories-users'

// Project operations
export {
  getProjectById,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from './repositories-projects'

// Idea operations
export {
  getIdeaById,
  getIdeasByProject,
  getIdeasByCreator,
  createIdea,
  updateIdea,
  deleteIdea,
} from './repositories-ideas'

// Iteration operations
export {
  getIterationById,
  getIterationsByIdea,
  createIteration,
  updateIteration,
} from './repositories-iterations'

// Promotion operations
export {
  getPromotion,
  getPromotions,
  createPromotion,
  updatePromotion,
} from './repositories-promotions'

// Ingestion & Tracking repositories (class-based)
export { IngestedComponentsRepository } from './repositories-ingested-components'
export { ComponentGenerationRepository } from './repositories-component-generation'
export { DesignTokensRepository, ComponentTokensRepository } from './repositories-design-tokens'
export { ComponentDependenciesRepository } from './repositories-component-dependencies'
export { IngestionSessionsRepository } from './repositories-ingestion-sessions'
