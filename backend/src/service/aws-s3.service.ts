import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsS3Service {
  private s3: AWS.S3;

  constructor() {
    const options: AWS.S3.ClientConfiguration = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    };

    // Thêm endpoint nếu được cấu hình
    if (process.env.AWS_S3_ENDPOINT) {
      options.endpoint = process.env.AWS_S3_ENDPOINT;
    }

    this.s3 = new AWS.S3(options);
  }

  async uploadFile(file: Express.Multer.File, bucketName: string): Promise<string> {
    try {
      if (!bucketName) {
        throw new Error('S3 bucket name is not defined');
      }

      const params = {
        Bucket: bucketName,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException('Failed to upload to S3');
    }
  }
}
