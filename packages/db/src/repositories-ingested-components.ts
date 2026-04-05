/**
 * Ingested Components Repository
 * Stores raw component discovery results from Design Importer agent
 */

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { IngestedComponent, IngestionStatus } from '@design-studio/types'

export class IngestedComponentsRepository {
  constructor(private client: DynamoDBDocumentClient) {}

  async create(component: IngestedComponent): Promise<IngestedComponent> {
    await this.client.send(
      new PutCommand({
        TableName: 'design-studio-table',
        Item: {
          PK: `PROJECT#${component.projectId}#INGESTED`,
          SK: `COMPONENT#${component.id}`,
          ...component,
          createdAt: new Date().toISOString(),
        },
      })
    )
    return component
  }

  async getById(projectId: string, componentId: string): Promise<IngestedComponent | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `PROJECT#${projectId}#INGESTED`,
          SK: `COMPONENT#${componentId}`,
        },
      })
    )
    return result.Item as IngestedComponent | null
  }

  async listByIngestion(projectId: string, ingestionId: string): Promise<IngestedComponent[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'ingestionId = :ingestionId',
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${projectId}#INGESTED`,
          ':sk': 'COMPONENT#',
          ':ingestionId': ingestionId,
        },
      })
    )
    return (result.Items || []) as IngestedComponent[]
  }

  async listByProject(projectId: string): Promise<IngestedComponent[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${projectId}#INGESTED`,
          ':sk': 'COMPONENT#',
        },
      })
    )
    return (result.Items || []) as IngestedComponent[]
  }

  async updateStatus(
    projectId: string,
    componentId: string,
    status: IngestionStatus
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `PROJECT#${projectId}#INGESTED`,
          SK: `COMPONENT#${componentId}`,
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

  async bulkUpdateStatus(
    projectId: string,
    componentIds: string[],
    status: IngestionStatus
  ): Promise<void> {
    const updates = componentIds.map((id) =>
      this.client.send(
        new UpdateCommand({
          TableName: 'design-studio-table',
          Key: {
            PK: `PROJECT#${projectId}#INGESTED`,
            SK: `COMPONENT#${id}`,
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
    )
    await Promise.all(updates)
  }
}
