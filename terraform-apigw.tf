variable "api_gateway_stage_name" { default = "v1" }

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

# Create API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.app_id}-api"
  description = "Managed by Terraform"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Create IAM role for API Gateway
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

# Create POLICY for API Gateway to access DDB table(s)
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

## Create Authrizer to secure requests
## Example for usage with cognito: https://www.terraform.io/docs/providers/aws/r/api_gateway_method.html
resource "aws_api_gateway_authorizer" "main" {
  depends_on = ["aws_cognito_user_pool.main"]
  name          = "${var.app_id}-api-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  provider_arns = ["${aws_cognito_user_pool.main.arn}"]
}

# Create resouce regions (/regsions)
resource "aws_api_gateway_resource" "regions" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  parent_id = "${aws_api_gateway_rest_api.main.root_resource_id}"
  path_part = "regions"
}

## WELCOME TOP CORS HELL
## Thank You: https://medium.com/@MrPonath/terraform-and-aws-api-gateway-a137ee48a8ac
resource "aws_api_gateway_method" "options_method" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method   = "OPTIONS"
  authorization = "NONE"
}
resource "aws_api_gateway_method_response" "options_200" {
  depends_on = ["aws_api_gateway_method.options_method"]
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method   = "${aws_api_gateway_method.options_method.http_method}"
  status_code   = "200"
  response_models {
    "application/json" = "Empty"
  }
  response_parameters {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}
resource "aws_api_gateway_integration" "options_integration" {
  depends_on = ["aws_api_gateway_method.options_method"]
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method   = "${aws_api_gateway_method.options_method.http_method}"
  type          = "MOCK"
  ## required or you get: Execution failed due to configuration error:
  ## ... statusCode should be an integer which defined in request template
  ## see also https://forums.aws.amazon.com/thread.jspa?threadID=248513
  request_templates {
    "application/json" = <<EOF
{"statusCode": 200}
EOF
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method   = "${aws_api_gateway_method.options_method.http_method}"
  status_code   = "${aws_api_gateway_method_response.options_200.status_code}"
  response_parameters = {
  #  "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,PUT'",
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
  depends_on = ["aws_api_gateway_method_response.options_200"]
}
## END OPTIONS


## Method: PUT a region
resource "aws_api_gateway_method" "put-region" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = "${aws_api_gateway_authorizer.main.id}"

}

## Method: PUT a region Request Integration
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
        "name": {
            "S": "$input.path('$.name')"
        }
    }
}
EOF
  }
}

##############
## Method: PUT a region Response Integration
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

## Method: GET All regions
resource "aws_api_gateway_method" "get-region" {
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  resource_id = "${aws_api_gateway_resource.regions.id}"
  http_method = "GET"
  #authorization = "NONE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = "${aws_api_gateway_authorizer.main.id}"
}

###
## Method: GET All regions response integration
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

###########
## Method: GET All regions 200 response
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
            "name": "$elem.name.S"
        }#if($foreach.hasNext),#end
	#end
]
EOF
  }
}


############################
## Deploy the Gateway Stage
resource "aws_api_gateway_deployment" "main" {
  depends_on = ["aws_api_gateway_resource.regions"]
  rest_api_id = "${aws_api_gateway_rest_api.main.id}"
  stage_name  = "${var.api_gateway_stage_name}"
  variables = {
    "answer" = "42"
  }
}

## e.g.  https://xxxxx.execute-api.eu-central-1.amazonaws.com/v2
output "api-invoke-url" {
  value = "${aws_api_gateway_deployment.main.invoke_url}"
}
