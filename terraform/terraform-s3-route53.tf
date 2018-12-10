variable "route53_sub_domain" { default = "yummy" }
variable "route53_zone_domain" {}
variable "route53_alias_zone_id" {}

#####################################################################
## create and configure S3 bucket where we deploy our web application
#####################################################################
## see https://stackoverflow.com/questions/16267339/s3-static-website-hosting-route-all-paths-to-index-html
resource "aws_s3_bucket" "webapp" {
  bucket = "${var.route53_sub_domain}.${var.route53_zone_domain}"
  region = "${var.aws_region}"
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
      "Resource": "arn:aws:s3:::${var.route53_sub_domain}.${var.route53_zone_domain}/*",
      "Principal": "*"
    }
  ]
}
EOF
  website {
    index_document = "index.html"
    error_document = "404.html"
    routing_rules = <<EOF
[{
    "Condition": {
        "HttpErrorCodeReturnedEquals": "404"
    },
    "Redirect": {
        "HostName": "${var.route53_sub_domain}.${var.route53_zone_domain}",
        "ReplaceKeyPrefixWith": "#!/"
    }
}]
EOF
  }
  force_destroy = true
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}


## register bucket as alias in route53, get zone first for id
data "aws_route53_zone" "selected" {
  name         = "${var.route53_zone_domain}."
  private_zone = false
}

resource "aws_route53_record" "domain" {
  zone_id = "${data.aws_route53_zone.selected.zone_id}"
  name    = "${var.route53_sub_domain}.${data.aws_route53_zone.selected.name}"
  type = "A"
  alias {
    name = "s3-website.${var.aws_region}.amazonaws.com."
    zone_id = "${var.route53_alias_zone_id}"
    evaluate_target_health = false
  }
}

#####################################################################
## Create S3 upload bucket for dish and places docs
## https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_s3_cognito-bucket.html
## We use ${var.route53_sub_domain}.${var.route53_zone_domain} for CORS since that's the domain
## name under which the deployed application will be reachable
#####################################################################
resource "aws_s3_bucket" "docs" {
  bucket = "${var.bucket_name_prefix}-docs"
  region = "${var.aws_region}"
  force_destroy = false
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT","POST","GET","DELETE"]
    allowed_origins = [
      "http://localhost:3333",
      "http://${var.route53_sub_domain}.${var.route53_zone_domain}",
      "https://${var.route53_sub_domain}.${var.route53_zone_domain}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

