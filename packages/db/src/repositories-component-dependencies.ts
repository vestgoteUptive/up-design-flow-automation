/**
 * Component Dependencies Repository
 * Tracks component hierarchy and relationships
 */

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import type { ComponentDependency, ComponentDependencyType } from '@design-studio/types'
import { getTableName } from './client'

export class ComponentDependenciesRepository {
  constructor(private client: DynamoDBDocumentClient) {}

  async createDependency(dependency: ComponentDependency): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: getTableName(),
        Item: {
          PK: `COMPONENT#${dependency.componentId}#DEPS`,
          SK: `DEPENDS_ON#${dependency.dependsOnId}`,
          ...dependency,
          createdAt: new Date().toISOString(),
        },
      })
    )
  }

  async getDependencies(componentId: string): Promise<ComponentDependency[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: getTableName(),
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `COMPONENT#${componentId}#DEPS`,
          ':sk': 'DEPENDS_ON#',
        },
      })
    )
    return (result.Items || []) as ComponentDependency[]
  }

  async getDependents(componentId: string): Promise<ComponentDependency[]> {
    // Components that depend ON this component
    const result = await this.client.send(
      new QueryCommand({
        TableName: getTableName(),
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `COMPONENT#${componentId}#DEPENDENTS`,
          ':sk': 'COMPONENT#',
        },
      })
    )
    return (result.Items || []) as ComponentDependency[]
  }

  async getDependenciesByType(
    componentId: string,
    type: ComponentDependencyType
  ): Promise<ComponentDependency[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: getTableName(),
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'dependencyType = :type',
        ExpressionAttributeValues: {
          ':pk': `COMPONENT#${componentId}#DEPS`,
          ':sk': 'DEPENDS_ON#',
          ':type': type,
        },
      })
    )
    return (result.Items || []) as ComponentDependency[]
  }

  async removeDependency(componentId: string, dependsOnId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: getTableName(),
        Key: {
          PK: `COMPONENT#${componentId}#DEPS`,
          SK: `DEPENDS_ON#${dependsOnId}`,
        },
      })
    )
  }

  async bulkCreateDependencies(dependencies: ComponentDependency[]): Promise<void> {
    const creates = dependencies.map((dep) =>
      this.client.send(
        new PutCommand({
          TableName: getTableName(),
          Item: {
            PK: `COMPONENT#${dep.componentId}#DEPS`,
            SK: `DEPENDS_ON#${dep.dependsOnId}`,
            GSI1PK: `COMPONENT#${dep.dependsOnId}#DEPENDENTS`,
            GSI1SK: `COMPONENT#${dep.componentId}`,
            ...dep,
            createdAt: new Date().toISOString(),
          },
        })
      )
    )
    await Promise.all(creates)
  }

  /**
   * Get dependency graph: all transitive dependencies
   * Returns flattened list of all components this one depends on (direct + indirect)
   */
  async getTransitiveDependencies(componentId: string, visited = new Set<string>()): Promise<string[]> {
    if (visited.has(componentId)) return []

    visited.add(componentId)
    const deps = await this.getDependencies(componentId)
    let allDeps: string[] = []

    for (const dep of deps) {
      allDeps.push(dep.dependsOnId)
      const transitive = await this.getTransitiveDependencies(dep.dependsOnId, visited)
      allDeps = [...allDeps, ...transitive]
    }

    return Array.from(new Set(allDeps)) // Remove duplicates
  }
}
