// Define MulterFile type for type safety
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    path?: string; // Add optional path property for direct file access
}
