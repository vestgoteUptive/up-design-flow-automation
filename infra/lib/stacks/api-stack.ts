/**
 * API Stack - Lambda functions and API Gateway
 */

import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as secrets from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'

export interface ApiStackProps extends cdk.StackProps {
  environment: string
  dynamodbTable: dynamodb.Table
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi
  public readonly handler: lambda.Function

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    // JWT Secret
    const jwtSecret = new secrets.Secret(this, 'JWTSecret', {
      secretName: `design-studio/jwt-secret-${props.environment}`,
      description: 'JWT signing secret for authentication',
      generateSecretString: {
        passwordLength: 32,
        excludeCharacters: '"\'\\/',
      },
    })

    // Lambda execution role
    const role = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    })

    // DynamoDB permissions
    props.dynamodbTable.grantReadWriteData(role)

    // Bedrock permissions (optional - for agent invocation)
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}::model/anthropic.claude-sonnet-4-20250514-v1:0`,
        ],
      }),
    )

    // Secrets Manager permissions
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [jwtSecret.secretArn],
      }),
    )

    // Lambda function
    this.handler = new lambda.Function(this, 'ApiHandler', {
      functionName: `design-studio-api-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/index.handler',
      code: lambda.Code.fromAsset('../apps/api', {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: ['bash', '-c', 'npm install && npm run build'],
          environment: {
            NODE_ENV: 'production',
          },
        },
      }),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      role,
      environment: {
        DYNAMODB_TABLE: props.dynamodbTable.tableName,
        JWT_SECRET: jwtSecret.secretValue.toString(),
        BEDROCK_MODEL_ID: 'claude-sonnet-4-20250514',
        ENVIRONMENT: props.environment,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    })

    // API Gateway
    this.api = new apigateway.RestApi(this, 'DesignStudioApi', {
      restApiName: `design-studio-api-${props.environment}`,
      description: 'Design Studio API',
      deployOptions: {
        stageName: props.environment,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    })

    // CORS configuration
    const corsPreflight = {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date'],
    }

    // Root resource proxies to Lambda
    const proxy = this.api.root.addResource('{proxy+}')
    proxy.addMethod('ANY', new apigateway.LambdaIntegration(this.handler), {
      defaultCorsPreflightOptions: corsPreflight,
    })

    // Health check endpoint
    this.api.root.addMethod('GET', new apigateway.LambdaIntegration(this.handler), {
      defaultCorsPreflightOptions: corsPreflight,
    })

    // Lambda reserved concurrency (prevent runaway costs)
    this.handler.addAutoScaling({ maxCapacity: 10 })

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      exportName: `${props.environment}-api-endpoint`,
    })

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      exportName: `${props.environment}-api-id`,
    })
  }
}
