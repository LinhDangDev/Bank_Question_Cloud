import { Injectable, Logger } from '@nestjs/common';
import { StorageConfig, getStorageConfig } from '../config/storage.config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
    fileName: string;
    filePath: string;
    publicUrl: string;
    size: number;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly config: StorageConfig;

    constructor() {
        this.config = getStorageConfig();
        this.logger.log(`Storage provider: ${this.config.provider}`);
    }

    async uploadFile(
        buffer: Buffer,
        originalName: string,
        mimeType: string,
        folder?: string
    ): Promise<UploadResult> {
        const fileExtension = path.extname(originalName);
        const fileName = `${randomUUID()}${fileExtension}`;
        const folderPath = folder || 'general';

        switch (this.config.provider) {
            case 'local':
                return this.uploadToLocal(buffer, fileName, folderPath, mimeType);
            case 'aws-s3':
                return this.uploadToS3(buffer, fileName, folderPath, mimeType);
            case 'azure-blob':
                return this.uploadToAzure(buffer, fileName, folderPath, mimeType);
            case 'google-cloud':
                return this.uploadToGoogleCloud(buffer, fileName, folderPath, mimeType);
            case 'do-spaces':
                return this.uploadToDigitalOceanSpaces(buffer, fileName, folderPath, mimeType);
            default:
                throw new Error(`Unsupported storage provider: ${this.config.provider}`);
        }
    }

    private async uploadToLocal(
        buffer: Buffer,
        fileName: string,
        folder: string,
        mimeType: string
    ): Promise<UploadResult> {
        if (!this.config.local) {
            throw new Error('Local storage configuration not found');
        }

        const uploadPath = this.config.local.uploadPath;
        const folderPath = path.join(uploadPath, folder);

        // Ensure directory exists
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const filePath = path.join(folderPath, fileName);
        const relativePath = path.join(folder, fileName);

        // Write file
        fs.writeFileSync(filePath, buffer);

        return {
            fileName,
            filePath: relativePath,
            publicUrl: `${this.config.local.publicUrl}/${relativePath.replace(/\\/g, '/')}`,
            size: buffer.length,
        };
    }

    private async uploadToS3(
        buffer: Buffer,
        fileName: string,
        folder: string,
        mimeType: string
    ): Promise<UploadResult> {
        // AWS S3 implementation
        try {
            const AWS = require('aws-sdk');

            if (!this.config.aws) {
                throw new Error('AWS S3 configuration not found');
            }

            const s3 = new AWS.S3({
                region: this.config.aws.region,
                accessKeyId: this.config.aws.accessKeyId,
                secretAccessKey: this.config.aws.secretAccessKey,
            });

            const key = `${folder}/${fileName}`;

            const uploadParams = {
                Bucket: this.config.aws.bucket,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
                ACL: 'public-read',
            };

            const result = await s3.upload(uploadParams).promise();

            return {
                fileName,
                filePath: key,
                publicUrl: result.Location,
                size: buffer.length,
            };
        } catch (error) {
            this.logger.error(`S3 upload failed: ${error.message}`);
            throw new Error(`Failed to upload to S3: ${error.message}`);
        }
    }

    private async uploadToAzure(
        buffer: Buffer,
        fileName: string,
        folder: string,
        mimeType: string
    ): Promise<UploadResult> {
        // Azure Blob Storage implementation
        try {
            const { BlobServiceClient } = require('@azure/storage-blob');

            if (!this.config.azure) {
                throw new Error('Azure storage configuration not found');
            }

            const blobServiceClient = BlobServiceClient.fromConnectionString(
                this.config.azure.connectionString
            );

            const containerClient = blobServiceClient.getContainerClient(
                this.config.azure.containerName
            );

            const blobName = `${folder}/${fileName}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            await blockBlobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: {
                    blobContentType: mimeType,
                },
            });

            const publicUrl = `${this.config.azure.publicUrl}/${this.config.azure.containerName}/${blobName}`;

            return {
                fileName,
                filePath: blobName,
                publicUrl,
                size: buffer.length,
            };
        } catch (error) {
            this.logger.error(`Azure upload failed: ${error.message}`);
            throw new Error(`Failed to upload to Azure: ${error.message}`);
        }
    }

    private async uploadToGoogleCloud(
        buffer: Buffer,
        fileName: string,
        folder: string,
        mimeType: string
    ): Promise<UploadResult> {
        // Google Cloud Storage implementation
        try {
            const { Storage } = require('@google-cloud/storage');

            if (!this.config.google) {
                throw new Error('Google Cloud storage configuration not found');
            }

            const storage = new Storage({
                projectId: this.config.google.projectId,
                keyFilename: this.config.google.keyFilename,
            });

            const bucket = storage.bucket(this.config.google.bucket);
            const fileName_full = `${folder}/${fileName}`;
            const file = bucket.file(fileName_full);

            await file.save(buffer, {
                metadata: {
                    contentType: mimeType,
                },
                public: true,
            });

            const publicUrl = `${this.config.google.publicUrl}/${this.config.google.bucket}/${fileName_full}`;

            return {
                fileName,
                filePath: fileName_full,
                publicUrl,
                size: buffer.length,
            };
        } catch (error) {
            this.logger.error(`Google Cloud upload failed: ${error.message}`);
            throw new Error(`Failed to upload to Google Cloud: ${error.message}`);
        }
    }

    private async uploadToDigitalOceanSpaces(
        buffer: Buffer,
        fileName: string,
        folder: string,
        mimeType: string
    ): Promise<UploadResult> {
        // Digital Ocean Spaces implementation (S3-compatible)
        try {
            const AWS = require('aws-sdk');

            if (!this.config.doSpaces) {
                throw new Error('Digital Ocean Spaces configuration not found');
            }

            // Digital Ocean Spaces uses S3-compatible API
            const spacesEndpoint = new AWS.Endpoint(this.config.doSpaces.endpoint);
            const s3 = new AWS.S3({
                endpoint: spacesEndpoint,
                accessKeyId: this.config.doSpaces.accessKey,
                secretAccessKey: this.config.doSpaces.secretKey,
            });

            const key = `${folder}/${fileName}`;

            const uploadParams = {
                Bucket: this.config.doSpaces.bucket,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
                ACL: 'public-read',
            };

            const result = await s3.upload(uploadParams).promise();

            // Use CDN URL if available, otherwise use direct URL
            const publicUrl = this.config.doSpaces.cdnUrl
                ? `${this.config.doSpaces.cdnUrl}/${key}`
                : result.Location;

            return {
                fileName,
                filePath: key,
                publicUrl,
                size: buffer.length,
            };
        } catch (error) {
            this.logger.error(`Digital Ocean Spaces upload failed: ${error.message}`);
            throw new Error(`Failed to upload to DO Spaces: ${error.message}`);
        }
    }

    async deleteFile(filePath: string): Promise<boolean> {
        switch (this.config.provider) {
            case 'local':
                return this.deleteFromLocal(filePath);
            case 'aws-s3':
                return this.deleteFromS3(filePath);
            case 'azure-blob':
                return this.deleteFromAzure(filePath);
            case 'google-cloud':
                return this.deleteFromGoogleCloud(filePath);
            case 'do-spaces':
                return this.deleteFromDigitalOceanSpaces(filePath);
            default:
                return false;
        }
    }

    private async deleteFromLocal(filePath: string): Promise<boolean> {
        try {
            if (!this.config.local) return false;

            const fullPath = path.join(this.config.local.uploadPath, filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Failed to delete local file: ${error.message}`);
            return false;
        }
    }

    private async deleteFromS3(filePath: string): Promise<boolean> {
        try {
            const AWS = require('aws-sdk');
            if (!this.config.aws) return false;

            const s3 = new AWS.S3({
                region: this.config.aws.region,
                accessKeyId: this.config.aws.accessKeyId,
                secretAccessKey: this.config.aws.secretAccessKey,
            });

            await s3.deleteObject({
                Bucket: this.config.aws.bucket,
                Key: filePath,
            }).promise();

            return true;
        } catch (error) {
            this.logger.error(`Failed to delete S3 file: ${error.message}`);
            return false;
        }
    }

    private async deleteFromAzure(filePath: string): Promise<boolean> {
        try {
            const { BlobServiceClient } = require('@azure/storage-blob');
            if (!this.config.azure) return false;

            const blobServiceClient = BlobServiceClient.fromConnectionString(
                this.config.azure.connectionString
            );

            const containerClient = blobServiceClient.getContainerClient(
                this.config.azure.containerName
            );

            await containerClient.deleteBlob(filePath);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete Azure file: ${error.message}`);
            return false;
        }
    }

    private async deleteFromGoogleCloud(filePath: string): Promise<boolean> {
        try {
            const { Storage } = require('@google-cloud/storage');
            if (!this.config.google) return false;

            const storage = new Storage({
                projectId: this.config.google.projectId,
                keyFilename: this.config.google.keyFilename,
            });

            const bucket = storage.bucket(this.config.google.bucket);
            await bucket.file(filePath).delete();
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete Google Cloud file: ${error.message}`);
            return false;
        }
    }

    private async deleteFromDigitalOceanSpaces(filePath: string): Promise<boolean> {
        try {
            const AWS = require('aws-sdk');
            if (!this.config.doSpaces) return false;

            const spacesEndpoint = new AWS.Endpoint(this.config.doSpaces.endpoint);
            const s3 = new AWS.S3({
                endpoint: spacesEndpoint,
                accessKeyId: this.config.doSpaces.accessKey,
                secretAccessKey: this.config.doSpaces.secretKey,
            });

            await s3.deleteObject({
                Bucket: this.config.doSpaces.bucket,
                Key: filePath,
            }).promise();

            return true;
        } catch (error) {
            this.logger.error(`Failed to delete Digital Ocean Spaces file: ${error.message}`);
            return false;
        }
    }
}
