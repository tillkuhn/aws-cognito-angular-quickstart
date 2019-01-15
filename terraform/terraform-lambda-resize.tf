variable "function_name" { default = "lambda-resize" }

data "archive_file" "lambda_archive" {
  type        = "zip"
  source_dir = "${path.module}/../lambda"
  output_path = "${path.module}/../${var.function_name}.zip"
}

resource "aws_iam_role" "iam_lambda_resize" {
  name = "${var.role_name_prefix}-${var.function_name}"

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
  role = "${aws_iam_role.iam_lambda_resize.name}"
  policy_arn = "${aws_iam_policy.lambda_logging_s3.arn}"
}

resource "aws_lambda_function" "lambda_resize" {
  filename         = "${data.archive_file.lambda_archive.output_path}"
  function_name    = "${var.function_name}"
  role             = "${aws_iam_role.iam_lambda_resize.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("${data.archive_file.lambda_archive.output_path}"))}"
  runtime          = "nodejs8.10"
  depends_on = ["data.archive_file.lambda_archive"]
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

## todo https://www.terraform.io/docs/providers/aws/r/s3_bucket_notification.html
## for aws_s3_bucket.docs.arn
resource "aws_lambda_permission" "allow_bucket_notify_lambda" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.lambda_resize.arn}"
  principal     = "s3.amazonaws.com"
  source_arn    = "${aws_s3_bucket.docs.arn}"
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = "${aws_s3_bucket.docs.id}"
  lambda_function {
    lambda_function_arn = "${aws_lambda_function.lambda_resize.arn}"
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "places/"
    filter_suffix       = ".jpg"
  }
}

output "lambda_archive" {
  value = "${data.archive_file.lambda_archive.output_path}"
}
