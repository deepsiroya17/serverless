# GitHub Release Downloader and Storage in Google Cloud Storage

This Node.js application is designed to download a GitHub release and store it in Google Cloud Storage. It's integrated with AWS DynamoDB for tracking the process and sends emails using Mailgun for success and failure notifications.

## Prerequisites

- Node.js installed
- AWS account with DynamoDB set up
- Google Cloud Storage account and a bucket configured
- Mailgun account with API key and domain details

## Setup

1. Clone this repository.
2. Install dependencies using `npm install`.
3. Set up environment variables:
    - `GCP_SERVICE_ACCOUNT_KEY`: Base64 encoded JSON key for Google Cloud Service Account.
    - `MAILGUN_API_KEY`: Your Mailgun API key.
    - `MAILGUN_DOMAIN`: Your Mailgun domain.
    - `GOOGLE_CLOUD_BUCKET`: Name of the Google Cloud Storage bucket.
    - `DYNAMODB_TABLE_NAME`: Name of the DynamoDB table.

## Usage

- Ensure AWS and Google Cloud credentials are properly set up.
- Deploy the AWS Lambda function with the provided handler.

## Functionality

1. Receives an event trigger containing SNS message with a URL and email.
2. Downloads the GitHub release from the provided URL.
3. Saves the release in the specified Google Cloud Storage bucket.
4. Generates a signed URL for the stored file.
5. Sends success or failure emails based on the process outcome.
6. Records process details in DynamoDB.

## Deployment

Deploy this as an AWS Lambda function or run it on a serverless environment. Make sure to configure the required permissions and triggers for the Lambda function.

## Configuration

Ensure all environment variables are correctly set before deployment or execution.

## Contributions

Contributions are welcome! Feel free to fork this repository, make changes, and submit a pull request.

