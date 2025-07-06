import { registerAs } from '@nestjs/config';

export default registerAs('spaces', () => ({
    endpoint: process.env.DO_SPACES_ENDPOINT || 'sgp1.digitaloceanspaces.com',
    bucket: process.env.DO_SPACES_BUCKET || 'datauploads',
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
    region: process.env.DO_SPACES_REGION || 'sgp1',
    cdnEndpoint: process.env.DO_SPACES_CDN || 'datauploads.sgp1.cdn.digitaloceanspaces.com',
    publicUrl: process.env.DO_SPACES_PUBLIC_URL || 'datauploads.sgp1.digitaloceanspaces.com',
    forcePathStyle: true,
    signatureVersion: 'v4',
}));

/**
 * Helper class để build URLs từ file info - KHÔNG CẦN MODIFY DATABASE
 */
export class SpacesUrlBuilder {
    private static readonly CONFIG = {
        bucket: process.env.DO_SPACES_BUCKET || 'datauploads',
        region: process.env.DO_SPACES_REGION || 'sgp1',
        publicDomain: process.env.DO_SPACES_PUBLIC_URL || 'datauploads.sgp1.digitaloceanspaces.com',
        cdnDomain: process.env.DO_SPACES_CDN || 'datauploads.sgp1.cdn.digitaloceanspaces.com',
    };

    /**
     * Build CDN URL cho file
     */
    static buildCdnUrl(fileName: string, fileType: number): string {
        const folder = SpacesUrlBuilder.getFolderByType(fileType);
        return `https://${SpacesUrlBuilder.CONFIG.cdnDomain}/${folder}/${fileName}`;
    }

    /**
     * Build Public URL cho file
     */
    static buildPublicUrl(fileName: string, fileType: number): string {
        const folder = SpacesUrlBuilder.getFolderByType(fileType);
        return `https://${SpacesUrlBuilder.CONFIG.publicDomain}/${folder}/${fileName}`;
    }

    /**
     * Build Spaces Key cho file
     */
    static buildSpacesKey(fileName: string, fileType: number): string {
        const folder = SpacesUrlBuilder.getFolderByType(fileType);
        return `${folder}/${fileName}`;
    }

    /**
     * Lấy folder name theo loại file
     */
    static getFolderByType(fileType: number): string {
        switch (fileType) {
            case 1: return 'audio';
            case 2: return 'images';
            case 3: return 'documents';
            case 4: return 'videos';
            default: return 'files';
        }
    }
}
