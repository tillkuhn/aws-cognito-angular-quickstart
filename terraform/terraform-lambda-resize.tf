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
resource "aws_iam_policy" "lambda_logging" {
  name = "${var.role_name_prefix}-lambda_logging-policy"
  path = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role = "${aws_iam_role.iam_lambda_resize.name}"
  policy_arn = "${aws_iam_policy.lambda_logging.arn}"
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

  environment {
    variables = {
      bucket = "${aws_s3_bucket.docs.arn}"
    }
  }

  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}


output "lambda_archive" {
  value = "${data.archive_file.lambda_archive.output_path}"
}
