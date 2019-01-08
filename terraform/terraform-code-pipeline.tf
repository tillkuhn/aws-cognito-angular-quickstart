
## todo
## To allow AWS CodeBuild to retrieve custom environment variables stored in Amazon EC2 Systems Manager Parameter Store,
## you must add the ssm:GetParameters action to your AWS CodeBuild service role. For more information, see Create an AWS CodeBuild Service Role.

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

resource "aws_ssm_parameter" "aws_cognito_identity_pool_id" {
  name  = "/${var.app_id}/${var.env}/AWS_COGNITO_IDENTITY_POOL_ID"
  type  = "String"
  description = "The ID of the cognito Identy Pool managed by Terraform"
  value = "${aws_cognito_identity_pool.main.id}"
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_ssm_parameter" "region" {
  name  = "${var.app_id}-region"
  type  = "String"
  value = "${var.aws_region}"
}

resource "aws_ssm_parameter" "bucket_region" {
  name  = "${var.app_id}-bucket_region"
  type  = "String"
  value = "${var.aws_region}"
}

resource "aws_ssm_parameter" "ddb_table_name_prefix" {
  name  = "${var.app_id}-ddb_table_name_prefix"
  type  = "String"
  value = "${var.table_name_prefix}"
}

resource "aws_ssm_parameter" "bucket_name_prefix" {
  name  = "${var.app_id}-bucket_name_prefix"
  type  = "String"
  value = "${var.bucket_name_prefix}"
}

resource "aws_ssm_parameter" "user_pool_id" {
  name  = "${var.app_id}-user_pool_id"
  type  = "String"
  value = "${aws_cognito_user_pool.main.id}"
}

resource "aws_ssm_parameter" "client_id" {
  name  = "${var.app_id}-client_id"
  type  = "String"
  value = "${aws_cognito_user_pool_client.main.id}"
}


resource "aws_ssm_parameter" "mapbox_access_token" {
  name  = "${var.app_id}-mapbox_access_token"
  type  = "String"
  value = "${var.mapbox_access_token}"
}

resource "aws_ssm_parameter" "api_gateway_invoke_url" {
  name  = "${var.app_id}-api_gateway_invoke_url"
  type  = "String"
  value = "${aws_api_gateway_deployment.main.invoke_url}"
}

