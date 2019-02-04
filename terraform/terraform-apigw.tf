variable "api_gateway_stage_name" { default = "v1" }
variable "deployment_id" { default = "48" } ### increment to force deployment

#####################################################################
## Create API Gateway + Resources for future API Calls
## https://sanderknape.com/2017/10/creating-a-serverless-api-using-aws-api-gateway-and-dynamodb/
## Using Amazon API Gateway as a proxy for DynamoDB: with integration reponse Mappings !!
## https://aws.amazon.com/blogs/compute/using-amazon-api-gateway-as-a-proxy-for-dynamodb/
##
## Petstore: https://aws.amazon.com/blogs/aws/api-gateway-update-new-features-simplify-api-development/
## Sample Code: https://github.com/strofimovsky/aws-sample-intergration-dynamodb-apigw-lambda-s3/blob/master/example.tf
##
## How to call?
## https://docs.aws.amazon.com/de_de/apigateway/latest/developerguide/how-to-call-api.html
## https://{restapi_id}.execute-api.{region}.amazonaws.com/{stage_name}/
## Cognito?
## https://medium.freecodecamp.org/how-to-secure-microservices-on-aws-with-cognito-api-gateway-and-lambda-4bfaa7a6583c
## https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-enable-cognito-user-pool.html
#####################################################################

#####################################################################
# Create API Gateway
#####################################################################
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.app_id}-api"
  description = "Managed by Terraform"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

#####################################################################
# Create IAM role for API Gateway
#####################################################################
resource "aws_iam_role" "api-gateway" {
  name = "${var.role_name_prefix}-api-gateway"
  description = "Managed by Terraform"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

#####################################################################
# Create POLICY for API Gateway to access DDB table(s)
#####################################################################
resource "aws_iam_role_policy" "api-gateway" {
  name = "DDBPolicy"
  role = "${aws_iam_role.api-gateway.id}"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "${aws_dynamodb_table.region.arn}"
      ]
    }
  ]
}
EOF
}

#####################################################################
## Create Authorizer to secure requests
## Example for usage with cognito: https://www.terraform.io/docs/providers/aws/r/api_gateway_method.html
#####################################################################
resource "aws_api_gateway_authorizer" "main" {
  depends_on = ["aws_cognito_user_pool.main"]
  name          = "${var.app_id}-api-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  provider_arns = ["${aws_cognito_user_pool.main.arn}"]
}

#####################################################################
# Create resoucre "regions" (/regions)
#####################################################################
resource "aws_api_gateway_resource" "regions" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  parent_id = "${aws_api_gateway_rest_api.main.root_resource_id}"
  path_part = "regions"
}

#####################################################################
## Region Method: PUT a region
#####################################################################
resource "aws_api_gateway_method" "put-region" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = "${aws_api_gateway_authorizer.main.id}"
}

## Region Method: PUT a region - Request Integration
resource "aws_api_gateway_integration" "put-region-integration" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "${aws_api_gateway_method.put-region.http_method}"
  type = "AWS"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:dynamodb:action/PutItem"
  credentials = "${aws_iam_role.api-gateway.arn}"
  request_templates {
    "application/json" = <<EOF
{
    "TableName": "${aws_dynamodb_table.region.name}",
    "Item": {
        "code": {
            "S": "$input.path('$.code')"
        },
        #if($input.path('$.parentCode') && $input.path('$.parentCode').length() > 0)
        "parentCode": {
            "S": "$input.path('$.parentCode')"
        },
        #end
        #if($input.path('$.season') && $input.path('$.season').size() > 0)
        "season": {
            "L": [
            #foreach($elem in $input.path('$.season'))
            {"N": "$elem" }#if($foreach.hasNext),#end
            #end
        ]},
        #end
        #if($input.path('$.coordinates') && $input.path('$.coordinates').size() > 0)
        "coordinates": {
            "L": [
            #foreach($elem in $input.path('$.coordinates'))
            {"N": "$elem" }#if($foreach.hasNext),#end
            #end
        ]},
        #end
        "name": {
            "S": "$input.path('$.name')"
        }
    }
}
EOF
  }
}

## Region Method: PUT a region - Response Integration
resource "aws_api_gateway_method_response" "put-region-response-200" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "${aws_api_gateway_method.put-region.http_method}"
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "put-region-response" {
  depends_on = ["aws_api_gateway_integration.put-region-integration"]
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "${aws_api_gateway_method.put-region.http_method}"
  status_code = "${aws_api_gateway_method_response.put-region-response-200.status_code}"
  response_parameters {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}
#####################################################################
## Region Method: GET All regions
#####################################################################
resource "aws_api_gateway_method" "get-region" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "GET"
  #authorization = "NONE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = "${aws_api_gateway_authorizer.main.id}"
}

