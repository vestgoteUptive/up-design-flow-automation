/**
 * Iterations repository - all database operations for iterations
 * PK=IDEA#<ideaId>, SK=ITER#<iterationId>
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { Iteration } from '@design-studio/types'
import { getTableName } from './client'

/**
 * Get an iteration by ID
 */
export async function getIterationById(
  client: DynamoDBDocumentClient,
  ideaId: string,
  iterationId: string,
): Promise<Iteration | null> {
  const result = await client.send(new GetCommand({
    TableName: getTableName(),
    Key: {
      PK: `IDEA#${ideaId}`,
      SK: `ITER#${iterationId}`,
    },
  }))

  if (!result.Item) {
    return null
  }

  return result.Item as Iteration
}

/**
 * Get all iterations for an idea
 */
export async function getIterationsByIdea(client: DynamoDBDocumentClient, ideaId: string): Promise<Iteration[]> {
  const result = await client.send(new QueryCommand({
    TableName: getTableName(),
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `IDEA#${ideaId}`,
      ':sk': 'ITER#',
    },
    ScanIndexForward: false, // newest first
  }))

  return (result.Items || []) as Iteration[]
}

/**
 * Create a new iteration
 */
export async function createIteration(client: DynamoDBDocumentClient, iteration: Iteration): Promise<void> {
  await client.send(new PutCommand({
    TableName: getTableName(),
    Item: {
      PK: `IDEA#${iteration.ideaId}`,
      SK: `ITER#${iteration.id}`,
      ...iteration,
    },
  }))
}

/**
 * Update an iteration
 */
export async function updateIteration(
  client: DynamoDBDocumentClient,
  ideaId: string,
  iterationId: string,
  updates: Partial<Omit<Iteration, 'id' | 'ideaId' | 'createdAt'>>,
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
      PK: `IDEA#${ideaId}`,
      SK: `ITER#${iterationId}`,
    },
    UpdateExpression: `SET ${expressions.join(', ')}`,
    ExpressionAttributeValues: values,
  }))
}
