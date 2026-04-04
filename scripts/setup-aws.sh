#!/usr/bin/env bash
# =============================================================================
# setup-aws.sh  —  One-time AWS setup for GitHub Actions deployments
#
# What this does:
#   1. Deploys the CloudFormation stack that creates the OIDC provider + IAM role
#   2. Bootstraps CDK in your account/region
#   3. Prints the exact GitHub Secrets you need to set
#
# Prerequisites:
#   - AWS CLI installed and configured (aws configure)
#   - Your IAM user/role must have CloudFormation + IAM permissions
#   - Node.js + npx available (for CDK bootstrap)
#
# Usage:
#   chmod +x scripts/setup-aws.sh
#   ./scripts/setup-aws.sh
# =============================================================================

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
STACK_NAME="github-actions-oidc-design-studio"
REGION="${AWS_REGION:-eu-north-1}"
GITHUB_ORG="vestgoteUptive"
GITHUB_REPO="up-design-flow-automation"
TEMPLATE="$(dirname "$0")/aws-github-oidc.yml"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== Design Studio — AWS Setup ===${NC}\n"

# ── Step 1: Deploy CloudFormation stack ──────────────────────────────────────
echo -e "${YELLOW}Step 1/3${NC} — Deploying OIDC provider + IAM role (CloudFormation)..."

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --parameter-overrides \
      GitHubOrg="$GITHUB_ORG" \
      GitHubRepo="$GITHUB_REPO" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION"

# Get the role ARN from stack outputs
ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
  --output text)

echo -e "${GREEN}✓ CloudFormation stack deployed${NC}"
echo -e "  Role ARN: ${ROLE_ARN}\n"

# ── Step 2: CDK Bootstrap ────────────────────────────────────────────────────
echo -e "${YELLOW}Step 2/3${NC} — Bootstrapping CDK in ${REGION}..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

npx aws-cdk bootstrap "aws://${ACCOUNT_ID}/${REGION}" \
  --trust "$ROLE_ARN" \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess

echo -e "${GREEN}✓ CDK bootstrapped${NC}\n"

# ── Step 3: Print GitHub Secrets ─────────────────────────────────────────────
echo -e "${YELLOW}Step 3/3${NC} — Add these secrets to GitHub:"
echo -e "  ${CYAN}https://github.com/${GITHUB_ORG}/${GITHUB_REPO}/settings/secrets/actions${NC}\n"

echo -e "  ${GREEN}AWS_OIDC_ROLE_ARN${NC}  =  ${ROLE_ARN}"
echo -e "  ${GREEN}AWS_REGION${NC}         =  ${REGION}"
echo -e "  ${GREEN}ALERT_EMAIL${NC}        =  <your-email@example.com>"

echo -e "\n${GREEN}=== Setup complete! Push to main to trigger your first deploy. ===${NC}\n"
