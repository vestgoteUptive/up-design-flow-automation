/**
 * Database Stack - DynamoDB table with GSI and streams
 */

import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export interface DatabaseStackProps extends cdk.StackProps {
  environment: string
}

export class DatabaseStack extends cdk.Stack {
  public readonly table: dynamodb.Table

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props)

    const tableName = `design-studio-${props.environment}`

    this.table = new dynamodb.Table(this, 'DesignStudioTable', {
      tableName,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    })

    // Global Secondary Index 1 - for reverse lookups
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // Output table name and ARN
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      exportName: `${props.environment}-dynamodb-table-name`,
    })

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      exportName: `${props.environment}-dynamodb-table-arn`,
    })
  }
}
