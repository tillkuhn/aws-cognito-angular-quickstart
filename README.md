Yummy AWS Quickstart
===================================================
[![Build Status](https://travis-ci.org/tillkuhn/yummy-aws.svg?branch=master)](https://travis-ci.org/tillkuhn/yummy-aws)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![dependencies Status](https://david-dm.org/tillkuhn/yummy-aws/status.svg)](https://david-dm.org/tillkuhn/yummy-aws)

## What does this app do?
![QuickStart Angular2 Cognito App](/aws/meta/Cognito-Angular2-QuickStart.png?raw=true)

## Tech Stack
### Required Tools
* [aws cli](http://docs.aws.amazon.com/cli/latest/userguide/installing.html)
* [npm](https://www.npmjs.com/)
* [angular-cli](https://github.com/angular/angular-cli)

### Frameworks
* [AWS JavaScript SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/browser-intro.html)
* [Angular 2](https://angular.io/docs/ts/latest/quickstart.html)
    * [TypeScript](https://www.typescriptlang.org/docs/tutorial.html)
* [Bootstrap](http://getbootstrap.com/)

## AWS Setup
##### Install the required tools (the installation script only runs on Linux and Mac)
* Create an AWS account
* Install [npm](https://www.npmjs.com/)
* [Install or update your aws cli](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) 
* [Install or update your eb cli](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html) 
* [Install angular-cli](https://github.com/angular/angular-cli)
* [Install Terraform](https://www.terraform.io/intro/getting-started/install.html)

## Getting the code and running it locally
_This uses the pre-configured AWS resources hosted by AWS_

```
# Clone it from github
git clone --depth 1 git@github.com:awslabs/aws-cognito-angular2-quickstart.git
```
```
# Install the NPM packages
cd aws-cognito-angular2-quickstart
npm install
```
```
# Run the app in dev mode
npm start
```

## Creating AWS Resources
This sample application can be deployed S3. S3 will host this application as a static site

* [What is S3](http://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html)
* Run terraform to build the underlying infrastructrure

```
terraform init
terraform plan
terraform apply -auto-approve
```


*Caution:* You might incur AWS charges after running the setup script

## After initially running ```terrfaform```, use the below commands to rebuild and redeploy

### _S3:_ Update, Build and Deploy
```
# Build the project and sync the output with the S3 bucket.
./deploy.sh
```
```
# Test your deployed application
curl –I http://[BUCKET_NAME].s3-website-[REGION].amazonaws.com/
```
__*NOTE: You might want to reshuffle some of the "package.json" dependencies and move the ones that belong to devDependencies 
for a leaner deployment bundle. At this point of time, AWS Beanstalk requires all of the dependencies, 
including the devDependencies to be under the dependencies section. But if you're not using Beanstalk then you can
optimize as you wish.*__

## Import Data

* https://docs.aws.amazon.com/cli/latest/reference/dynamodb/put-item.html
* https://docs.aws.amazon.com/de_de/amazondynamodb/latest/developerguide/SampleData.LoadData.html
## Local Testing

This section contains instructions on how to test the application locally (using mocked services instead of the real AWS services).

### LocalStack

To test this application using [LocalStack](https://github.com/localstack/localstack), you can use the `awslocal` CLI (https://github.com/localstack/awscli-local).
```
pip install awscli-local
```
Simply parameterize the `./createResources.sh` installation script with `aws_cmd=awslocal`:
```
cd aws; aws_cmd=awslocal ./createResources.sh
```
Once the code is deployed to the local S3 server, the application is accessible via http://localhost:4572/cognitosample-localapp/index.html (Assuming "localapp" has been chosen as resource name in the previous step)