## Region Method: GET All regions - integration
resource "aws_api_gateway_integration" "get-region-integration" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "${aws_api_gateway_method.get-region.http_method}"
  type = "AWS"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:dynamodb:action/Scan"
  credentials = "${aws_iam_role.api-gateway.arn}"
  request_templates {
    "application/json" = <<EOF
{
    "TableName": "${aws_dynamodb_table.region.name}"
}
EOF
  }
}

## Region Method: GET All regions - method response 200
resource "aws_api_gateway_method_response" "get-region-response-200" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "${aws_api_gateway_method.get-region.http_method}"
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

## Mapping reference: https://docs.aws.amazon.com/de_de/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
## conditional? https://stackoverflow.com/questions/32511087/aws-api-gateway-how-do-i-make-querystring-parameters-optional-in-mapping-templa

## Region Method: GET All regions - method response integration
resource "aws_api_gateway_integration_response" "get-region-response" {
  depends_on = ["aws_api_gateway_integration.get-region-integration"]
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method  = "${aws_api_gateway_method.get-region.http_method}"
  status_code = "${aws_api_gateway_method_response.get-region-response-200.status_code}"
  response_parameters {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
  response_templates {
    "application/json" = <<EOF
#set($inputRoot = $input.path('$'))
[
        #foreach($elem in $inputRoot.Items) {
            "code": "$elem.code.S",
            #if($elem.parentCode && $elem.parentCode.S.length() > 0)
            "parentCode": "$elem.parentCode.S",
            #end
            #if($elem.season && $elem.season.L.size() > 0)
            "season": [
            #foreach($season in $elem.season.L)
             $season.N
             #if($foreach.hasNext),#end
            #end
            ],
            #end
            #if($elem.coordinates && $elem.coordinates.L.size() > 0)
            "coordinates": [
            #foreach($coordinate in $elem.coordinates.L)
             $coordinate.N
             #if($foreach.hasNext),#end
            #end
            ],
            #end
            "name": "$elem.name.S"
        }#if($foreach.hasNext),#end
	#end
]
EOF
  }
}

#####################################################################
## Region Method: DELETE REGION
#####################################################################
resource "aws_api_gateway_method" "delete-region" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = "${aws_api_gateway_authorizer.main.id}"
}


## Method: DELETE region - integration
resource "aws_api_gateway_integration" "delete-region-integration" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "${aws_api_gateway_method.delete-region.http_method}"
  type = "AWS"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.aws_region}:dynamodb:action/DeleteItem"
  credentials = "${aws_iam_role.api-gateway.arn}"
  request_templates {
    "application/json" = <<EOF
{
    "TableName": "${aws_dynamodb_table.region.name}",
    "Key": {
        "code": {
            "S": "$input.path('$.code')"
        }
    }
}
EOF
  }
}

## Region Method: DELETE regions - method response 200
resource "aws_api_gateway_method_response" "delete-region-response-200" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "${aws_api_gateway_method.delete-region.http_method}"
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

#########################################################
## Apply CORS for Region using external module otherwise
## this would be even more complicated
##########################################
module "cors" {
  source = "github.com/squidfunk/terraform-aws-api-gateway-enable-cors"
  version = "0.2.0"
  api_id          = "${aws_api_gateway_rest_api.main.id}"
  api_resource_id = "${aws_api_gateway_resource.regions.id}"
  # allowed_headers = ["Content-Type","X-Amz-Date","Authorization","X-Api-Key","X-Amz-Security-Token"]
  allow_headers = ["Content-Type","Authorization"]
  allow_methods = ["GET","OPTIONS","PUT","DELETE"]
  allow_origin = "*"
  allow_max_age = 7200
}

#####################################################################
# Create resoucre "docs" (/docs)
#####################################################################
resource "aws_api_gateway_resource" "docs" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  parent_id = "${aws_api_gateway_rest_api.main.root_resource_id}"
  path_part = "docs"
}

#####################################################################
## Region Method: PUT a region
#####################################################################
resource "aws_api_gateway_method" "put-doc" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.docs.id}"
  http_method = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = "${aws_api_gateway_authorizer.main.id}"
}

## Region Method: PUT a region integration to  putdoc lambda
resource "aws_api_gateway_integration" "put-doc_lambda_proxy" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_method.put-doc.resource_id}"
  http_method = "${aws_api_gateway_method.put-doc.http_method}"
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${aws_lambda_function.lambda_putdoc.invoke_arn}"
  depends_on = ["aws_lambda_function.lambda_putdoc"]
}

############################
## Deploy the Gateway Stage
## it seems you have to update the variable to actually force a deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = ["aws_api_gateway_resource.regions"]
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  stage_name  = "${var.api_gateway_stage_name}"
  variables = {
    "answer" = "${var.deployment_id}"
  }
}

## e.g.  https://xxxxx.execute-api.eu-central-1.amazonaws.com/v2
output "api-invoke-url" {
  value = "${aws_api_gateway_deployment.main.invoke_url}"
}
