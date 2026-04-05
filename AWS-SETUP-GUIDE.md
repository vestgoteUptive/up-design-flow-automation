# AWS Setup Guide for GitHub Actions Deployment

This guide will help you set up your AWS account (`design-factory`) to work with GitHub Actions for automated deployments.

## Prerequisites

1. **AWS CLI installed** - [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. **AWS credentials configured** for the `design-factory` account with user `vestgoteUptive`

### Check if AWS CLI is configured

```bash
aws sts get-caller-identity
```

This should show your account ID and user. If not, configure it:

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `eu-north-1`
- Default output format: `json`

## Step 1: Run the Setup Script

I've created an automated setup script that will:
- Create a GitHub OIDC provider in AWS
- Create an IAM role with the necessary permissions
- Output the values you need for GitHub secrets

Run:

```bash
./setup-aws-github-oidc.sh
```

This script is **safe to run multiple times** - it checks if resources exist before creating them.

## Step 2: Bootstrap AWS CDK

After running the setup script, it will give you a bootstrap command. Run it:

```bash
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/eu-north-1
```

(The script will show you the exact command with your account ID)

**What does this do?**
CDK bootstrap creates necessary AWS resources (S3 bucket, ECR repository, IAM roles) that CDK uses to deploy your infrastructure.

## Step 3: Configure GitHub Secrets

The script will output three secrets you need to add to GitHub.

Go to: https://github.com/vestgoteUptive/up-design-flow-automation/settings/secrets/actions

Click "New repository secret" and add:

1. **AWS_OIDC_ROLE_ARN**
   - The ARN of the IAM role (shown in script output)
   - Format: `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeployRole`

2. **AWS_REGION**
   - Value: `eu-north-1`

3. **ALERT_EMAIL**
   - Value: `henrik@uptive.se`

## Step 4: Test the Deployment

Once secrets are configured, push a commit to trigger the deployment:

```bash
git commit --allow-empty -m "test: Trigger deployment pipeline"
git push
```

Go to the Actions tab in GitHub to watch the deployment:
https://github.com/vestgoteUptive/up-design-flow-automation/actions

## What Gets Deployed?

When the pipeline runs successfully, it will create:

1. **Frontend (S3 + CloudFront)**
   - S3 bucket to store your Next.js static site
   - CloudFront CDN for global distribution
   - You'll get a public URL like: `https://d1234abcd.cloudfront.net`

2. **API (Lambda + API Gateway)**
   - Lambda functions for your API
   - API Gateway REST API
   - DynamoDB database tables

3. **Monitoring**
   - CloudWatch alarms
   - Budget alerts (sends to henrik@uptive.se)

## Finding Your Site URL

After deployment, the CloudFront URL will be in:
- GitHub Actions logs (deployment summary)
- AWS Console: CloudFormation → `DesignStudioFrontendStack-dev` → Outputs → `DistributionDomain`

Or run:

```bash
aws cloudformation describe-stacks \
  --stack-name DesignStudioFrontendStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomain`].OutputValue' \
  --output text
```

## Troubleshooting

### "Not authorized to perform: sts:AssumeRole"
- Check that GitHub secrets are correctly set
- Verify the role ARN in GitHub secrets matches what the script created

### "No bucket named 'cdk-hnb659fds-assets-...'"
- You need to run CDK bootstrap (Step 2)

### "Stack is in UPDATE_ROLLBACK_COMPLETE state"
- A previous deployment failed. Delete the stack and redeploy:
  ```bash
  aws cloudformation delete-stack --stack-name STACK_NAME
  ```

### Check deployment status

```bash
# List all CloudFormation stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Get detailed stack info
aws cloudformation describe-stacks --stack-name DesignStudioFrontendStack-dev
```

## Security Notes

- **OIDC is secure**: GitHub Actions authenticates using temporary credentials, no permanent AWS keys stored in GitHub
- **Least privilege**: The IAM role only has permissions needed for deployment
- **Region locked**: Deployment only works in `eu-north-1` (Stockholm)
- **Repository locked**: Only this specific GitHub repo can assume the role

## Cost Estimation

With AWS Free Tier:
- S3: ~$0.50/month (first 5GB free)
- CloudFront: Free for first 1TB transfer
- Lambda: Free for first 1M requests
- DynamoDB: Free for first 25GB
- API Gateway: Free for first 1M requests

Expected monthly cost: **$0-5/month** for low traffic

Budget alert set at $10/month will notify you at henrik@uptive.se if costs exceed threshold.

## Next Steps

After successful deployment:
1. Visit your CloudFront URL to see the live site
2. Test the API endpoints
3. Configure custom domain (optional)
4. Set up monitoring dashboards in CloudWatch

## Questions?

If something doesn't work, check:
1. AWS CLI is configured correctly (`aws sts get-caller-identity`)
2. GitHub secrets are set correctly
3. CDK is bootstrapped
4. GitHub Actions logs for error messages
