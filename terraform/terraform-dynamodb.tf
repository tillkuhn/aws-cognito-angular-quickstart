#####################################################################
## create dynamodb table(s) using our app id as prefix
#####################################################################
## main table for dishes
resource "aws_dynamodb_table" "dish" {
  name           = "${var.table_name_prefix}-dish"
  read_capacity  = "${var.ddb_default_rcu}"
  write_capacity = "${var.ddb_default_wcu}"
  # (Required, Forces new resource) The attribute to use as the hash (partition) key. Must also be defined as an attribute
  hash_key       = "id"
  attribute {
    name = "id"
    type = "S"
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

## main table for places
resource "aws_dynamodb_table" "place" {
  name           = "${var.table_name_prefix}-place"
  read_capacity  = "${var.ddb_default_rcu}"
  write_capacity = "${var.ddb_default_wcu}"
  # (Required, Forces new resource) The attribute to use as the hash (partition) key. Must also be defined as an attribute
  hash_key       = "id"
  attribute {
    name = "id"
    type = "S"
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

## main table for regions
resource "aws_dynamodb_table" "region" {
  name           = "${var.table_name_prefix}-region"
  read_capacity  = "${var.ddb_default_rcu}"
  write_capacity = "${var.ddb_default_wcu}"
  # (Required, Forces new resource) The attribute to use as the hash (partition) key. Must also be defined as an attribute
  hash_key       = "code"
  attribute {
    name = "code"
    type = "S"
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

## for login / logout and other audi events
resource "aws_dynamodb_table" "logintrail" {
  name           = "${var.table_name_prefix}-logintrail"
  read_capacity  = "${var.ddb_default_rcu}"
  write_capacity = "${var.ddb_default_wcu}"
  # (Required, Forces new resource) The attribute to use as the hash (partition) key. Must also be defined as an attribute
  hash_key       = "userId"
  # (Optional, Forces new resource) The attribute to use as the range (sort) key. Must also be defined as an attribute
  range_key      = "activityDate"
  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "activityDate"
    type = "S"
  }
  tags {
    Name = "${var.app_name}"
    Environment = "${var.env}"
    ManagedBy = "Terraform"
  }
}

