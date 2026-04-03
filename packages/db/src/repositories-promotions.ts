/**
 * Promotions repository - all database operations for promotions
 * PK=IDEA#<ideaId>, SK=#PROMOTION (one promotion per idea)
 * GSI1PK=TYPE#PROMOTION for querying all promotions
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { Promotion } from '@design-studio/types'
import { getTableName } from './client'

/**
 * Get the promotion record for an idea
 */
export async function getPromotion(
  client: DynamoDBDocumentClient,
  ideaId: string,
): Promise<Promotion | null> {
  const result = await client.send(new GetCommand({
    TableName: getTableName(),
    Key: {
      PK: `IDEA#${ideaId}`,
      SK: '#PROMOTION',
    },
  }))

  if (!result.Item) {
    return null
  }

  return result.Item as Promotion
}

/**
 * Get all promotions (with optional status filter)
 */
export async function getPromotions(
  client: DynamoDBDocumentClient,
  status?: string,
): Promise<Promotion[]> {
  const result = await client.send(new QueryCommand({
    TableName: getTableName(),
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ...(status && {
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':pk': 'TYPE#PROMOTION',
        ':status': status,
      },
    }),
    ...(!status && {
      ExpressionAttributeValues: {
        ':pk': 'TYPE#PROMOTION',
      },
    }),
  }))

  return (result.Items || []) as Promotion[]
}

/**
 * Create a new promotion for an idea
 */
export async function createPromotion(client: DynamoDBDocumentClient, promotion: Promotion): Promise<void> {
  await client.send(new PutCommand({
    TableName: getTableName(),
    Item: {
      PK: `IDEA#${promotion.ideaId}`,
      SK: '#PROMOTION',
      GSI1PK: 'TYPE#PROMOTION',
      GSI1SK: promotion.status,
      ...promotion,
    },
  }))
}

/**
 * Update a promotion
 */
export async function updatePromotion(
  client: DynamoDBDocumentClient,
  ideaId: string,
  updates: Partial<Omit<Promotion, 'id' | 'ideaId' | 'createdAt'>>,
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

  // Update GSI1SK if status changed
  if (updates.status) {
    expressions.push('GSI1SK = :status')
    values[':status'] = updates.status
  }

  await client.send(new UpdateCommand({
    TableName: getTableName(),
    Key: {
      PK: `IDEA#${ideaId}`,
      SK: '#PROMOTION',
    },
    UpdateExpression: `SET ${expressions.join(', ')}`,
    ExpressionAttributeValues: values,
  }))
}
