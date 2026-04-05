#!/bin/bash

# Fix CDK Permissions Script
# Adds permissions for GitHub Actions role to assume CDK bootstrap roles

set -e

ROLE_NAME="GitHubActionsDeployRole"
AWS_REGION="eu-north-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🔧 Fixing CDK permissions for GitHub Actions role"
echo "=================================================="
echo "Account: ${ACCOUNT_ID}"
echo "Region: ${AWS_REGION}"
echo "Role: ${ROLE_NAME}"
echo ""

# Update the policy to include permissions to assume CDK bootstrap roles
cat > /tmp/github-deploy-policy-updated.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssumeRoleForCDKRoles",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": [
        "arn:aws:iam::${ACCOUNT_ID}:role/cdk-*"
      ]
    },
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
        "iam:UntagRole",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies"
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
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

echo "📝 Updating IAM policy..."
aws iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name "GitHubActionsDeployPolicy" \
  --policy-document file:///tmp/github-deploy-policy-updated.json

rm /tmp/github-deploy-policy-updated.json

echo ""
echo "✅ Permissions updated successfully!"
echo ""
echo "The GitHub Actions role can now:"
echo "  - Assume CDK bootstrap roles"
echo "  - Deploy infrastructure via CDK"
echo "  - Manage Secrets Manager"
echo ""
echo "Try pushing a commit again to trigger deployment."
