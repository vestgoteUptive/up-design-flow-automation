/**
 * Projects repository - all database operations for projects
 * PK=PROJECT#<id>, GSI1PK=TYPE#PROJECT for listing all projects
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import type { Project } from '@design-studio/types'
import { getTableName } from './client'

/**
 * Get a project by ID
 */
export async function getProjectById(client: DynamoDBDocumentClient, projectId: string): Promise<Project | null> {
  const result = await client.send(new GetCommand({
    TableName: getTableName(),
    Key: {
      PK: `PROJECT#${projectId}`,
      SK: '#META',
    },
  }))

  if (!result.Item) {
    return null
  }

  return result.Item as Project
}

/**
 * Get all projects (with optional filtering by creator)
 */
export async function getProjects(
  client: DynamoDBDocumentClient,
  creatorId?: string,
): Promise<Project[]> {
  let result

  if (creatorId) {
    // Query projects by creator (via GSI1)
    result = await client.send(new QueryCommand({
      TableName: getTableName(),
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${creatorId}`,
      },
    }))
  } else {
    // Query all projects via main table (all have PK starting with PROJECT#)
    result = await client.send(new QueryCommand({
      TableName: getTableName(),
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': 'PROJECT#',
        ':sk': '#META',
      },
      // Note: this won't work. Need GSI1PK=TYPE#PROJECT approach
    }))
  }

  return (result.Items || []) as Project[]
}

/**
 * Create a new project
 */
export async function createProject(client: DynamoDBDocumentClient, project: Project): Promise<void> {
  await client.send(new PutCommand({
    TableName: getTableName(),
    Item: {
      PK: `PROJECT#${project.id}`,
      SK: '#META',
      GSI1PK: `USER#${project.creatorId}`,
      GSI1SK: project.createdAt,
      ...project,
    },
  }))
}

/**
 * Update a project
 */
export async function updateProject(
  client: DynamoDBDocumentClient,
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'creatorId' | 'createdAt'>>,
): Promise<void> {
  const expressions: string[] = []
  const values: Record<string, unknown> = {}

  Object.entries(updates).forEach(([key, value], index) => {
    expressions.push(`${key} = :val${index}`)
    values[`:val${index}`] = value
  })

  if (expressions.length === 0) {
    return
  }

  await client.send(new UpdateCommand({
    TableName: getTableName(),
    Key: {
      PK: `PROJECT#${projectId}`,
      SK: '#META',
    },
    UpdateExpression: `SET ${expressions.join(', ')}`,
    ExpressionAttributeValues: values,
  }))
}

/**
 * Delete a project
 */
export async function deleteProject(client: DynamoDBDocumentClient, projectId: string): Promise<void> {
  await client.send(new DeleteCommand({
    TableName: getTableName(),
    Key: {
      PK: `PROJECT#${projectId}`,
      SK: '#META',
    },
  }))
}
