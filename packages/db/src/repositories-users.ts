/**
 * User repository - all database operations for users
 * Uses DynamoDB with PK=USER#<id>, GSI1PK=EMAIL#<email> for lookups
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { User } from '@design-studio/types'
import { getTableName } from './client'

/**
 * Get a user by ID
 */
export async function getUserById(client: DynamoDBDocumentClient, userId: string): Promise<User | null> {
  const result = await client.send(new GetCommand({
    TableName: getTableName(),
    Key: {
      PK: `USER#${userId}`,
      SK: '#PROFILE',
    },
  }))

  if (!result.Item) {
    return null
  }

  return result.Item as User
}

/**
 * Get a user by email
 */
export async function getUserByEmail(client: DynamoDBDocumentClient, email: string): Promise<User | null> {
  const result = await client.send(new QueryCommand({
    TableName: getTableName(),
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `EMAIL#${email}`,
      ':sk': '#PROFILE',
    },
    Limit: 1,
  }))

  if (!result.Items || result.Items.length === 0) {
    return null
  }

  return result.Items[0] as User
}

/**
 * Create a new user
 */
export async function createUser(client: DynamoDBDocumentClient, user: User): Promise<void> {
  await client.send(new PutCommand({
    TableName: getTableName(),
    Item: {
      PK: `USER#${user.id}`,
      SK: '#PROFILE',
      GSI1PK: `EMAIL#${user.email}`,
      GSI1SK: '#PROFILE',
      ...user,
    },
  }))
}

/**
 * Update a user (password, name, etc.)
 */
export async function updateUser(
  client: DynamoDBDocumentClient,
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>,
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
      PK: `USER#${userId}`,
      SK: '#PROFILE',
    },
    UpdateExpression: `SET ${expressions.join(', ')}`,
    ExpressionAttributeValues: values,
  }))
}
