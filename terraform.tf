################################################################
## declare vars, see terraform.tfvars for actual settings
################################################################
variable "aws_profile" {}
variable "aws_region" { default = "eu-central-1" }
variable "app_name" { default = "Yummy Dishes + Places" }
variable "app_id" { default = "yummy" }
variable "role_name_prefix" { default = "yummy" }
variable "table_name_prefix" { default = "yummy" }
variable "bucket_name_prefix" { default = "yummy" }
variable "ddb_default_wcu" { default = "1" }
variable "ddb_default_rcu" { default = "1" }
variable "env"{ default = "prod" }
variable "bucket_name_webapp" {}
variable "route53_subdomain" {}
variable "route53_zone" {}
variable "route53_alias_zone_id" {}
variable "mapbox_access_token" {}

#####################################################################
## configure AWS Provide, you can use key secret here,
## but we prefer a profile in ~/.aws/credentials
#####################################################################
provider "aws" {
  region     = "${var.aws_region}"
  profile    = "${var.aws_profile}"
}
#####################################################################
## create and configure S3 bucket where we deploy our web application
#####################################################################
## see https://stackoverflow.com/questions/16267339/s3-static-website-hosting-route-all-paths-to-index-html
resource "aws_s3_bucket" "webapp" {
  bucket = "${var.bucket_name_webapp}"
  region = "${var.aws_region}"
  policy = <<EOF
{
  "Id": "bucket_policy_site",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "bucket_policy_site_main",
      "Action": [
        "s3:GetObject"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:s3:::${var.bucket_name_webapp}/*",
      "Principal": "*"
    }
  ]
}
EOF
  website {
    index_document = "index.html"
    error_document = "404.html"
    routing_rules = <<EOF
[{
    "Condition": {
        "HttpErrorCodeReturnedEquals": "404"
    },
    "Redirect": {
        "HostName": "yummy.timafe.net",
        "ReplaceKeyPrefixWith": "#!/"
    }
}]
EOF
  }
  force_destroy = true
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

## create sync script to upload app distribution into S3 bucket
resource "local_file" "deployment" {
  content     = "#!/usr/bin/env bash\nyarn build\naws s3 sync ./dist/ s3://${var.bucket_name_webapp} --region ${var.aws_region} --delete --size-only --profile ${var.aws_profile}\n"
  filename = "${path.module}/deploy.sh"
}

## register bucket as alias in route53, get zone first for id
data "aws_route53_zone" "selected" {
  name         = "${var.route53_zone}"
  private_zone = false
}

resource "aws_route53_record" "domain" {
  zone_id = "${data.aws_route53_zone.selected.zone_id}"
  name    = "${var.route53_subdomain}.${data.aws_route53_zone.selected.name}"
  type = "A"
  alias {
    name = "s3-website.${var.aws_region}.amazonaws.com."
    zone_id = "${var.route53_alias_zone_id}"
    evaluate_target_health = false
  }
}


#####################################################################
## create dynamodb table(s) using our app id as prefix
#####################################################################
## main table for dishes
resource "aws_dynamodb_table" "dish" {
  name           = "${var.table_name_prefix}-dish"
  read_capacity  = "${var.ddb_default_rcu}"
  write_capacity = "${var.ddb_default_wcu}"
  # (Required, Forces new resource) The attribute to use as the hash (partition) key. Must also be defined as an attribute
  hash_key       = "id"
  attribute {
    name = "id"
    type = "S"
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

## main table for places
resource "aws_dynamodb_table" "place" {
  name           = "${var.table_name_prefix}-place"
  read_capacity  = "${var.ddb_default_rcu}"
  write_capacity = "${var.ddb_default_wcu}"
  # (Required, Forces new resource) The attribute to use as the hash (partition) key. Must also be defined as an attribute
  hash_key       = "id"
  attribute {
    name = "id"
    type = "S"
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

## for login / logout and other audi events
resource "aws_dynamodb_table" "logintrail" {
  name           = "${var.table_name_prefix}-logintrail"
  read_capacity  = "${var.ddb_default_rcu}"
  write_capacity = "${var.ddb_default_wcu}"
  # (Required, Forces new resource) The attribute to use as the hash (partition) key. Must also be defined as an attribute
  hash_key       = "userId"
  # (Optional, Forces new resource) The attribute to use as the range (sort) key. Must also be defined as an attribute
  range_key      = "activityDate"
  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "activityDate"
    type = "S"
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}


#####################################################################
# Configure IAM and Cognito User pools
#####################################################################
## Create a cognito user pool see https://www.terraform.io/docs/providers/aws/r/cognito_user_pool.html
resource "aws_cognito_user_pool" "main" {
  name = "${var.app_id}"
  auto_verified_attributes = ["email"]
  admin_create_user_config {
    ## set to false so user can register themselves, we still need more authorization to allow this :-)
    allow_admin_create_user_only = true
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

# Create a user pool client for the user pool see https://www.terraform.io/docs/providers/aws/r/cognito_user_pool_client.html
resource "aws_cognito_user_pool_client" "main" {
  name = "webapp"
  generate_secret = false
  explicit_auth_flows = ["USER_PASSWORD_AUTH"]
  user_pool_id = "${aws_cognito_user_pool.main.id}"
}

# create an id pool and attach the user pool and user pool client id to the identity pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name = "${var.app_id}"
  allow_unauthenticated_identities = true
  cognito_identity_providers {
    client_id               = "${aws_cognito_user_pool_client.main.id}"
    provider_name           = "cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    server_side_token_check = false
  }
}

# create IAM UNAuthenticated role
resource "aws_iam_role" "unauthenticated" {
  name = "${var.role_name_prefix}-unauthenticated"
  description = "Managed by Terraform"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "${aws_cognito_identity_pool.main.id}"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated"
        }
      }
    }
  ]
}
EOF
}

# create policy for IAM UNAuthenticated role
#$aws_cmd iam put-role-policy --role-name $ROLE_NAME_PREFIX-unauthenticated --policy-name CognitoPolicy --policy-document file://unauthrole.json
resource "aws_iam_role_policy" "unauthenticated" {
  name = "CognitoPolicy"
  role = "${aws_iam_role.unauthenticated.id}"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "mobileanalytics:PutEvents",
        "cognito-sync:*"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
EOF
}

# Create IAM AUTHenticated role
resource "aws_iam_role" "authenticated" {
  name = "${var.role_name_prefix}-authenticated"
  description = "Managed by Terraform"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "${aws_cognito_identity_pool.main.id}"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
EOF
}


# create policy for IAM Authenticated role, Grant access to dynamo db table(s) and S3
resource "aws_iam_role_policy" "authenticated" {
  name = "CognitoPolicy"
  role = "${aws_iam_role.authenticated.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "mobileanalytics:PutEvents",
        "cognito-sync:*",
        "cognito-identity:*"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:Query",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "${aws_dynamodb_table.logintrail.arn}"
      ],
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": [
            "$${cognito-identity.amazonaws.com:sub}"
          ]
        }
      }
    },
   {
      "Effect": "Allow",
      "Action": [
        "mobileanalytics:PutEvents",
        "cognito-sync:*",
        "cognito-identity:*"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "${aws_dynamodb_table.dish.arn}",
        "${aws_dynamodb_table.place.arn}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "${aws_s3_bucket.docs.arn}/places/*",
        "${aws_s3_bucket.docs.arn}/dishes/*"
      ]
    }
  ]
}
EOF
}

## Update cognito identity pool with the roles
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = "${aws_cognito_identity_pool.main.id}"
  roles {
    "authenticated" = "${aws_iam_role.authenticated.arn}"
    "unauthenticated" = "${aws_iam_role.unauthenticated.arn}"
  }
}

# Create IAM EDITOR role
#resource "aws_iam_role" "editor" {
#  name = "${var.role_name_prefix}-editor"
#  description = "Managed by Terraform"
#}

#####################################################################
## Create S3 upload bucket for dish and places docs
## https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_s3_cognito-bucket.html
## We use ${var.bucket_name_webapp} for CORS since that's the domain
## name under which the deployed application will be reachable
#####################################################################
resource "aws_s3_bucket" "docs" {
  bucket = "${var.bucket_name_prefix}-docs"
  region = "${var.aws_region}"
  force_destroy = false
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT","POST","GET","DELETE"]
    allowed_origins = [
      "http://localhost:3333",
      "http://${var.bucket_name_webapp}",
      "https://${var.bucket_name_webapp}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

#####################################################################
## Create SNS Topic for important events, subscribe admin mail
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
  template = "${file("${path.module}/src/environments/environment.ts.tmpl")}"
  vars {
    identityPoolId = "${aws_cognito_identity_pool.main.id}"
    ddbTableName = "${aws_dynamodb_table.logintrail.name}"
    region = "${var.aws_region}"
    bucketRegion = "${var.aws_region}"
    bucketNamePrefix = "${var.bucket_name_prefix}"
    ddbTableNamePrefix = "${var.table_name_prefix}"
    userPoolId = "${aws_cognito_user_pool.main.id}"
    clientId = "${aws_cognito_user_pool_client.main.id}"
    mapboxAccessToken = "${var.mapbox_access_token}"
  }
}

resource "local_file" "environment" {
  content     = "${data.template_file.environment.rendered}"
  filename = "${path.module}/src/environments/environment.ts"
}

resource "local_file" "environment_prod" {
  content     = "${data.template_file.environment.rendered}"
  filename = "${path.module}/src/environments/environment.prod.ts"
}
