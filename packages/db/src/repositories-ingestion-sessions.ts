/**
 * Ingestion Session Repository
 * Tracks design ingestion operations (import sessions)
 */

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { IngestionSession } from '@design-studio/types'

export class IngestionSessionsRepository {
  constructor(private client: DynamoDBDocumentClient) {}

  async create(session: IngestionSession): Promise<IngestionSession> {
    const item = {
      ...session,
      createdAt: new Date().toISOString(),
    }

    await this.client.send(
      new PutCommand({
        TableName: 'design-studio-table',
        Item: {
          PK: `PROJECT#${session.projectId}#INGESTIONS`,
          SK: `SESSION#${session.id}`,
          ...item,
        },
      })
    )
    return session
  }

  async getById(projectId: string, sessionId: string): Promise<IngestionSession | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `PROJECT#${projectId}#INGESTIONS`,
          SK: `SESSION#${sessionId}`,
        },
      })
    )
    return result.Item as IngestionSession | null
  }

  async listByProject(projectId: string): Promise<IngestionSession[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${projectId}#INGESTIONS`,
          ':sk': 'SESSION#',
        },
        ScanIndexForward: false, // Latest first
      })
    )
    return (result.Items || []) as IngestionSession[]
  }

  async updateStatus(
    projectId: string,
    sessionId: string,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    metadata?: { totalComponentsFound?: number; selectedForGeneration?: number; errorMessage?: string }
  ): Promise<void> {
    const updates: Record<string, any> = {
      ':status': status,
      ':now': new Date().toISOString(),
    }

    let updateExpression = 'SET #status = :status, updatedAt = :now'

    if (metadata?.totalComponentsFound !== undefined) {
      updates[':totalComponents'] = metadata.totalComponentsFound
      updateExpression += ', totalComponentsFound = :totalComponents'
    }

    if (metadata?.selectedForGeneration !== undefined) {
      updates[':selected'] = metadata.selectedForGeneration
      updateExpression += ', selectedForGeneration = :selected'
    }

    if (metadata?.errorMessage !== undefined) {
      updates[':error'] = metadata.errorMessage
      updateExpression += ', errorMessage = :error'
    }

    if (status === 'COMPLETED' || status === 'FAILED') {
      updates[':completed'] = new Date().toISOString()
      updateExpression += ', completedAt = :completed'
    }

    await this.client.send(
      new UpdateCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `PROJECT#${projectId}#INGESTIONS`,
          SK: `SESSION#${sessionId}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: updates,
      })
    )
  }

  async getLatestSession(projectId: string): Promise<IngestionSession | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${projectId}#INGESTIONS`,
          ':sk': 'SESSION#',
        },
        ScanIndexForward: false, // Latest first
        Limit: 1,
      })
    )
    return (result.Items?.[0] || null) as IngestionSession | null
  }
}
