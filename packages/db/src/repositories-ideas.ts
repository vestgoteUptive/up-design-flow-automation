/**
 * Ideas repository - all database operations for ideas
 * PK=PROJECT#<projectId>, SK=IDEA#<ideaId>
 * GSI1PK=USER#<userId> for creator lookups
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import type { Idea } from '@design-studio/types'
import { getTableName } from './client'

/**
 * Get an idea by ID
 */
export async function getIdeaById(
  client: DynamoDBDocumentClient,
  projectId: string,
  ideaId: string,
): Promise<Idea | null> {
  const result = await client.send(new GetCommand({
    TableName: getTableName(),
    Key: {
      PK: `PROJECT#${projectId}`,
      SK: `IDEA#${ideaId}`,
    },
  }))

  if (!result.Item) {
    return null
  }

  return result.Item as Idea
}

/**
 * Get all ideas for a project
 */
export async function getIdeasByProject(client: DynamoDBDocumentClient, projectId: string): Promise<Idea[]> {
  const result = await client.send(new QueryCommand({
    TableName: getTableName(),
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `PROJECT#${projectId}`,
      ':sk': 'IDEA#',
    },
  }))

  return (result.Items || []) as Idea[]
}

/**
 * Get all ideas created by a user
 */
export async function getIdeasByCreator(client: DynamoDBDocumentClient, creatorId: string): Promise<Idea[]> {
  const result = await client.send(new QueryCommand({
    TableName: getTableName(),
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${creatorId}`,
      ':sk': 'IDEA#',
    },
  }))

  return (result.Items || []) as Idea[]
}

/**
 * Create a new idea
 */
export async function createIdea(client: DynamoDBDocumentClient, idea: Idea): Promise<void> {
  await client.send(new PutCommand({
    TableName: getTableName(),
    Item: {
      PK: `PROJECT#${idea.projectId}`,
      SK: `IDEA#${idea.id}`,
      GSI1PK: `USER#${idea.createdById}`,
      GSI1SK: `IDEA#${idea.id}`,
      ...idea,
    },
  }))
}

/**
 * Update an idea
 */
export async function updateIdea(
  client: DynamoDBDocumentClient,
  projectId: string,
  ideaId: string,
  updates: Partial<Omit<Idea, 'id' | 'projectId' | 'createdById' | 'createdAt'>>,
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
      SK: `IDEA#${ideaId}`,
    },
    UpdateExpression: `SET ${expressions.join(', ')}`,
    ExpressionAttributeValues: values,
  }))
}

/**
 * Delete an idea
 */
export async function deleteIdea(
  client: DynamoDBDocumentClient,
  projectId: string,
  ideaId: string,
): Promise<void> {
  await client.send(new DeleteCommand({
    TableName: getTableName(),
    Key: {
      PK: `PROJECT#${projectId}`,
      SK: `IDEA#${ideaId}`,
    },
  }))
}
