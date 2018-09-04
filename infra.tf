provider "aws" {
#  access_key = "ACCESS_KEY_HERE"
#  secret_key = "SECRET_KEY_HERE"
  region     = "eu-central-1"
  profile    = "yummy"
}

resource "aws_s3_bucket" "b" {
  bucket = "timafe-yummy-test"
  acl    = "private"

  tags {
    Name = "Yummy Test Bucket"
    Environment = "dev"
  }
}