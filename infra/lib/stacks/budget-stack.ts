/**
 * Budget & Cost Control Stack
 * Alerts on spending and caps Lambda concurrency
 */

import * as cdk from 'aws-cdk-lib'
import * as budgets from 'aws-cdk-lib/aws-budgets'
import { Construct } from 'constructs'

export interface BudgetStackProps extends cdk.StackProps {
  environment: string
  alertEmail: string
  bedrockMonthlyBudget?: number
}

export class BudgetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BudgetStackProps) {
    super(scope, id, props)

    const monthlyBudget = props.bedrockMonthlyBudget || 50

    // Bedrock spend budget
    new budgets.CfnBudget(this, 'BedrockBudget', {
      budget: {
        budgetName: `design-studio-bedrock-${props.environment}`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: monthlyBudget,
          unit: 'USD',
        },
        costFilters: {
          Service: ['Amazon Bedrock'],
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: props.alertEmail,
            },
          ],
        },
      ],
    })

    // Overall platform spend budget
    new budgets.CfnBudget(this, 'OverallBudget', {
      budget: {
        budgetName: `design-studio-overall-${props.environment}`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: monthlyBudget * 2, // Allow some headroom
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'FORECASTED',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: props.alertEmail,
            },
          ],
        },
      ],
    })
  }
}
