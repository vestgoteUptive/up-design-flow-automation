/**
 * Component Generation Repository
 * Tracks generated components, versions, and update status
 */

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { ComponentGeneration, IngestionStatus } from '@design-studio/types'

export class ComponentGenerationRepository {
  constructor(private client: DynamoDBDocumentClient) {}

  async create(generation: ComponentGeneration): Promise<ComponentGeneration> {
    const item = {
      ...generation,
      createdAt: new Date().toISOString(),
    }

    await this.client.send(
      new PutCommand({
        TableName: 'design-studio-table',
        Item: {
          PK: `INGESTED#${generation.ingestedComponentId}`,
          SK: `GENERATION#v${generation.version}`,
          ...item,
        },
      })
    )
    return generation
  }

  async getLatestVersion(ingestedComponentId: string): Promise<ComponentGeneration | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `INGESTED#${ingestedComponentId}`,
          ':sk': 'GENERATION#',
        },
        ScanIndexForward: false, // Descending to get latest first
        Limit: 1,
      })
    )
    return (result.Items?.[0] || null) as ComponentGeneration | null
  }

  async getVersion(ingestedComponentId: string, version: number): Promise<ComponentGeneration | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `INGESTED#${ingestedComponentId}`,
          SK: `GENERATION#v${version}`,
        },
      })
    )
    return result.Item as ComponentGeneration | null
  }

  async listVersions(ingestedComponentId: string): Promise<ComponentGeneration[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `INGESTED#${ingestedComponentId}`,
          ':sk': 'GENERATION#',
        },
        ScanIndexForward: false, // Latest first
      })
    )
    return (result.Items || []) as ComponentGeneration[]
  }

  async updateStatus(
    ingestedComponentId: string,
    version: number,
    status: IngestionStatus
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `INGESTED#${ingestedComponentId}`,
          SK: `GENERATION#v${version}`,
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :now',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':now': new Date().toISOString(),
        },
      })
    )
  }

  async markNeedsUpdate(
    ingestedComponentId: string,
    latestVersion: number,
    sourceUpdatedAt: string
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `INGESTED#${ingestedComponentId}`,
          SK: `GENERATION#v${latestVersion}`,
        },
        UpdateExpression: 'SET #status = :status, sourceUpdatedAt = :sourceUpdatedAt, updatedAt = :now',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'NEEDS_UPDATE',
          ':sourceUpdatedAt': sourceUpdatedAt,
          ':now': new Date().toISOString(),
        },
      })
    )
  }

  async addToVersionHistory(
    ingestedComponentId: string,
    version: number,
    entry: { version: number; generatedAt: string; notes?: string; changedTokens?: string[] }
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `INGESTED#${ingestedComponentId}`,
          SK: `GENERATION#v${version}`,
        },
        UpdateExpression: 'SET versionHistory = list_append(versionHistory, :entry)',
        ExpressionAttributeValues: {
          ':entry': [entry],
        },
      })
    )
  }
}
