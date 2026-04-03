#!/usr/bin/env node

/**
 * Local DynamoDB setup script
 * Creates the design-studio table with proper schema and GSIs
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
  endpoint: 'http://localhost:8000',
});

const params = {
  TableName: 'design-studio-local',
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'GSI1PK', AttributeType: 'S' },
    { AttributeName: 'GSI1SK', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
  StreamSpecification: {
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
};

async function createTable() {
  try {
    console.log('Creating DynamoDB table design-studio-local...');
    await client.send(new CreateTableCommand(params));
    console.log('✓ Table created successfully');
    process.exit(0);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('✓ Table already exists');
      process.exit(0);
    }
    console.error('Error creating table:', error.message);
    process.exit(1);
  }
}

createTable();
