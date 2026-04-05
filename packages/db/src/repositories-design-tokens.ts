/**
 * Design Tokens Repository
 * Stores extracted design tokens (colors, typography, spacing, etc.)
 */

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { DesignToken, DesignTokenType } from '@design-studio/types'

export class DesignTokensRepository {
  constructor(private client: DynamoDBDocumentClient) {}

  async create(token: DesignToken): Promise<DesignToken> {
    const item = {
      ...token,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    }

    await this.client.send(
      new PutCommand({
        TableName: 'design-studio-table',
        Item: {
          PK: `PROJECT#${token.projectId}#TOKENS`,
          SK: `TOKEN#${token.id}`,
          ...item,
        },
      })
    )
    return token
  }

  async getById(projectId: string, tokenId: string): Promise<DesignToken | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `PROJECT#${projectId}#TOKENS`,
          SK: `TOKEN#${tokenId}`,
        },
      })
    )
    return result.Item as DesignToken | null
  }

  async listByProject(projectId: string): Promise<DesignToken[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${projectId}#TOKENS`,
          ':sk': 'TOKEN#',
        },
      })
    )
    return (result.Items || []) as DesignToken[]
  }

  async listByType(projectId: string, type: DesignTokenType): Promise<DesignToken[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${projectId}#TOKENS`,
          ':sk': 'TOKEN#',
          ':type': type,
        },
      })
    )
    return (result.Items || []) as DesignToken[]
  }

  async incrementUsage(projectId: string, tokenId: string, increment: number = 1): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: 'design-studio-table',
        Key: {
          PK: `PROJECT#${projectId}#TOKENS`,
          SK: `TOKEN#${tokenId}`,
        },
        UpdateExpression: 'SET usageCount = usageCount + :inc, updatedAt = :now',
        ExpressionAttributeValues: {
          ':inc': increment,
          ':now': new Date().toISOString(),
        },
      })
    )
  }

  async bulkCreate(tokens: DesignToken[]): Promise<DesignToken[]> {
    const creates = tokens.map((token) =>
      this.client.send(
        new PutCommand({
          TableName: 'design-studio-table',
          Item: {
            PK: `PROJECT#${token.projectId}#TOKENS`,
            SK: `TOKEN#${token.id}`,
            ...token,
            usageCount: 0,
            createdAt: new Date().toISOString(),
          },
        })
      )
    )
    await Promise.all(creates)
    return tokens
  }
}

/**
 * Component Tokens Repository
 * Many-to-many: which components use which tokens
 */
export class ComponentTokensRepository {
  constructor(private client: DynamoDBDocumentClient) {}

  async linkComponentToken(
    componentId: string,
    tokenId: string,
    usageCount: number = 1
  ): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: 'design-studio-table',
        Item: {
          PK: `COMPONENT#${componentId}#TOKENS`,
          SK: `TOKEN#${tokenId}`,
          componentId,
          tokenId,
          usageCount,
          linkedAt: new Date().toISOString(),
        },
      })
    )
  }

  async getTokensForComponent(componentId: string): Promise<{ tokenId: string; usageCount: number }[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `COMPONENT#${componentId}#TOKENS`,
          ':sk': 'TOKEN#',
        },
      })
    )
    return (result.Items || []).map((item: any) => ({
      tokenId: item.tokenId,
      usageCount: item.usageCount,
    }))
  }

  async getComponentsUsingToken(tokenId: string): Promise<string[]> {
    // Query using GSI1 - need to scan because of the design
    const result = await this.client.send(
      new QueryCommand({
        TableName: 'design-studio-table',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `TOKEN#${tokenId}#COMPONENTS`,
          ':sk': 'COMPONENT#',
        },
      })
    )
    return (result.Items || []).map((item: any) => item.componentId)
  }

  async bulkLinkTokens(
    componentId: string,
    tokens: Array<{ tokenId: string; usageCount: number }>
  ): Promise<void> {
    const links = tokens.map((token) =>
      this.client.send(
        new PutCommand({
          TableName: 'design-studio-table',
          Item: {
            PK: `COMPONENT#${componentId}#TOKENS`,
            SK: `TOKEN#${token.tokenId}`,
            GSI1PK: `TOKEN#${token.tokenId}#COMPONENTS`,
            GSI1SK: `COMPONENT#${componentId}`,
            componentId,
            tokenId: token.tokenId,
            usageCount: token.usageCount,
            linkedAt: new Date().toISOString(),
          },
        })
      )
    )
    await Promise.all(links)
  }
}
