#####################################################################
# Configure IAM and Cognito User pools
#####################################################################
## Create COGNITO USER POOL see https://www.terraform.io/docs/providers/aws/r/cognito_user_pool.html
resource "aws_cognito_user_pool" "main" {
  name = "${var.app_id}"
  auto_verified_attributes = ["email"]
  admin_create_user_config {
    ## set to false so user can register themselves, we still need more authorization to allow this :-)
    allow_admin_create_user_only = "${var.allow_admin_create_user_only}"
    unused_account_validity_days = 90
    invite_message_template {
      email_subject = "Your ${var.app_id} temporary password"
      email_message = "Welcome to ${var.app_name}! Your username is {username} and temporary password is {####}."
      sms_message = "Your username is {username} and temporary password is {####}."
    }
  }
  email_verification_subject = "Your ${var.app_id} verification code"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

# Create COGNITO USER POOL CLIENT for the user pool see https://www.terraform.io/docs/providers/aws/r/cognito_user_pool_client.html
resource "aws_cognito_user_pool_client" "main" {
  name = "webapp"
  generate_secret = false
  explicit_auth_flows = ["USER_PASSWORD_AUTH"]
  user_pool_id = "${aws_cognito_user_pool.main.id}"
}

# Create COGNITO IDENTITY pool and attach the user pool and user pool client id to the identity pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name = "${var.app_id}"
  allow_unauthenticated_identities = true
  cognito_identity_providers {
    client_id               = "${aws_cognito_user_pool_client.main.id}"
    provider_name           = "cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    server_side_token_check = false
  }
}

# Create IAM UNAuthenticated role
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

# Create POLICY for IAM UNAuthenticated role
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


# Create POLICY for IAM Authenticated role, Grant access to dynamo db table(s) and S3
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
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "${aws_s3_bucket.docs.arn}/places/*",
        "${aws_s3_bucket.docs.arn}/dishes/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "${aws_s3_bucket.docs.arn}",
        "${aws_s3_bucket.docs.arn}"
      ]
    }
  ]
}
EOF
}

## Update COGNITO IDENTIY POOL with the both roles
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = "${aws_cognito_identity_pool.main.id}"
  roles {
    "authenticated" = "${aws_iam_role.authenticated.arn}"
    "unauthenticated" = "${aws_iam_role.unauthenticated.arn}"
  }
}
