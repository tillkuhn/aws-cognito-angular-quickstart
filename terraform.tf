## see terraform.tfvars for actual settings
variable "app_id" {}
variable "app_name" {}
variable "aws_profile" {}
variable "identity_pool_name" {}
variable "user_pool_name" {}
variable "bucket_name" {}
variable "role_name_prefix" {}
variable "env" {
  default = "dev"
}
variable "aws_region" {
  default = "eu-central-1"
}
variable "route53_subdomain" {}
variable "route53_zone" {}
variable "route53_alias_zone_id" {}

## you can also use key and secret here, we prefer a profile in ~/.aws/credentials
provider "aws" {
  region     = "${var.aws_region}"
  profile    = "${var.aws_profile}"
}

## this is the target bucket where we deploy our web application
resource "aws_s3_bucket" "webapp" {
  bucket = "${var.bucket_name}"
  region = "${var.aws_region}"
  #acl    = "private"
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
      "Resource": "arn:aws:s3:::${var.bucket_name}/*",
      "Principal": "*"
    }
  ]
}
EOF
  website {
    index_document = "index.html"
    error_document = "404.html"
  }
  force_destroy = true
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
  }
}

## create sync script to upload app distribution into se3 bucked
resource "local_file" "deployment" {
  content     = "#!/usr/bin/env bash\nnpm run build\naws s3 sync ./dist/ s3://${var.bucket_name} --region ${var.aws_region} --delete --profile ${var.aws_profile}\n"
  filename = "${path.module}/deploy.sh"
}

## register bucket as alias in route53
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

## create dynamodb table(s) using our app id as prefix
resource "aws_dynamodb_table" "logintrail" {
  name           = "${var.app_id}-logintrail"
  read_capacity  = 3
  write_capacity = 1
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
  }
}
resource "aws_dynamodb_table" "dish" {
  name           = "${var.app_id}-dish"
  read_capacity  = 3
  write_capacity = 1
  # (Required, Forces new resource) The attribute to use as the hash (partition) key. Must also be defined as an attribute
  hash_key       = "id"
  # (Optional, Forces new resource) The attribute to use as the range (sort) key. Must also be defined as an attribute
  range_key      = "createdAt"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "createdAt"
    type = "S"
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
  }
}


## Create a cognito user pool see https://www.terraform.io/docs/providers/aws/r/cognito_user_pool.html
resource "aws_cognito_user_pool" "main" {
  name = "${var.user_pool_name}"
  auto_verified_attributes = ["email"]
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
  }
}

# Create a user pool client for the user pool see https://www.terraform.io/docs/providers/aws/r/cognito_user_pool_client.html
#$aws_cmd cognito-idp create-user-pool-client --user-pool-id $USER_POOL_ID --no-generate-secret --client-name webapp --region $REGION > /tmp/$POOL_NAME-create-user-pool-client
resource "aws_cognito_user_pool_client" "main" {
  name = "webapp"
  generate_secret = false
  explicit_auth_flows = ["USER_PASSWORD_AUTH"]
  user_pool_id = "${aws_cognito_user_pool.main.id}"
}

# create an id pool and attach the user pool and user pool client id to the identity pool
#$aws_cmd cognito-identity update-identity-pool --allow-unauthenticated-identities --identity-pool-id $IDENTITY_POOL_ID --identity-pool-name $IDENTITY_POOL_NAME \
#--cognito-identity-providers ProviderName=cognito-idp.$REGION.amazonaws.com/$USER_POOL_ID,ClientId=$USER_POOL_CLIENT_ID --region $REGION \
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name = "${var.identity_pool_name}"
  allow_unauthenticated_identities = true
  cognito_identity_providers {
    client_id               = "${aws_cognito_user_pool_client.main.id}"
    provider_name           = "cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    server_side_token_check = false
  }
}

# created unauthenticated role
#  $aws_cmd iam create-role --role-name $ROLE_NAME_PREFIX-unauthenticated --assume-role-policy-document file:///tmp/unauthrole-trust-policy.json > /tmp/iamUnauthRole
resource "aws_iam_role" "unauthenticated" {
  name = "${var.role_name_prefix}-unauthenticated"
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

# create policy for unauth role
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


# Create an IAM role for authenticated users
#$aws_cmd iam create-role --role-name $ROLE_NAME_PREFIX-authenticated --assume-role-policy-document file:///tmp/authrole-trust-policy.json > /tmp/iamAuthRole
resource "aws_iam_role" "authenticated" {
  name = "${var.role_name_prefix}-authenticated"

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

# Create an IAM role for authenticated users and grant access to dynamo db table(s)
# $aws_cmd iam put-role-policy --role-name $ROLE_NAME_PREFIX-authenticated --policy-name CognitoPolicy --policy-document file:///tmp/authrole.json
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
        "${aws_dynamodb_table.dish.arn}"
      ]
    }
  ]
}
EOF
}

## Update cognito identity pool with the roles
# $aws_cmd cognito-identity set-identity-pool-roles --identity-pool-id $IDENTITY_POOL_ID --roles authenticated=$AUTH_ROLE_ARN,unauthenticated=$UNAUTH_ROLE_ARN --region $REGION
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = "${aws_cognito_identity_pool.main.id}"
  roles {
    "authenticated" = "${aws_iam_role.authenticated.arn}"
    "unauthenticated" = "${aws_iam_role.unauthenticated.arn}"
  }
}

## update environment.ts template with actual IDs used by the application
data "template_file" "environment" {
  template = "${file("${path.module}/src/environments/environment.ts.tmpl")}"
  vars {
    identityPoolId = "${aws_cognito_identity_pool.main.id}"
    ddbTableName = "${aws_dynamodb_table.logintrail.name}"
    region = "${var.aws_region}"
    bucketRegion = "${var.aws_region}"
    userPoolId = "${aws_cognito_user_pool.main.id}"
    clientId = "${aws_cognito_user_pool_client.main.id}"
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


## dump output
output "generated_ids" {
  value = "${data.template_file.environment.rendered}"
}
