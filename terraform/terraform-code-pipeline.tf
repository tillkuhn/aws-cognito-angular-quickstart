## todo
## To allow AWS CodeBuild to retrieve custom environment variables stored in Amazon EC2 Systems Manager Parameter Store,
## you must add the ssm:GetParameters action to your AWS CodeBuild service role. For more information, see Create an AWS CodeBuild Service Role.

# https://www.terraform.io/docs/providers/aws/d/caller_identity.html
variable "codebuild_suffix" { default = "pipeline-build" }

data "aws_caller_identity" "current" {}


#####################################################################
## Create SNS Topic for important events,
## email event subscription is not supported so we skip subscriptions
#####################################################################
resource "aws_sns_topic" "events" {
  name = "${var.app_id}-events"
}

#####################################################################
# update environment.ts template with actual IDs used
# by the application, create local env specific scripts
#####################################################################
data "template_file" "environment" {
  template = "${file("${path.module}/../src/environments/environment.ts.tmpl")}"
  vars {
    identityPoolId = "${aws_cognito_identity_pool.main.id}"
    region = "${var.aws_region}"
    bucketRegion = "${var.aws_region}"
    bucketNamePrefix = "${var.bucket_name_prefix}"
    ddbTableNamePrefix = "${var.table_name_prefix}"
    userPoolId = "${aws_cognito_user_pool.main.id}"
    clientId = "${aws_cognito_user_pool_client.main.id}"
    mapboxAccessToken = "${var.mapbox_access_token}"
    apiGatewayInvokeUrl = "${aws_api_gateway_deployment.main.invoke_url}"
  }
}

resource "local_file" "environment" {
  content     = "${data.template_file.environment.rendered}"
  filename = "${path.module}/../src/environments/environment.ts"
}

resource "local_file" "environment_prod" {
  content     = "${data.template_file.environment.rendered}"
  filename = "${path.module}/../src/environments/environment.prod.ts"
}

#####################################################################
## create variables in Systems Manager to be use for substituion
## in environment.prod.ts by code pipeline
#####################################################################

resource "aws_ssm_parameter" "bucketRegion" {
  name  = "/${var.app_id}/${var.env}/bucketRegion"
  type  = "String"
  description = "The ID of the cognito Identy Pool managed by Terraform"
  value = "${var.aws_region}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "region" {
  name  = "/${var.app_id}/${var.env}/region"
  type  = "String"
  description = "The ID of the cognito Identy Pool managed by Terraform"
  value = "${var.aws_region}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "identityPoolId" {
  name  = "/${var.app_id}/${var.env}/identityPoolId"
  type  = "String"
  description = "The ID of the cognito Identy Pool managed by Terraform"
  value = "${aws_cognito_identity_pool.main.id}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "userPoolId" {
  name  = "/${var.app_id}/${var.env}/userPoolId"
  type  = "String"
  description = "The ID of the cognito User Pool managed by Terraform"
  value = "${aws_cognito_user_pool.main.id}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "clientId" {
  name  = "/${var.app_id}/${var.env}/clientId"
  type  = "String"
  description = "The ID of the cognito User Pool Client managed by Terraform"
  value = "${aws_cognito_user_pool_client.main.id}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "ddbTableNamePrefix" {
  name  = "/${var.app_id}/${var.env}/ddbTableNamePrefix"
  type  = "String"
  description = "Prefix for generated DynamoDB Tables"
  value = "${var.table_name_prefix}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "bucketNamePrefix" {
  name  = "/${var.app_id}/${var.env}/bucketNamePrefix"
  type  = "String"
  description = "Prefix for bucket (e.g. for multi tenancy)"
  value = "${var.bucket_name_prefix}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "mapboxAccessToken" {
  name  = "/${var.app_id}/${var.env}/mapboxAccessToken"
  type  = "String"
  description = "Token to Access Mapbox API for geo visualization"
  value = "${var.mapbox_access_token}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "apiGatewayInvokeUrl" {
  name  = "/${var.app_id}/${var.env}/apiGatewayInvokeUrl"
  type  = "String"
  description = "Endpoint of the deployed API Gateway"
  value = "${aws_api_gateway_deployment.main.invoke_url}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "webappBucketS3" {
  name  = "/${var.app_id}/${var.env}/webappBucketS3"
  type  = "String"
  description = "S3 Target of deployment of webapp"
  value = "s3://${var.route53_sub_domain}.${var.route53_zone_domain}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "publishDeployResultTopic" {
  name  = "/${var.app_id}/${var.env}/publishDeployResultTopic"
  type  = "String"
  description = "Topic ARN to publish pipelines results"
  value = "${aws_sns_topic.events.arn}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

## ROLLI ROLLI

resource "aws_iam_role" "code_pipeline_role" {
  name = "${var.role_name_prefix}-code-pipeline"
  description = "Managed by Terraform"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

## TODO Code Pipeline should be managed by TF as well so we can use resource references and not hardcoded arns
resource "aws_iam_role_policy" "code_pipeline_role_policy" {
  name = "${var.role_name_prefix}-code-pipeline-policy"
  role = "${aws_iam_role.code_pipeline_role.id}"
  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowS3CodeAndLogsAccess",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:s3:::codepipeline-${var.aws_region}-*",
                "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.app_id}-${var.codebuild_suffix}",
                "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.app_id}-${var.codebuild_suffix}:*"
            ]
        },
        {
            "Sid": "AllowLogGroupCreation",
            "Effect": "Allow",
            "Action": "logs:CreateLogGroup",
            "Resource": [
                "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.app_id}-${var.codebuild_suffix}",
                "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.app_id}-${var.codebuild_suffix}:*"
            ]
        },
        {
            "Sid": "AllowAccessParameterStore",
            "Effect": "Allow",
            "Action": [
                "ssm:GetParametersByPath",
                "ssm:GetParameters"
            ],
            "Resource": "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.app_id}*"
        },
       {
            "Sid": "AllowWebsiteDeployS3SyncTaskPolicy",
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket",
              "s3:GetObject",
              "s3:GetBucketLocation",
              "s3:PutObject",
              "s3:PutObjectAcl",
              "s3:DeleteObject"
            ],
            "Resource": [
              "arn:aws:s3:::${var.route53_sub_domain}.${var.route53_zone_domain}",
              "arn:aws:s3:::${var.route53_sub_domain}.${var.route53_zone_domain}/*"
            ]
        },
       {
            "Sid": "AllowDeploymentInfoSNSPush",
            "Effect": "Allow",
            "Action": [
              "SNS:Publish"
            ],
            "Resource": [
              "${aws_sns_topic.events.arn}"
            ]
        }
    ]
}
EOF
}