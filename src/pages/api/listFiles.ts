import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3({
  endpoint: process.env.AWS_ENDPOINT,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
    };
    let contents: AWS.S3.ObjectList = []
    let data = await s3.listObjectsV2(params).promise();
    while (data.IsTruncated === true) {
      data = await s3.listObjectsV2({ ...params, ContinuationToken: data.NextContinuationToken }).promise();
      contents = contents.concat(data.Contents || []);
    }
    console.log(contents.length);
    res.status(200).json(contents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching files from S3', details: error });
  }
}
