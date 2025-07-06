export interface StorageConfig {
    provider: 'local' | 'aws-s3' | 'azure-blob' | 'google-cloud' | 'do-spaces';
    local?: {
        uploadPath: string;
        publicUrl: string;
    };
    aws?: {
        region: string;
        bucket: string;
        accessKeyId: string;
        secretAccessKey: string;
        publicUrl: string;
    };
    doSpaces?: {
        endpoint: string;
        bucket: string;
        accessKey: string;
        secretKey: string;
        publicUrl: string;
        cdnUrl?: string;
    };
    azure?: {
        connectionString: string;
        containerName: string;
        publicUrl: string;
    };
    google?: {
        projectId: string;
        keyFilename: string;
        bucket: string;
        publicUrl: string;
    };
}

export const getStorageConfig = (): StorageConfig => {
    const provider = process.env.STORAGE_PROVIDER as StorageConfig['provider'] || 'local';

    const config: StorageConfig = {
        provider,
    };

    switch (provider) {
        case 'local':
            config.local = {
                uploadPath: process.env.UPLOAD_PATH || './uploads',
                publicUrl: process.env.PUBLIC_URL || 'http://localhost:3001/uploads',
            };
            break;

        case 'aws-s3':
            config.aws = {
                region: process.env.AWS_REGION || 'ap-southeast-1',
                bucket: process.env.AWS_S3_BUCKET || '',
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                publicUrl: process.env.AWS_S3_PUBLIC_URL || '',
            };
            break;

        case 'azure-blob':
            config.azure = {
                connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
                containerName: process.env.AZURE_CONTAINER_NAME || 'question-files',
                publicUrl: process.env.AZURE_PUBLIC_URL || '',
            };
            break;

        case 'google-cloud':
            config.google = {
                projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
                keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || '',
                bucket: process.env.GOOGLE_CLOUD_BUCKET || '',
                publicUrl: process.env.GOOGLE_CLOUD_PUBLIC_URL || '',
            };
            break;

        case 'do-spaces':
            config.doSpaces = {
                endpoint: process.env.DO_SPACES_ENDPOINT || '',
                bucket: process.env.DO_SPACES_BUCKET || '',
                accessKey: process.env.DO_SPACES_ACCESS_KEY || '',
                secretKey: process.env.DO_SPACES_SECRET_KEY || '',
                publicUrl: process.env.DO_SPACES_PUBLIC_URL || '',
                cdnUrl: process.env.DO_SPACES_CDN_URL || '',
            };
            break;
    }

    return config;
};
