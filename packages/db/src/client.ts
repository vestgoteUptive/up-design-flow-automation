/**
 * DynamoDB client factory
 * Creates a configured DynamoDBDocumentClient for local or AWS environments
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

let client: DynamoDBDocumentClient | null = null

/**
 * Get or create the DynamoDB client
 * Respects DYNAMODB_ENDPOINT for local development
 */
export function getClient(): DynamoDBDocumentClient {
  if (client) {
    return client
  }

  const isLocal = process.env.DYNAMODB_ENDPOINT === 'http://localhost:8000'
  const region = process.env.AWS_REGION || 'us-east-1'

  const dynamodbClient = new DynamoDBClient({
    region,
    ...(isLocal && {
      endpoint: process.env.DYNAMODB_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
      },
    }),
  })

  client = DynamoDBDocumentClient.from(dynamodbClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: false,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  })

  return client
}

/**
 * Get the configured DynamoDB table name
 */
export function getTableName(): string {
  return process.env.DYNAMODB_TABLE || 'design-studio'
}
