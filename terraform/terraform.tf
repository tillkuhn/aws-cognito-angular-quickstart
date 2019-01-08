################################################################
## declare vars, see terraform.tfvars for actual settings
################################################################
variable "aws_profile" {}
variable "aws_region" { default = "eu-central-1" }
variable "app_name" { default = "Yummy Dishes + Places" }
variable "app_id" { default = "yummy" }
variable "env"{ default = "prod" }
variable "role_name_prefix" { default = "yummy" }
variable "table_name_prefix" { default = "yummy" }
variable "bucket_name_prefix" { default = "yummy" }
variable "ddb_default_wcu" { default = "1" }
variable "ddb_default_rcu" { default = "1" }
variable "allow_admin_create_user_only" { default = true }
variable "mapbox_access_token" {}

#####################################################################
## configure AWS Provide, you can use key secret here,
## but we prefer a profile in ~/.aws/credentials
#####################################################################
provider "aws" {
  region     = "${var.aws_region}"
  profile    = "${var.aws_profile}"
}

#####################################################################
## Create SNS Topic for important events, subscribe admin mail
## email event subscription is not supported so we skip subscriptions
#####################################################################
resource "aws_sns_topic" "events" {
  name = "${var.app_id}-events"
}

