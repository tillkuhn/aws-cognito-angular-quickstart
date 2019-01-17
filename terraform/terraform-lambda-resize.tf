variable "function_name_resize" { default = "lambda-resize" }
variable "function_name_putdoc" { default = "lambda-putdoc" }
variable "lambda_runtime" { default = "nodejs8.10" }

data "archive_file" "lambda_archive_resize" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/resize"
  output_path = "${path.module}/../lambda/dist/${var.function_name_resize}.zip"
}

data "archive_file" "lambda_archive_putdoc" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/putdoc"
  output_path = "${path.module}/../lambda/dist/${var.function_name_putdoc}.zip"
}

## allow lambda to assume role
resource "aws_iam_role" "iam_lambda" {
  name = "${var.role_name_prefix}-lambda-role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# See also the following AWS managed policy: AWSLambdaBasicExecutionRole
resource "aws_iam_policy" "lambda_logging_s3" {
  name = "${var.role_name_prefix}-lambda-logging-s3-policy"
  path = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudWatchActions",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
         "logs:CreateLogGroup"
      ],
      "Resource": "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
    },
    {
      "Sid": "AllowS3",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "${aws_s3_bucket.docs.arn}",
        "${aws_s3_bucket.docs.arn}/*"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role = "${aws_iam_role.iam_lambda.name}"
  policy_arn = "${aws_iam_policy.lambda_logging_s3.arn}"
}

resource "aws_lambda_function" "lambda_resize" {
  filename         = "${data.archive_file.lambda_archive_resize.output_path}"
  function_name    = "${var.function_name_resize}"
  role             = "${aws_iam_role.iam_lambda.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("${data.archive_file.lambda_archive_resize.output_path}"))}"
  runtime          = "${var.lambda_runtime}"
  depends_on = ["data.archive_file.lambda_archive_resize"]
  timeout = 10
  reserved_concurrent_executions = 3
  environment {
    variables = {
      THUMBNAIL_BUCKET = "${aws_s3_bucket.docs.bucket}"
      MAX_WIDTH = "150"
      MAX_HEIGHT = "100"
      THUMBNAIL_PREFIX = "thumbs/"
    }
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

resource "aws_lambda_function" "lambda_putdoc" {
  filename         = "${data.archive_file.lambda_archive_putdoc.output_path}"
  function_name    = "${var.function_name_putdoc}"
  role             = "${aws_iam_role.iam_lambda.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("${data.archive_file.lambda_archive_putdoc.output_path}"))}"
  runtime          = "${var.lambda_runtime}"
  depends_on = ["data.archive_file.lambda_archive_putdoc"]
  timeout = 10
  reserved_concurrent_executions = 3
  environment {
    variables = {
      TARGET_BUCKET = "${aws_s3_bucket.docs.bucket}"
    }
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

## https://www.terraform.io/docs/providers/aws/r/lambda_permission.html
resource "aws_lambda_permission" "lambda_apigate_putdoc_permission" {
  statement_id  = "AllowAPIInvoke"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.lambda_putdoc.function_name}"
  principal     = "apigateway.amazonaws.com"
  # The /*/*/* part allows invocation from any stage, method and resource path within API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/${aws_api_gateway_method.put-doc.http_method}/${aws_api_gateway_resource.docs.path_part}"
}

## for aws_s3_bucket.docs.arn
resource "aws_lambda_permission" "allow_bucket_notify_lambda" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.lambda_resize.arn}"
  principal     = "s3.amazonaws.com"
  source_arn    = "${aws_s3_bucket.docs.arn}"
}

## multiple for same function does not seem to work
resource "aws_s3_bucket_notification" "bucket_notification_jpg" {
  bucket = "${aws_s3_bucket.docs.id}"
  lambda_function {
    id = "bucket_notification_jpg"
    lambda_function_arn = "${aws_lambda_function.lambda_resize.arn}"
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "places/"
    filter_suffix       = ".jpg"
  }
}


