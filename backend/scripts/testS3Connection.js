const AWS = require('aws-sdk');
require('dotenv').config({ path: '../.env' });

console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const bucketName = process.env.S3_BUCKET_NAME;

s3.listObjectsV2({ Bucket: bucketName, MaxKeys: 5 }, (err, data) => {
  if (err) {
    console.error('❌ S3 connection failed:', err.message);
  } else {
    console.log('✅ S3 connection successful!');
    console.log('Bucket contents (first 5 objects):', data.Contents);
  }
}); 