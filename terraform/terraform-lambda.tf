
data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/../lambda.zip"
  source_dir = "${path.module}/../lambda"
}