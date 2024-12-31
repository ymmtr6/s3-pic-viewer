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
  const { key } = req.query;

  if (!key || key === 'undefined') {
    return res.status(400).json({ error: 'File key is required' });
  }

  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key as string,
    };
    const data = s3.getObject(params).createReadStream();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', 'inline');
    data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching file from S3' });
  }
}
