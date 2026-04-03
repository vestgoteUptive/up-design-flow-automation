#!/usr/bin/env node

/**
 * CDK App - Orchestrates all infrastructure stacks
 */

import * as cdk from 'aws-cdk-lib'
import { DatabaseStack } from '../lib/stacks/database-stack'
import { ApiStack } from '../lib/stacks/api-stack'
import { FrontendStack } from '../lib/stacks/frontend-stack'
import { BudgetStack } from '../lib/stacks/budget-stack'

const app = new cdk.App()

// Get context values
const environment = app.node.tryGetContext('environment') || 'dev'
const alertEmail = process.env.ALERT_EMAIL || 'admin@example.com'

// Create stacks
const databaseStack = new DatabaseStack(app, `DesignStudioDatabaseStack-${environment}`, {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'eu-north-1',
  },
})

const apiStack = new ApiStack(app, `DesignStudioApiStack-${environment}`, {
  environment,
  dynamodbTable: databaseStack.table,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'eu-north-1',
  },
})

const frontendStack = new FrontendStack(app, `DesignStudioFrontendStack-${environment}`, {
  environment,
  apiEndpoint: apiStack.api.url,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'eu-north-1',
  },
})

const budgetStack = new BudgetStack(app, `DesignStudioBudgetStack-${environment}`, {
  environment,
  alertEmail,
  bedrockMonthlyBudget: environment === 'prod' ? 100 : 50,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'eu-north-1',
  },
})

// Dependencies
apiStack.addDependency(databaseStack)
frontendStack.addDependency(apiStack)
budgetStack.addDependency(apiStack)

// Tagging
cdk.Tags.of(app).add('Application', 'DesignStudio')
cdk.Tags.of(app).add('Environment', environment)
cdk.Tags.of(app).add('ManagedBy', 'CDK')

app.synth()
