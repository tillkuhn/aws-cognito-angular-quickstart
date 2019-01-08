
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
