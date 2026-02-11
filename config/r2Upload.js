const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const uploadToR2 = async (file) => {
  const fileName = Date.now() + "-" + file.originalname;

  const command = new PutObjectCommand({
    Bucket: "exampaper-pdfs",
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return fileName;
};

module.exports = { upload, uploadToR2 };
