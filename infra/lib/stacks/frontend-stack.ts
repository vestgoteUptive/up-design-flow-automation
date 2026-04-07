/**
 * Frontend Stack - S3 bucket and CloudFront CDN
 */

import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
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
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
      ],
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
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
