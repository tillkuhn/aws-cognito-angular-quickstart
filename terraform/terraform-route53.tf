variable "route53_sub_domain" { default = "yummy" }
variable "route53_zone_domain" {}
variable "route53_alias_zone_id" {}

#####################################################################
## register webapp bucket as alias in route53, get zone first for id
#####################################################################
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
  depends_on = ["aws_s3_bucket.webapp"]
}