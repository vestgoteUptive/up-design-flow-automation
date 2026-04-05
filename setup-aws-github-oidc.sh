#!/bin/bash

# AWS GitHub OIDC Setup Script
# This script sets up GitHub Actions to deploy to your AWS account using OIDC
# Run this with AWS CLI configured for the design-factory account

set -e

# Configuration
GITHUB_ORG="vestgoteUptive"
GITHUB_REPO="up-design-flow-automation"
AWS_REGION="eu-north-1"  # Stockholm
ALERT_EMAIL="henrik@uptive.se"

echo "🚀 Setting up GitHub OIDC for AWS deployment"
echo "=============================================="
echo "GitHub Repo: ${GITHUB_ORG}/${GITHUB_REPO}"
echo "AWS Region: ${AWS_REGION}"
echo "Alert Email: ${ALERT_EMAIL}"
echo ""

# Step 1: Create GitHub OIDC Provider (if it doesn't exist)
echo "📝 Step 1: Creating GitHub OIDC Provider in AWS..."
OIDC_PROVIDER_ARN=$(aws iam list-open-id-connect-providers \
  --query "OpenIDConnectProviderList[?contains(Arn, 'token.actions.githubusercontent.com')].Arn" \
  --output text)

if [ -z "$OIDC_PROVIDER_ARN" ]; then
  echo "Creating new OIDC provider..."
  OIDC_PROVIDER_ARN=$(aws iam create-open-id-connect-provider \
    --url "https://token.actions.githubusercontent.com" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
    --query 'OpenIDConnectProviderArn' \
    --output text)
  echo "✅ Created OIDC Provider: ${OIDC_PROVIDER_ARN}"
else
  echo "✅ OIDC Provider already exists: ${OIDC_PROVIDER_ARN}"
fi

# Step 2: Create IAM Role for GitHub Actions
echo ""
echo "📝 Step 2: Creating IAM Role for GitHub Actions..."

ROLE_NAME="GitHubActionsDeployRole"

# Create trust policy document
cat > /tmp/github-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "${OIDC_PROVIDER_ARN}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_ORG}/${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
EOF

# Check if role exists
if aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
  echo "Role ${ROLE_NAME} already exists. Updating trust policy..."
  aws iam update-assume-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-document file:///tmp/github-trust-policy.json
else
  echo "Creating new role ${ROLE_NAME}..."
  aws iam create-role \
    --role-name "${ROLE_NAME}" \
    --assume-role-policy-document file:///tmp/github-trust-policy.json \
    --description "Role for GitHub Actions to deploy Design Studio"
fi

# Step 3: Attach permissions policies
echo ""
echo "📝 Step 3: Attaching IAM policies to role..."

# Create inline policy with all necessary permissions
cat > /tmp/github-deploy-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationFullAccess",
      "Effect": "Allow",
      "Action": [
        "cloudformation:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3FullAccess",
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudFrontFullAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LambdaFullAccess",
      "Effect": "Allow",
      "Action": [
        "lambda:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "APIGatewayFullAccess",
      "Effect": "Allow",
      "Action": [
        "apigateway:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DynamoDBFullAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMRoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchFullAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:*",
        "logs:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SSMParameterAccess",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:PutParameter",
        "ssm:DeleteParameter"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BudgetsAccess",
      "Effect": "Allow",
      "Action": [
        "budgets:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SNSAccess",
      "Effect": "Allow",
      "Action": [
        "sns:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CDKBootstrapAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:*",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name "GitHubActionsDeployPolicy" \
  --policy-document file:///tmp/github-deploy-policy.json

echo "✅ Policies attached to role"

# Step 4: Get Role ARN
echo ""
echo "📝 Step 4: Getting Role ARN..."
ROLE_ARN=$(aws iam get-role \
  --role-name "${ROLE_NAME}" \
  --query 'Role.Arn' \
  --output text)

echo "✅ Role ARN: ${ROLE_ARN}"

# Step 5: Bootstrap CDK (required for CDK deployments)
echo ""
echo "📝 Step 5: Bootstrapping AWS CDK in region ${AWS_REGION}..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Your AWS Account ID: ${ACCOUNT_ID}"
echo ""
echo "⚠️  CDK Bootstrap Required"
echo "You need to bootstrap CDK in your account. Run this command:"
echo ""
echo "npx cdk bootstrap aws://${ACCOUNT_ID}/${AWS_REGION}"
echo ""

# Clean up temp files
rm -f /tmp/github-trust-policy.json /tmp/github-deploy-policy.json

# Step 6: Output GitHub Secrets
echo ""
echo "=============================================="
echo "✅ AWS Setup Complete!"
echo "=============================================="
echo ""
echo "📋 GitHub Secrets Configuration"
echo "--------------------------------"
echo "Go to: https://github.com/${GITHUB_ORG}/${GITHUB_REPO}/settings/secrets/actions"
echo ""
echo "Add these secrets:"
echo ""
echo "1. AWS_OIDC_ROLE_ARN"
echo "   Value: ${ROLE_ARN}"
echo ""
echo "2. AWS_REGION"
echo "   Value: ${AWS_REGION}"
echo ""
echo "3. ALERT_EMAIL"
echo "   Value: ${ALERT_EMAIL}"
echo ""
echo "=============================================="
echo ""
echo "⚠️  IMPORTANT: Bootstrap CDK first!"
echo "Run this command before your first deployment:"
echo ""
echo "npx cdk bootstrap aws://${ACCOUNT_ID}/${AWS_REGION}"
echo ""
echo "Then push a commit to trigger the deployment pipeline."
echo "=============================================="
