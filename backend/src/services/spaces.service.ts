import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);
  private readonly s3: S3;
  private readonly bucketName: string;
  private readonly cdnEndpoint: string;

  constructor(private configService: ConfigService) {
    const spacesConfig = this.configService.get('spaces');
    
    this.s3 = new S3({
      endpoint: `https://${spacesConfig.endpoint}`,
      accessKeyId: spacesConfig.accessKeyId,
      secretAccessKey: spacesConfig.secretAccessKey,
      region: spacesConfig.region,
      s3ForcePathStyle: spacesConfig.forcePathStyle,
      signatureVersion: spacesConfig.signatureVersion,
    });

    this.bucketName = spacesConfig.bucket;
    this.cdnEndpoint = spacesConfig.publicUrl;
  }

  async uploadFile(
    file: Buffer | Uint8Array | string,
    key: string,
    contentType: string,
    isPublic: boolean = true
  ): Promise<ManagedUpload.SendData> {
    const uploadParams: S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : 'private',
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    try {
      const result = await this.s3.upload(uploadParams).promise();
      this.logger.log(`File uploaded successfully: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${key}`, error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw error;
    }
  }

  async getFileUrl(key: string): Promise<string> {
    return `${this.cdnEndpoint}/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${key}`, error);
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  getFileTypeFolder(fileType: number): string {
    switch (fileType) {
      case 1: // Audio
        return 'audio';
      case 2: // Image
        return 'images';
      case 3: // Document
        return 'documents';
      default:
        return 'misc';
    }
  }

  generateFileKey(fileName: string, fileType: number, questionId?: string): string {
    const folder = this.getFileTypeFolder(fileType);
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    
    if (questionId) {
      return `${folder}/${questionId}/${timestamp}_${baseName}.${extension}`;
    }
    
    return `${folder}/${timestamp}_${baseName}.${extension}`;
  }
}
