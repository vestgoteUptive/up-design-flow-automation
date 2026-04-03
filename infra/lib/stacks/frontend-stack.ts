/**
 * Frontend Stack - S3 bucket and CloudFront CDN
 */

import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'

export interface FrontendStackProps extends cdk.StackProps {
  environment: string
  apiEndpoint: string
}

export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket
  public readonly distribution: cloudfront.Distribution

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props)

    // S3 bucket for frontend assets
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `design-studio-frontend-${props.environment}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
    })

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    })

    // Deploy frontend assets (would be the Next.js build output)
    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset('../apps/web/out')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    })

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      exportName: `${props.environment}-frontend-bucket`,
    })

    new cdk.CfnOutput(this, 'DistributionDomain', {
      value: this.distribution.distributionDomainName,
      exportName: `${props.environment}-frontend-domain`,
    })

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      exportName: `${props.environment}-cloudfront-id`,
    })
  }
}
