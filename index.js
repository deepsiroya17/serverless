const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const axios = require('axios');
const mailgun = require('mailgun-js');

// AWS services initialization
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const decodedKey = Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
const parsedKey = JSON.parse(decodedKey);

// Initialize Google Cloud Storage with service account credentials
const storage = new Storage({ credentials: parsedKey });

// Mailgun configuration
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY, 
  domain: process.env.MAILGUN_DOMAIN, 
});

exports.handler = async (event) => {
  let email, fileName = "Error-PreProcessing";
  try {
    const message = JSON.parse(event.Records[0].Sns.Message);
    const url = message.url;
    email = message.email;

    // Download release from GitHub repository
    const release = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });

    
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
    fileName = `release-${Date.now()}`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    await file.save(release.data);

    const gcpStorageBucket = await signedURL(bucketName, fileName);
 
    await successEmail(email, fileName, gcpStorageBucket);
 
    await dynamoDBTable(email, fileName, 'Email Sent');

    return { statusCode: 200, body: 'Process completed successfully' };
  } catch (error) {
    console.error('Error:', error);
    await failureEmail(email, error.message);
    await dynamoDBTable(email, fileName, 'Failed', error.message);
    return { statusCode: 500, body: 'An error occurred' };
  }
};


async function successEmail(email, fileName, url) {
  const emailData = {
      from: 'Download Status <downloads@dev.deppcloud.me>',
      to: email,
      subject: 'Submission Downloaded',
      text: `Hello,\n\nYour requested GitHub release has been downloaded and stored in Google Cloud Storage. File Name: ${fileName}\nDownload Link: ${url}\n\nRegards,\nCSYE-6225 Team`
  };
  await mg.messages().send(emailData);
}

async function failureEmail(email, error) {
  const mailData = {
      from: 'Error Notification <errors@dev.deppcloud.me>',
      to: email,
      subject: 'Error in Processing Your Submission',
      text: `There was an error processing your submission: ${error.message}`
  };

  try {
      await mg.messages().send(mailData);
  } catch (mailError) {
      console.error('Error sending failure email:', mailError);
  }
};

async function signedURL(bucketName, fileName) {
  const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 2000 * 60 * 60,
  };

  try {
      const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);
      return url;
  } catch (error) {
      console.error('Error generating signed URL: ', error);
      throw error;
  }
}

async function dynamoDBTable(email, fileName, status, errorMessage = null) {
  const item = {
      email: email,
      fileName: fileName,
      status: status,
  };

  if (errorMessage) {
      item.errorMessage = errorMessage;
  }

  await dynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Item: item
  }).promise();
}