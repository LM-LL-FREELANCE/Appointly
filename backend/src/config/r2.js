import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Upload a file
/*await s3.send(
  new PutObjectCommand({
    Bucket: "my-bucket",
    Key: "myfile.txt",
    Body: "Hello, R2!",
  }),
);
console.log("Uploaded myfile.txt");*/

// Download a file
/*const response = await s3.send(
  new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: "friendly-guy.jpg",
  }),
);

const content = await response.Body.transformToString();
console.log("Downloaded:", content);*/

// List objects
/*const list = await s3.send(
  new ListObjectsV2Command({
    Bucket: "my-bucket",
  }),
);
console.log(
  "Objects:",
  list.Contents.map((obj) => obj.Key),
);*/
